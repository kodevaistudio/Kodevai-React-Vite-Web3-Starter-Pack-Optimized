import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContractInstance } from '../lib/contract';

function ContractInteraction({ signer }) {
  const [contractAddress, setContractAddress] = useState('');
  const [contractAbi, setContractAbi] = useState('');
  const [contract, setContract] = useState(null);
  const [functionName, setFunctionName] = useState('');
  const [functionArgs, setFunctionArgs] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize contract when address and ABI are provided
  useEffect(() => {
    if (contractAddress && contractAbi && signer) {
      try {
        const parsedAbi = JSON.parse(contractAbi);
        const contractInstance = new ethers.Contract(contractAddress, parsedAbi, signer);
        setContract(contractInstance);
        setError('');
      } catch (err) {
        setError('Invalid ABI format');
        setContract(null);
      }
    }
  }, [contractAddress, contractAbi, signer]);

  const handleCallFunction = async (e) => {
    e.preventDefault();
    if (!contract || !functionName) return;

    setLoading(true);
    setResult('');
    setError('');

    try {
      // Parse arguments if provided
      const args = functionArgs.trim() ? 
        functionArgs.split(',').map(arg => arg.trim()) : 
        [];
      
      // Call the contract function
      const response = await contract[functionName](...args);
      
      // Format the result based on type
      let formattedResult;
      if (ethers.isAddress(response)) {
        formattedResult = response;
      } else if (typeof response === 'bigint') {
        formattedResult = response.toString();
      } else {
        formattedResult = JSON.stringify(response);
      }
      
      setResult(formattedResult);
    } catch (err) {
      setError(err.message || 'Error calling contract function');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Contract Address</label>
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="0x..."
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Contract ABI</label>
        <textarea
          value={contractAbi}
          onChange={(e) => setContractAbi(e.target.value)}
          placeholder="[{...}]"
          rows={3}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      
      {contract && (
        <form onSubmit={handleCallFunction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Function Name</label>
            <input
              type="text"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              placeholder="balanceOf"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Arguments (comma separated)</label>
            <input
              type="text"
              value={functionArgs}
              onChange={(e) => setFunctionArgs(e.target.value)}
              placeholder="0x1234...,100"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Calling...' : 'Call Function'}
          </button>
        </form>
      )}
      
      {error && (
        <div className="p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      {result && (
        <div className="p-3 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md overflow-x-auto">
          <p className="font-mono">{result}</p>
        </div>
      )}
    </div>
  );
}

export default ContractInteraction;
