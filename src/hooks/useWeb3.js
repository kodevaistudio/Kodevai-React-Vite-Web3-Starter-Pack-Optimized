import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export function useWeb3() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error("No Ethereum browser extension detected");
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.getAddress(accounts[0]); // Normalize address format
      
      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get network information
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Update state
      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      setChainId(chainId);
      setError(null);
      
      return { provider, signer, account, chainId };
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setError(error.message);
      return null;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
  }, []);

  const switchNetwork = useCallback(async (chainId) => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (error) {
      console.error("Error switching network:", error);
      setError(error.message);
      return false;
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnectWallet();
      } else {
        setAccount(ethers.getAddress(accounts[0]));
      }
    };

    const handleChainChanged = (chainIdHex) => {
      setChainId(Number(chainIdHex));
      window.location.reload(); // Recommended by MetaMask
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Auto-connect if previously connected
    if (localStorage.getItem('walletConnected') === 'true') {
      connectWallet();
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [connectWallet, disconnectWallet]);

  // Save connection state to localStorage
  useEffect(() => {
    if (account) {
      localStorage.setItem('walletConnected', 'true');
    } else {
      localStorage.removeItem('walletConnected');
    }
  }, [account]);

  return {
    provider,
    signer,
    account,
    chainId,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
}
