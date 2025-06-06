import { promises as fs } from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function compile() {
  try {
    // Create necessary directories if they don't exist
    const artifactsDir = path.resolve(__dirname, '../artifacts');
    await fs.mkdir(artifactsDir, { recursive: true });
    
    // Get dynamic compiler version with commit hash
    const compilerVersion = getCompilerVersion();
    console.log('Using compiler version:', compilerVersion);
    
    // Read the contract file
    const contractsDir = path.resolve(__dirname, '../contracts');
    const contractFiles = await fs.readdir(contractsDir);
    
    for (const file of contractFiles) {
      if (!file.endsWith('.sol')) continue;
      
      const contractPath = path.resolve(contractsDir, file);
      const contractSource = await fs.readFile(contractPath, 'utf8');
      
      // Extract contract name from filename
      const contractName = path.basename(file, '.sol');
      
      console.log(`Compiling ${contractName}...`);
      
      // Prepare input for solc compiler
      const input = {
        language: 'Solidity',
        sources: {
          [file]: {
            content: contractSource
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata']
            }
          },
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      };
      
      // Compile the contract
      const output = JSON.parse(solc.compile(JSON.stringify(input)));
      
      // Check for errors
      if (output.errors) {
        const hasError = output.errors.some(error => error.severity === 'error');
        
        output.errors.forEach(error => {
          const prefix = error.severity === 'error' ? '❌ Error:' : '⚠️ Warning:';
          console.log(`${prefix} ${error.formattedMessage}`);
        });
        
        if (hasError) {
          throw new Error('Compilation failed due to errors');
        }
      }
      
      // Extract compilation results
      const contract = output.contracts[file][contractName];
      
      if (!contract) {
        throw new Error(`Contract ${contractName} not found in compilation output`);
      }
      
      // Extract ABI and bytecode
      const abi = contract.abi;
      const bytecode = contract.evm.bytecode.object;
      const deployedBytecode = contract.evm.deployedBytecode.object;
      
      // Extract license from SPDX identifier
      const licenseMatch = contractSource.match(/SPDX-License-Identifier: (.*?)(\r?\n|\*\/)/);
      const license = licenseMatch ? licenseMatch[1].trim() : 'UNLICENSED';
      
      // Extract pragma from source
      const pragmaMatch = contractSource.match(/pragma solidity (.*?);/);
      const pragma = pragmaMatch ? pragmaMatch[1].trim() : '0.8.20';
      
      // Save compilation output
      const artifactPath = path.resolve(artifactsDir, `${contractName}.json`);
      await fs.writeFile(
        artifactPath,
        JSON.stringify({
          contractName,
          abi,
          bytecode,
          deployedBytecode,
          metadata: contract.metadata
        }, null, 2)
      );
      
      // Save compilation settings for verification
      const settingsPath = path.resolve(artifactsDir, 'compilation-settings.json');
      await fs.writeFile(
        settingsPath,
        JSON.stringify({
          contractName,
          solcVersion: compilerVersion,
          optimization: {
            enabled: true,
            runs: 200
          },
          pragma,
          license,
          deployedBytecode,
          compilationTimestamp: new Date().toISOString()
        }, null, 2)
      );
      
      console.log(`✅ Successfully compiled ${contractName}`);
      console.log(`📁 Artifacts saved to ${artifactPath}`);
    }
    
    return true;
  } catch (error) {
    console.error('Compilation failed:', error.message);
    return false;
  }
}

function getCompilerVersion() {
  try {
    // Get full version string from solc
    const fullVersion = solc.version();
    console.log('Full solc version:', fullVersion);
    
    // Extract version with commit hash for BSCScan
    const versionMatch = fullVersion.match(/(\d+\.\d+\.\d+\+commit\.[a-f0-9]+)/);
    if (versionMatch) {
      return versionMatch[1]; // Returns: "0.8.20+commit.a1b79de6"
    }
    
    // Fallback: extract just semantic version
    const semanticMatch = fullVersion.match(/(\d+\.\d+\.\d+)/);
    if (semanticMatch) {
      console.warn('Using semantic version only - verification may fail');
      return semanticMatch[1]; // Returns: "0.8.20"
    }
    
    throw new Error('Could not extract version from: ' + fullVersion);
  } catch (error) {
    console.error('Version detection failed:', error.message);
    return '0.8.20'; // Fallback
  }
}

// Execute compilation if this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  compile();
}

export default compile;
