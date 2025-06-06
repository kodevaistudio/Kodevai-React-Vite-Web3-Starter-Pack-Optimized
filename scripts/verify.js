import { ethers } from 'ethers';
import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function verifyContract() {
  try {
    // Get contract name and network from command line args or use defaults
    const contractName = process.argv[2] || 'SimpleStorage';
    const network = process.argv[3] || process.env.NETWORK || 'bsc-testnet';
    
    console.log(`Verifying ${contractName} on ${network}...`);
    
    // Load compilation settings
    const settingsPath = path.resolve(__dirname, '../artifacts/compilation-settings.json');
    const compilationSettings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    
    // Extract version for BSCScan format
    const solcVersion = compilationSettings.solcVersion;
    console.log('Using compiler version:', solcVersion);
    
    // Validate version format for BSCScan
    if (!solcVersion.includes('+commit.')) {
      console.warn('⚠️ Version missing commit hash - this may cause verification failure');
      console.warn(`Current version: ${solcVersion}`);
      console.warn('Expected format: 0.8.20+commit.a1b79de6');
    }
    
    // Load deployment info
    const deploymentFile = path.resolve(__dirname, `../deployments/${network}.json`);
    const deployment = JSON.parse(await fs.readFile(deploymentFile, 'utf8'));
    
    // Verify bytecode match first
    const provider = new ethers.JsonRpcProvider(getRpcUrl(network));
    const deployedBytecode = await provider.getCode(deployment.contractAddress);
    
    console.log('Verifying bytecode match...');
    if (!deployedBytecode.includes(compilationSettings.deployedBytecode.slice(2))) {
      throw new Error('Deployed bytecode does not match compiled bytecode');
    }
    
    // Use pre-encoded constructor args from deployment if available
    let encodedArgs;
    if (deployment.encodedConstructorArgs) {
      encodedArgs = deployment.encodedConstructorArgs;
      console.log('Using pre-encoded constructor arguments');
    } else {
      // Fallback: encode constructor arguments
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      encodedArgs = abiCoder.encode(
        deployment.constructorTypes || [],
        deployment.constructorArgs || []
      ).slice(2); // Remove 0x prefix
    }
    
    // Read contract source code
    const sourceCode = await fs.readFile(
      path.resolve(__dirname, '../contracts/', compilationSettings.contractName + '.sol'),
      'utf8'
    );
    
    // Prepare verification payload
    const verificationPayload = {
      apikey: getApiKey(network),
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: deployment.contractAddress,
      sourceCode: sourceCode,
      codeformat: 'solidity-single-file',
      contractname: compilationSettings.contractName,
      compilerversion: 'v' + solcVersion, // Full version with commit hash
      optimizationUsed: compilationSettings.optimization.enabled ? '1' : '0',
      runs: compilationSettings.optimization.runs.toString(),
      constructorArguements: encodedArgs,
      licenseType: getLicenseType(compilationSettings.license)
    };
    
    console.log('Verification parameters:', {
      compiler: verificationPayload.compilerversion,
      optimization: verificationPayload.optimizationUsed,
      runs: verificationPayload.runs,
      constructorArgs: verificationPayload.constructorArguements
    });
    
    // Submit verification
    console.log(`Submitting verification to ${getApiUrl(network)}...`);
    const response = await submitVerification(getApiUrl(network), verificationPayload);
    
    if (response.status === '1') {
      console.log('Verification submitted. GUID:', response.result);
      // Store verification details after successful submission
      await storeVerificationDetails(network, deployment, response.result, compilationSettings);

      await pollVerificationStatus(getApiUrl(network), getApiKey(network), response.result, network, deployment);
    } else {
      throw new Error('Verification submission failed: ' + response.message);
    }
    
  } catch (error) {
    if (error.message.includes('Invalid Or Not supported solc version')) {
      console.error('❌ Compiler version not supported by block explorer');
      console.error('Current version format:', compilationSettings.solcVersion);
      console.error('BSCScan expects format: 0.8.20+commit.a1b79de6');
      console.error('Solution: Use Solidity 0.8.20 and recompile');
      console.error('Run: npm run compile && npm run deploy && npm run verify');
    }
    console.error('Verification failed:', error.message);
    process.exit(1);
  }
}

async function storeVerificationDetails(network, deployment, guid, compilationSettings) {
  try {
    // Update deployment file with verification details
    const updatedDeployment = {
      ...deployment,
      verification: {
        status: 'submitted',
        guid: guid,
        submittedAt: new Date().toISOString(),
        compilerVersion: compilationSettings.solcVersion,
        explorerUrl: getExplorerUrl(network, deployment.contractAddress)
      }
    };
    
    const deploymentFile = path.resolve(__dirname, `../deployments/${network}.json`);
    await fs.writeFile(deploymentFile, JSON.stringify(updatedDeployment, null, 2));
    
    console.log('📝 Verification details stored in deployment file');
  } catch (error) {
    console.warn('Warning: Could not store verification details:', error.message);
  }
}

function getRpcUrl(network) {
  const urls = {
    'bsc': process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/',
    'bsc-testnet': process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    'ethereum': process.env.ETH_MAINNET_RPC_URL,
    'sepolia': process.env.ETH_SEPOLIA_RPC_URL
  };
  return urls[network] || urls['bsc-testnet'];
}

function getApiKey(network) {
  return network.includes('bsc') ? 
    process.env.BSCSCAN_API_KEY : 
    process.env.ETHERSCAN_API_KEY;
}

function getApiUrl(network) {
  const urls = {
    'bsc': 'https://api.bscscan.com/api',
    'bsc-testnet': 'https://api-testnet.bscscan.com/api',
    'ethereum': 'https://api.etherscan.io/api',
    'sepolia': 'https://api-sepolia.etherscan.io/api'
  };
  return urls[network] || urls['bsc-testnet'];
}

function getExplorerUrl(network, contractAddress) {
  const baseUrls = {
    'bsc': 'https://bscscan.com',
    'bsc-testnet': 'https://testnet.bscscan.com',
    'ethereum': 'https://etherscan.io',
    'sepolia': 'https://sepolia.etherscan.io'
  };
  const baseUrl = baseUrls[network] || baseUrls['bsc-testnet'];
  return `${baseUrl}/address/${contractAddress}#contracts`;
}

function getLicenseType(license) {
  const types = {
    'MIT': '3',
    'GPL-3.0': '9',
    'Apache-2.0': '2',
    'BSD-3-Clause': '8',
    'Unlicense': '12'
  };
  return types[license] || '3'; // Default to MIT
}

async function submitVerification(apiUrl, payload) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(payload)
  });
  return await response.json();
}

async function pollVerificationStatus(apiUrl, apiKey, guid, network, deployment) {
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const statusResponse = await fetch(`${apiUrl}?module=contract&action=checkverifystatus&guid=${guid}&apikey=${apiKey}`);
    const result = await statusResponse.json();
    
    console.log(`Check ${i + 1}: ${result.result}`);
    
    if (result.result === 'Pass - Verified') {
      console.log('✅ Contract verified successfully!');

      await updateVerificationStatus(network, deployment, 'verified', guid);

      // Log explorer URL for easy access
      console.log(`🔗 View verified contract: ${getExplorerUrl(network, deployment.contractAddress)}`);
      return;
    } else if (result.result.includes('Fail')) {
      await updateVerificationStatus(network, deployment, 'failed', guid, result.result);
      throw new Error('Verification failed: ' + result.result);
    }
  }
  await updateVerificationStatus(network, deployment, 'timeout', guid);
  throw new Error('Verification timeout');
}

async function updateVerificationStatus(network, deployment, status, guid, failureReason = null) {
  try {
    const deploymentFile = path.resolve(__dirname, `../deployments/${network}.json`);
    const currentDeployment = JSON.parse(await fs.readFile(deploymentFile, 'utf8'));
    
    const updatedDeployment = {
      ...currentDeployment,
      verification: {
        ...currentDeployment.verification,
        status: status,
        verifiedAt: status === 'verified' ? new Date().toISOString() : currentDeployment.verification?.verifiedAt,
        failureReason: failureReason
      }
    };
    
    await fs.writeFile(deploymentFile, JSON.stringify(updatedDeployment, null, 2));
  } catch (error) {
    console.warn('Warning: Could not update verification status:', error.message);
  }
}

// Execute verification if this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifyContract();
}

export default verifyContract;
