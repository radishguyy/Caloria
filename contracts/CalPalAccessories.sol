// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CalPalAccessories
 * @notice Tradeable ERC-1155 NFT contract for Caloria's CalPal wardrobe items
 *         (hats, glasses, outfits, held food, skin auras, habitat rooms).
 *         Self-contained (zero external imports) for $0-cost deployment via Remix IDE
 *         on Base Sepolia or Base Mainnet.
 *
 * Key Features:
 * - Full ERC-1155 tradeable semi-fungible token standard
 * - EIP-712 Lazy-Mint Vouchers (`mintWithVoucher`) signed off-chain by the Caloria backend
 *   so the backend pays $0 gas and users only pay tiny L2 gas when claiming an item on-chain.
 * - Dynamic metadata URI: `<baseURI><tokenId>/metadata`
 */
contract CalPalAccessories {
    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------
    error NotOwner();
    error ZeroAddress();
    error NotAuthorized();
    error InsufficientBalance();
    error LengthMismatch();
    error UnsafeRecipient();
    error VoucherExpired();
    error NonceAlreadyUsed();
    error InvalidSignature();
    error InvalidAmount();

    // -------------------------------------------------------------------------
    // Events (ERC-1155 + Admin)
    // -------------------------------------------------------------------------
    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
    event ApprovalForAll(
        address indexed account,
        address indexed operator,
        bool approved
    );
    event URI(string value, uint256 indexed id);

    event AccessoryMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 nonce
    );
    event VoucherSignerUpdated(address indexed newSigner);
    event BaseURIUpdated(string newBaseURI);

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    string public constant name = "Caloria CalPal Accessories";
    string public constant symbol = "CALACC";

    address public contractOwner;
    address public voucherSigner;
    string private _baseURI;

    // tokenId => owner => balance
    mapping(uint256 => mapping(address => uint256)) private _balances;
    // owner => operator => approved
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    // user => nonce => used
    mapping(address => mapping(uint256 => bool)) public usedNonces;

    // EIP-712 Domain & TypeHash
    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 private constant MINT_VOUCHER_TYPEHASH = keccak256(
        "MintVoucher(address to,uint256 tokenId,uint256 amount,uint256 nonce,uint256 deadline)"
    );
    bytes32 public immutable DOMAIN_SEPARATOR;

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------
    modifier onlyOwner() {
        if (msg.sender != contractOwner) revert NotOwner();
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    /**
     * @param initialBaseURI Example: "http://localhost:3000/api/nft/accessory/"
     * @param initialVoucherSigner Address corresponding to NFT_VOUCHER_SIGNER_PRIVATE_KEY
     */
    constructor(string memory initialBaseURI, address initialVoucherSigner) {
        if (initialVoucherSigner == address(0)) revert ZeroAddress();
        contractOwner = msg.sender;
        voucherSigner = initialVoucherSigner;
        _baseURI = initialBaseURI;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes("CalPalAccessories")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    // -------------------------------------------------------------------------
    // Lazy Minting via EIP-712 Server Voucher
    // -------------------------------------------------------------------------
    function mintWithVoucher(
        uint256 tokenId,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (amount == 0) revert InvalidAmount();
        if (block.timestamp > deadline) revert VoucherExpired();
        if (usedNonces[msg.sender][nonce]) revert NonceAlreadyUsed();

        bytes32 structHash = keccak256(
            abi.encode(
                MINT_VOUCHER_TYPEHASH,
                msg.sender,
                tokenId,
                amount,
                nonce,
                deadline
            )
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        address recovered = _recoverSigner(digest, signature);
        if (recovered == address(0) || recovered != voucherSigner) {
            revert InvalidSignature();
        }

        usedNonces[msg.sender][nonce] = true;
        _balances[tokenId][msg.sender] += amount;

        emit TransferSingle(msg.sender, address(0), msg.sender, tokenId, amount);
        emit AccessoryMinted(msg.sender, tokenId, amount, nonce);
    }

    // -------------------------------------------------------------------------
    // ERC-1155 Views
    // -------------------------------------------------------------------------
    function uri(uint256 id) external view returns (string memory) {
        return string(abi.encodePacked(_baseURI, _toString(id), "/metadata"));
    }

    function balanceOf(address account, uint256 id) public view returns (uint256) {
        if (account == address(0)) revert ZeroAddress();
        return _balances[id][account];
    }

    function balanceOfBatch(
        address[] calldata accounts,
        uint256[] calldata ids
    ) external view returns (uint256[] memory batchBalances) {
        if (accounts.length != ids.length) revert LengthMismatch();
        batchBalances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }
    }

    function isApprovedForAll(
        address account,
        address operator
    ) public view returns (bool) {
        return _operatorApprovals[account][operator];
    }

    // -------------------------------------------------------------------------
    // ERC-1155 Approvals & Transfers (Tradeable!)
    // -------------------------------------------------------------------------
    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external {
        if (to == address(0)) revert ZeroAddress();
        if (from != msg.sender && !isApprovedForAll(from, msg.sender)) {
            revert NotAuthorized();
        }
        uint256 fromBalance = _balances[id][from];
        if (fromBalance < amount) revert InsufficientBalance();

        unchecked {
            _balances[id][from] = fromBalance - amount;
        }
        _balances[id][to] += amount;

        emit TransferSingle(msg.sender, from, to, id, amount);
        _doSafeTransferAcceptanceCheck(msg.sender, from, to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external {
        if (to == address(0)) revert ZeroAddress();
        if (ids.length != amounts.length) revert LengthMismatch();
        if (from != msg.sender && !isApprovedForAll(from, msg.sender)) {
            revert NotAuthorized();
        }

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];
            uint256 fromBalance = _balances[id][from];
            if (fromBalance < amount) revert InsufficientBalance();
            unchecked {
                _balances[id][from] = fromBalance - amount;
            }
            _balances[id][to] += amount;
        }

        emit TransferBatch(msg.sender, from, to, ids, amounts);
        _doSafeBatchTransferAcceptanceCheck(msg.sender, from, to, ids, amounts, data);
    }

    // -------------------------------------------------------------------------
    // Admin Controls
    // -------------------------------------------------------------------------
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function setVoucherSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        voucherSigner = newSigner;
        emit VoucherSignerUpdated(newSigner);
    }

    function transferContractOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        contractOwner = newOwner;
    }

    // -------------------------------------------------------------------------
    // ERC-165 Interface Support
    // -------------------------------------------------------------------------
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC-165
            interfaceId == 0xd9b67a26 || // ERC-1155
            interfaceId == 0x0e89341c;   // ERC-1155 Metadata URI
    }

    // -------------------------------------------------------------------------
    // Internal Helpers
    // -------------------------------------------------------------------------
    function _recoverSigner(
        bytes32 digest,
        bytes calldata signature
    ) internal pure returns (address) {
        if (signature.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        return ecrecover(digest, v, r, s);
    }

    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) private {
        if (to.code.length > 0) {
            (bool ok, bytes memory ret) = to.call(
                abi.encodeWithSelector(
                    0xf23a6e61, // onERC1155Received(address,address,uint256,uint256,bytes)
                    operator,
                    from,
                    id,
                    amount,
                    data
                )
            );
            if (!ok || ret.length < 32 || abi.decode(ret, (bytes4)) != 0xf23a6e61) {
                revert UnsafeRecipient();
            }
        }
    }

    function _doSafeBatchTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) private {
        if (to.code.length > 0) {
            (bool ok, bytes memory ret) = to.call(
                abi.encodeWithSelector(
                    0xbc197c81, // onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)
                    operator,
                    from,
                    ids,
                    amounts,
                    data
                )
            );
            if (!ok || ret.length < 32 || abi.decode(ret, (bytes4)) != 0xbc197c81) {
                revert UnsafeRecipient();
            }
        }
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
