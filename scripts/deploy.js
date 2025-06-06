import { ethers } from 'ethers';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

async function deploy() {
  try {
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.resolve(__dirname, '../deployments');
    await fs.mkdir(deploymentsDir, { recursive: true });
    
    // Get contract name from command line args or use default
    const contractName = process.argv[2] || 'SimpleStorage';
    console.log(`Deploying ${contractName}...`);
    
    // Load contract artifact
    const artifactPath = path.resolve(__dirname, `../artifacts/${contractName}.json`);
    const artifact = JSON.parse(await fs.readFile(artifactPath, 'utf8'));
    
    // Get network from command line or environment variable or use default
    const network = process.argv[3] || process.env.NETWORK || 'bsc-testnet';
    console.log(`Target network: ${network}`);
    
    // Get provider based on network
    const provider = getProvider(network);
    
    // Get signer (deployer)
    const signer = await getSigner(provider);
    const address = await signer.getAddress();
    console.log(`Deployer address: ${address}`);
    
    // Check balance
    const balance = await provider.getBalance(address);
    console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH/BNB`);
    
    if (balance === 0n) {
      throw new Error('Deployer has no funds. Please fund your account first.');
    }
    
    // Get network details
    const networkInfo = await provider.getNetwork();
    const chainId = Number(networkInfo.chainId);
    console.log(`Connected to chain ID: ${chainId}`);
    
    // Create contract factory
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      signer
    );
    
    // Deploy contract
    console.log('Deploying contract...');
    
    // Get constructor arguments if any
    const constructorArgs = process.argv.slice(4);
    
    // Estimate gas for deployment
    const deploymentGas = await factory.getDeployTransaction(...constructorArgs).then(tx => {
      return provider.estimateGas({
        from: address,
        data: tx.data
      });
    });
    
    console.log(`Estimated gas: ${deploymentGas.toString()}`);
    
    // Add 20% buffer to gas limit
    const gasLimit = deploymentGas * 120n / 100n;
    
    // Deploy with gas settings appropriate for the network
    const contract = await factory.deploy(...constructorArgs, {
      gasLimit
    });
    
    console.log(`Contract deployment transaction hash: ${contract.deploymentTransaction().hash}`);
    console.log('Waiting for deployment confirmation...');
    
    // Wait for deployment to be confirmed
    await contract.waitForDeployment();
    
    // Get contract address
    const contractAddress = await contract.getAddress();
    console.log(`✅ Contract deployed to: ${contractAddress}`);
    
    // Encode constructor arguments for verification
    let encodedConstructorArgs = '';
    if (constructorArgs.length > 0) {
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const constructorFragment = artifact.abi.find(item => item.type === 'constructor');
      const paramTypes = constructorFragment ? constructorFragment.inputs.map(input => input.type) : [];
      
      encodedConstructorArgs = abiCoder.encode(paramTypes, constructorArgs).slice(2); // Remove 0x prefix
    }
    
    // Save deployment information
    const deploymentInfo = {
      contractName,
      contractAddress,
      deploymentTx: contract.deploymentTransaction().hash,
      deployer: address,
      network,
      chainId,
      timestamp: new Date().toISOString(),
      constructorArgs: constructorArgs.map(arg => 
        typeof arg === 'bigint' ? arg.toString() : arg
      ),
      constructorTypes: artifact.abi.find(item => item.type === 'constructor')?.inputs.map(input => input.type) || [],
      encodedConstructorArgs
    };
    
    // Save deployment info to file
    const deploymentPath = path.resolve(deploymentsDir, `${network}.json`);
    await fs.writeFile(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`📁 Deployment info saved to ${deploymentPath}`);
    
    // Copy deployment info to public directory for frontend access
    const publicDeploymentsDir = path.resolve(__dirname, '../public/deployments');
    await fs.mkdir(publicDeploymentsDir, { recursive: true });
    
    const publicDeploymentPath = path.resolve(publicDeploymentsDir, `${network}.json`);
    await fs.writeFile(publicDeploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`📁 Deployment info copied to public directory for frontend access`);
    
    return {
      success: true,
      contractAddress,
      deploymentTx: contract.deploymentTransaction().hash
    };
  } catch (error) {
    console.error('Deployment failed:', error.message);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('Make sure your account has enough funds for deployment');
    }
    return {
      success: false,
      error: error.message
    };
  }
}

function getProvider(network) {
  // Get RPC URL based on network
  let rpcUrl;
  
  switch (network) {
    case 'bsc':
      rpcUrl = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';
      break;
    case 'bsc-testnet':
      rpcUrl = process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
      break;
    case 'ethereum':
      rpcUrl = process.env.ETH_MAINNET_RPC_URL;
      break;
    case 'sepolia':
      rpcUrl = process.env.ETH_SEPOLIA_RPC_URL;
      break;
    default:
      rpcUrl = process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
  }
  
  if (!rpcUrl) {
    throw new Error(`No RPC URL configured for network: ${network}`);
  }
  
  return new ethers.JsonRpcProvider(rpcUrl);
}

async function getSigner(provider) {
  // Check if private key is provided
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('No private key found in environment variables');
  }
  
  return new ethers.Wallet(privateKey, provider);
}

// Execute deployment if this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  deploy();
}

export default deploy;
