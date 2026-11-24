// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CalPalPet
 * @notice Soulbound (ERC-5192) Dynamic ERC-721 NFT for Caloria's CalPal virtual companions.
 *         Self-contained (zero external imports) so it can be deployed directly via Remix IDE
 *         on Base Sepolia ($0 cost with faucet ETH) or Base Mainnet.
 *
 * Standards implemented:
 * - ERC-165  (Interface Detection)
 * - ERC-721  (Non-Fungible Token)
 * - ERC-721 Metadata (name, symbol, tokenURI)
 * - ERC-5192 (Minimal Soulbound NFTs — non-transferable)
 * - EIP-4906 (Metadata Update Extension for dynamic level/wardrobe refreshes)
 */
contract CalPalPet {
    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------
    error NotOwner();
    error ZeroAddress();
    error AlreadyMinted();
    error TokenDoesNotExist();
    error SoulboundTokenNonTransferable();
    error InvalidSpecies();

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    // ERC-5192 Soulbound event
    event Locked(uint256 tokenId);

    // EIP-4906 Dynamic metadata refresh events
    event MetadataUpdate(uint256 _tokenId);
    event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);

    // Caloria domain events
    event PetMinted(address indexed owner, uint256 indexed tokenId, string speciesId);
    event BaseURIUpdated(string newBaseURI);

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    string public constant name = "Caloria CalPal";
    string public constant symbol = "CALPAL";

    address public contractOwner;
    string private _baseTokenURI;
    uint256 private _nextTokenId = 1;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(address => uint256) public tokenOfOwner;
    mapping(uint256 => string) public petSpecies;

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
     * @param initialBaseURI Example: "https://your-caloria-domain.vercel.app/api/nft/pet/"
     */
    constructor(string memory initialBaseURI) {
        contractOwner = msg.sender;
        _baseTokenURI = initialBaseURI;
    }

    // -------------------------------------------------------------------------
    // Minting (1 Soulbound CalPal per Wallet — User Pays L2 Gas Only)
    // -------------------------------------------------------------------------
    function mintPet(string calldata speciesId) external returns (uint256 tokenId) {
        if (_balances[msg.sender] > 0) revert AlreadyMinted();
        if (bytes(speciesId).length == 0 || bytes(speciesId).length > 32) {
            revert InvalidSpecies();
        }

        tokenId = _nextTokenId++;
        _owners[tokenId] = msg.sender;
        _balances[msg.sender] = 1;
        tokenOfOwner[msg.sender] = tokenId;
        petSpecies[tokenId] = speciesId;

        emit Transfer(address(0), msg.sender, tokenId);
        emit Locked(tokenId);
        emit PetMinted(msg.sender, tokenId, speciesId);
    }

    // -------------------------------------------------------------------------
    // ERC-721 Views
    // -------------------------------------------------------------------------
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function balanceOf(address owner) external view returns (uint256) {
        if (owner == address(0)) revert ZeroAddress();
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        if (owner == address(0)) revert TokenDoesNotExist();
        return owner;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        if (_owners[tokenId] == address(0)) revert TokenDoesNotExist();
        return string(abi.encodePacked(_baseTokenURI, _toString(tokenId), "/metadata"));
    }

    // -------------------------------------------------------------------------
    // ERC-5192 Soulbound Lock
    // -------------------------------------------------------------------------
    function locked(uint256 tokenId) external view returns (bool) {
        if (_owners[tokenId] == address(0)) revert TokenDoesNotExist();
        return true;
    }

    function approve(address, uint256) external pure {
        revert SoulboundTokenNonTransferable();
    }

    function setApprovalForAll(address, bool) external pure {
        revert SoulboundTokenNonTransferable();
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        if (_owners[tokenId] == address(0)) revert TokenDoesNotExist();
        return address(0);
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    function transferFrom(address, address, uint256) external pure {
        revert SoulboundTokenNonTransferable();
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert SoulboundTokenNonTransferable();
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert SoulboundTokenNonTransferable();
    }

    // -------------------------------------------------------------------------
    // Admin / Dynamic Metadata Controls
    // -------------------------------------------------------------------------
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
        if (_nextTokenId > 1) {
            emit BatchMetadataUpdate(1, _nextTokenId - 1);
        }
    }

    function emitMetadataUpdate(uint256 tokenId) external onlyOwner {
        if (_owners[tokenId] == address(0)) revert TokenDoesNotExist();
        emit MetadataUpdate(tokenId);
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
            interfaceId == 0x80ac58cd || // ERC-721
            interfaceId == 0x5b5e139f || // ERC-721 Metadata
            interfaceId == 0xb45a3c0e || // ERC-5192 Soulbound
            interfaceId == 0x49064906;   // EIP-4906 Metadata Update
    }

    // -------------------------------------------------------------------------
    // Internal Helpers
    // -------------------------------------------------------------------------
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
