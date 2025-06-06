# React + Vite Web3 Starter Pack

An optimized starter template for building decentralized applications with React, Vite, and Ethers.js.

## Features

- ⚡️ **Vite** - Lightning fast build tool
- ⚛️ **React** - UI library
- 🔗 **Ethers.js** - Web3 interaction
- 🔄 **Hot Module Replacement**
- 📱 **Responsive Design** with Tailwind CSS
- 🔒 **Environment Variables**
- 🧩 **Smart Contract Integration**
- 📝 **Solidity Compilation**
- 🚀 **Contract Deployment**
- ✅ **Contract Verification**

## Quick Start

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the development server:
   ```bash
   npm run dev
   ```

## Smart Contract Development

### Compile Contract

```bash
npm run compile
```

This will compile all Solidity contracts in the `contracts/` directory and save artifacts to the `artifacts/` directory.

### Deploy Contract

```bash
npm run deploy [ContractName] [network]
```

Example:
```bash
npm run deploy SimpleStorage bsc-testnet
```

### Verify Contract

```bash
npm run verify [ContractName] [network]
```

Example:
```bash
npm run verify SimpleStorage bsc-testnet
```

## Project Structure

```
/
├── contracts/            # Solidity smart contracts
├── scripts/              # Compilation, deployment, verification scripts
├── artifacts/            # Compiled contract artifacts
├── deployments/          # Deployment records
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Application entry point
│   └── index.css         # Global styles
├── .env.example          # Environment variables template
├── package.json          # Project dependencies
├── vite.config.js        # Vite configuration
└── README.md             # Project documentation
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# BNB Chain Configuration
BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org/
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSCSCAN_API_KEY=your_bscscan_api_key_here

# Ethereum Configuration
ETH_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
ETH_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Deployment Configuration
PRIVATE_KEY=your_private_key_here
NETWORK=bsc-testnet
```

## License

MIT
