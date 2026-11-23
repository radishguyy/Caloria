# Deploying `CalPalPet.sol` to Base Sepolia ($0 Cost)

`CalPalPet.sol` is a self-contained **Soulbound (ERC-5192) Dynamic ERC-721** contract with zero external imports, so you can deploy it in under 2 minutes with **Remix IDE** and free testnet ETH.

## Steps

1. **Get Free Base Sepolia ETH**
   - Connect MetaMask or Coinbase Wallet to **Base Sepolia** (Chain ID `84532`).
   - Claim free testnet ETH from the Coinbase Developer Platform Faucet or Alchemy Base Sepolia Faucet.

2. **Compile & Deploy in Remix**
   - Open [remix.ethereum.org](https://remix.ethereum.org).
   - Create a file named `CalPalPet.sol` and paste the contents of `contracts/CalPalPet.sol`.
   - In **Solidity Compiler**, choose compiler `0.8.24` and click **Compile**.
   - In **Deploy & Run Transactions**:
     - Set **Environment** to `Injected Provider - MetaMask` (ensure network is Base Sepolia `84532`).
     - Pass `initialBaseURI` to the constructor, e.g.:
       `https://your-app-domain.vercel.app/api/nft/pet/`
       *(or `http://localhost:3000/api/nft/pet/` for local testing)*.
     - Click **Deploy** and confirm in your wallet.

3. **Configure Caloria**
   - Copy the deployed contract address into `.env.local`:
     ```env
     NEXT_PUBLIC_CALPAL_PET_CONTRACT_ADDRESS=0xYourDeployedContractAddress
     ```
   - Restart `pnpm dev` and visit `/pet-customization/wardrobe` to mint your Soulbound CalPal!

---

## Deploying `CalPalAccessories.sol` (Phase 3 — Tradeable ERC-1155)

1. **Generate a Dedicated Voucher Signer Key (Needs $0 ETH)**
   - Create a fresh Ethereum keypair (it only signs EIP-712 messages off-chain and never sends transactions).
   - Keep its private key in `.env.local` as `NFT_VOUCHER_SIGNER_PRIVATE_KEY=0x...`.
   - Copy its public address (`0x...`) for the constructor below.

2. **Compile & Deploy in Remix**
   - Paste `contracts/CalPalAccessories.sol` into Remix and compile with Solidity `0.8.24`.
   - Deploy on **Base Sepolia** with:
     - `initialBaseURI`: `http://localhost:3000/api/nft/accessory/` *(or your Vercel URL + `/api/nft/accessory/`)*
     - `initialVoucherSigner`: your voucher signer public address (`0x...`)

3. **Configure Caloria**
   - Add to `.env.local`:
     ```env
     NEXT_PUBLIC_CALPAL_ACCESSORIES_CONTRACT_ADDRESS=0xYourAccessoriesContractAddress
     NFT_VOUCHER_SIGNER_PRIVATE_KEY=0xYourVoucherSignerPrivateKey
     ```
   - Restart `pnpm dev` and visit `/pet-customization/shop` to lazy-mint owned accessories or sync ERC-1155 items from your wallet!
