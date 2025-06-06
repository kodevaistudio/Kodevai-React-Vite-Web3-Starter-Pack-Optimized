import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ConnectWallet from './components/ConnectWallet';
import ContractInteraction from './components/ContractInteraction';
import { useWeb3 } from './hooks/useWeb3';

function App() {
  const { provider, signer, account, chainId, connectWallet, disconnectWallet } = useWeb3();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(!!account);
  }, [account]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            React + Vite Web3 Starter
          </h1>
          <ConnectWallet 
            isConnected={isConnected}
            account={account}
            chainId={chainId}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />
        </div>
      </header>
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="mb-4">Web3 Connection Status</h2>
              {isConnected ? (
                <div className="space-y-2">
                  <p><span className="font-semibold">Account:</span> {account}</p>
                  <p><span className="font-semibold">Chain ID:</span> {chainId}</p>
                  <p><span className="font-semibold">Network:</span> {getNetworkName(chainId)}</p>
                </div>
              ) : (
                <p>Not connected to any wallet. Click the Connect Wallet button to get started.</p>
              )}
            </div>
            
            <div className="card">
              <h2 className="mb-4">Contract Interaction</h2>
              {isConnected ? (
                <ContractInteraction signer={signer} />
              ) : (
                <p>Connect your wallet to interact with smart contracts.</p>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 dark:text-gray-400">
            Built with React + Vite + Ethers.js
          </p>
        </div>
      </footer>
    </div>
  );
}

function getNetworkName(chainId) {
  const networks = {
    1: 'Ethereum Mainnet',
    56: 'BNB Chain',
    97: 'BNB Chain Testnet',
    11155111: 'Sepolia',
    31337: 'Local Hardhat'
  };
  
  return networks[chainId] || `Unknown Network (${chainId})`;
}

export default App;
