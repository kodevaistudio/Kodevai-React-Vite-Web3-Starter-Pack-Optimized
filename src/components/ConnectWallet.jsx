import React from 'react';

function ConnectWallet({ isConnected, account, chainId, onConnect, onDisconnect }) {
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div>
      {isConnected ? (
        <div className="flex items-center space-x-2">
          <div className="hidden md:block px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm">
            {formatAddress(account)}
          </div>
          <button
            onClick={onDisconnect}
            className="btn btn-secondary text-sm"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="btn btn-primary"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}

export default ConnectWallet;
