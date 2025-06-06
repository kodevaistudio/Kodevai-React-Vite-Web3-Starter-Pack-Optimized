import { ethers } from 'ethers';

/**
 * Creates a contract instance with the given address and ABI
 * @param {string} address - The contract address
 * @param {Array|string} abi - The contract ABI (array or JSON string)
 * @param {ethers.Signer|ethers.Provider} signerOrProvider - Signer for write operations, Provider for read-only
 * @returns {ethers.Contract} The contract instance
 */
export function getContractInstance(address, abi, signerOrProvider) {
  try {
    // Parse ABI if it's a string
    const parsedAbi = typeof abi === 'string' ? JSON.parse(abi) : abi;
    
    // Create and return the contract instance
    return new ethers.Contract(address, parsedAbi, signerOrProvider);
  } catch (error) {
    console.error('Error creating contract instance:', error);
    throw error;
  }
}

/**
 * Helper function to format BigInt values for display
 * @param {BigInt|string|number} value - The value to format
 * @param {number} decimals - Number of decimals (default: 18 for ETH)
 * @returns {string} Formatted value as a string
 */
export function formatBigInt(value, decimals = 18) {
  try {
    return ethers.formatUnits(value, decimals);
  } catch (error) {
    console.error('Error formatting BigInt:', error);
    return String(value);
  }
}

/**
 * Helper function to parse string values to BigInt
 * @param {string|number} value - The value to parse
 * @param {number} decimals - Number of decimals (default: 18 for ETH)
 * @returns {BigInt} Parsed value as BigInt
 */
export function parseBigInt(value, decimals = 18) {
  try {
    return ethers.parseUnits(String(value), decimals);
  } catch (error) {
    console.error('Error parsing to BigInt:', error);
    throw error;
  }
}

/**
 * Get network details by chain ID
 * @param {number} chainId - The chain ID
 * @returns {Object} Network details
 */
export function getNetworkDetails(chainId) {
  const networks = {
    1: {
      name: 'Ethereum Mainnet',
      currency: 'ETH',
      explorer: 'https://etherscan.io'
    },
    56: {
      name: 'BNB Chain',
      currency: 'BNB',
      explorer: 'https://bscscan.com'
    },
    97: {
      name: 'BNB Chain Testnet',
      currency: 'tBNB',
      explorer: 'https://testnet.bscscan.com'
    },
    11155111: {
      name: 'Sepolia',
      currency: 'ETH',
      explorer: 'https://sepolia.etherscan.io'
    }
  };
  
  return networks[chainId] || {
    name: `Unknown Network (${chainId})`,
    currency: 'ETH',
    explorer: '#'
  };
}

/**
 * Get explorer URL for address or transaction
 * @param {string} hash - Address or transaction hash
 * @param {number} chainId - The chain ID
 * @param {string} type - Type of URL ('address' or 'tx')
 * @returns {string} Explorer URL
 */
export function getExplorerUrl(hash, chainId, type = 'address') {
  const network = getNetworkDetails(chainId);
  return `${network.explorer}/${type}/${hash}`;
}
