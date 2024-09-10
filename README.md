# Building a Wave Portal dApp on Linea with Foundry: A Comprehensive Tutorial

## Introduction

In this tutorial, we'll build a decentralized application (dApp) called Wave Portal on the Linea network using Foundry for smart contract development. Linea is a Layer 2 scaling solution for Ethereum, offering faster and cheaper transactions while maintaining Ethereum's security guarantees. Foundry is a fast, portable, and modular toolkit for Ethereum application development written in Rust.

Our Wave Portal dApp will allow users to send "waves" with messages, which will be stored on the blockchain. This project will demonstrate key concepts of Web3 development, including smart contract development with Foundry, deployment to Linea, and frontend integration with blockchain technology.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Overview](#project-overview)
3. [Setting Up the Development Environment](#setting-up-the-development-environment)
4. [Smart Contract Development with Foundry](#smart-contract-development-with-foundry)
5. [Testing the Smart Contract](#testing-the-smart-contract)
6. [Deploying the Smart Contract to Linea](#deploying-the-smart-contract-to-linea)
7. [Frontend Development](#frontend-development)
8. [Connecting Frontend to the Smart Contract](#connecting-frontend-to-the-smart-contract)
9. [Testing the dApp](#testing-the-dapp)
10. [Conclusion](#conclusion)

## Prerequisites

Before we begin, make sure you have the following installed:

- Rust (required for Foundry)
- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- Git
- MetaMask browser extension
- A code editor (e.g., Visual Studio Code)

You should also have some basic knowledge of JavaScript, React, and Solidity.

## Project Overview

Our Wave Portal dApp will have the following features:

- Users can connect their MetaMask wallet
- Users can send waves with custom messages
- The total number of waves is displayed
- All waves are listed with the sender's address, message, and timestamp
- Real-time updates when new waves are sent

## Setting Up the Development Environment

First, let's install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Now, let's create our project directory and set up the basic structure:

```bash
mkdir wave-portal-linea
cd wave-portal-linea
forge init smart-contract
mkdir frontend
```

## Smart Contract Development with Foundry

Navigate to the smart-contract directory:

```bash
cd smart-contract
```

Replace the contents of `src/Counter.sol` with our `WavePortal.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract WavePortal {
    uint256 totalWaves;
    
    event NewWave(address indexed from, uint256 timestamp, string message);
    
    struct Wave {
        address waver;
        string message;
        uint256 timestamp;
    }
    
    Wave[] waves;

    constructor() {
        console.log("WavePortal Smart Contract Deployed!");
    }

    function wave(string memory _message) public {
        totalWaves += 1;
        console.log("%s has waved with message %s", msg.sender, _message);

        waves.push(Wave(msg.sender, _message, block.timestamp));

        emit NewWave(msg.sender, block.timestamp, _message);
    }

    function getAllWaves() public view returns (Wave[] memory) {
        return waves;
    }

    function getTotalWaves() public view returns (uint256) {
        return totalWaves;
    }
}
```

## Testing the Smart Contract

Create a new file `test/WavePortal.t.sol` for our tests:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/WavePortal.sol";

contract WavePortalTest is Test {
    WavePortal public wavePortal;
    address alice = address(0x1);
    address bob = address(0x2);

    function setUp() public {
        wavePortal = new WavePortal();
    }

    function testWave() public {
        vm.prank(alice);
        wavePortal.wave("Hello, Linea!");

        assertEq(wavePortal.getTotalWaves(), 1);
        
        WavePortal.Wave[] memory waves = wavePortal.getAllWaves();
        assertEq(waves.length, 1);
        assertEq(waves[0].waver, alice);
        assertEq(waves[0].message, "Hello, Linea!");
    }

    function testMultipleWaves() public {
        vm.prank(alice);
        wavePortal.wave("Wave from Alice");

        vm.prank(bob);
        wavePortal.wave("Wave from Bob");

        assertEq(wavePortal.getTotalWaves(), 2);

        WavePortal.Wave[] memory waves = wavePortal.getAllWaves();
        assertEq(waves.length, 2);
        assertEq(waves[0].waver, alice);
        assertEq(waves[0].message, "Wave from Alice");
        assertEq(waves[1].waver, bob);
        assertEq(waves[1].message, "Wave from Bob");
    }
}
```

Run the tests:

```bash
forge test
```

## Deploying the Smart Contract to Linea

First, create a `.env` file in the `smart-contract` directory:

```
PRIVATE_KEY=your_private_key_here
LINEA_SEPOLIA_RPC_URL=https://linea-sepolia.infura.io/v3/your_infura_project_id
```

Replace `your_private_key_here` with your MetaMask account's private key and `your_infura_project_id` with your Infura project ID.

Now, create a deployment script `script/DeployWavePortal.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/WavePortal.sol";

contract DeployWavePortal is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        WavePortal wavePortal = new WavePortal();
        console.log("WavePortal deployed to:", address(wavePortal));

        vm.stopBroadcast();
    }
}
```

To deploy to Linea Sepolia, run:

```bash
forge script script/DeployWavePortal.s.sol:DeployWavePortal --rpc-url $LINEA_SEPOLIA_RPC_URL --broadcast
```

Make note of the deployed contract address, as we'll need it for our frontend.

## Frontend Development

Navigate to the `frontend` directory:

```bash
cd ../frontend
```

Create a new React app:

```bash
npx create-react-app .
```

Install the necessary dependencies:

```bash
npm install ethers wagmi @wagmi/core
```

Replace the contents of `src/App.js` with the following code:

```jsx
import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useContractRead, useContractWrite, useWaitForTransaction, useNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected'

const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "string", "name": "_message", "type": "string"}],
    "name": "wave",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllWaves",
    "outputs": [{"components": [{"internalType": "address", "name": "waver", "type": "address"},{"internalType": "string", "name": "message", "type": "string"},{"internalType": "uint256", "name": "timestamp", "type": "uint256"}], "internalType": "struct WavePortal.Wave[]", "name": "", "type": "tuple[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalWaves",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

function App() {
  const [message, setMessage] = useState('');
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { chain } = useNetwork();

  const { data: totalWaves, refetch: refetchTotalWaves } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTotalWaves',
  });

  const { data: allWaves, refetch: refetchAllWaves } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAllWaves',
  });

  const { write: sendWave, data: sendWaveData, isLoading: isSendingWave, isError: isSendError, error: sendError } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'wave',
  });

  const { isLoading: isWaveLoading, isSuccess: isWaveSuccess } = useWaitForTransaction({
    hash: sendWaveData?.hash,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      refetchTotalWaves();
      refetchAllWaves();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetchTotalWaves, refetchAllWaves]);

  useEffect(() => {
    if (isWaveSuccess) {
      refetchTotalWaves();
      refetchAllWaves();
    }
  }, [isWaveSuccess, refetchTotalWaves, refetchAllWaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendWave({ args: [message] });
      setMessage('');
    } catch (error) {
      console.error("Error sending wave:", error);
    }
  };

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <h1 style={styles.title}>Wave Portal on Linea Sepolia 👋</h1>
        
        {!isConnected ? (
          <button onClick={() => connect({ connector: connectors[0] })} style={styles.connectButton}>
            Connect Wallet
          </button>
        ) : (
          <>
            <div style={styles.connectedInfo}>
              <span style={styles.connectedDot}></span>
              {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Wallet Connected'}
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message"
                style={styles.input}
              />
              <button type="submit" disabled={isSendingWave || isWaveLoading} style={styles.sendButton}>
                {isSendingWave || isWaveLoading ? 'Sending...' : 'Send Wave 👋'}
              </button>
            </form>

            {isSendError && <p style={styles.error}>Error: {sendError.message}</p>}
            {isWaveSuccess && <p style={styles.success}>Wave sent successfully! 🎉</p>}

            <p style={styles.totalWaves}>Total Waves: {totalWaves?.toString() || '0'}</p>

            <div style={styles.waveList}>
              <h2 style={styles.waveListTitle}>Recent Waves</h2>
              {allWaves?.map((wave, index) => (
                <div key={index} style={styles.waveItem}>
                  <p style={styles.waveAddress}>From: {wave.waver.slice(0, 6)}...{wave.waver.slice(-4)}</p>
                  <p style={styles.waveMessage}>"{wave.message}"</p>
                  <p style={styles.waveTime}>{new Date(Number(wave.timestamp) * 1000).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  // ... (styles remain the same as in the previous version)
};

export default App;
```

## Connecting Frontend to the Smart Contract

Create a new file `src/wagmi.js` to configure Wagmi:

```javascript
import { createConfig, configureChains } from 'wagmi'
import { lineaSepolia } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'

const { chains, publicClient } = configureChains(
  [lineaSepolia],
  [publicProvider()]
)

export const config = createConfig({
  autoConnect: true,
  connectors: [new InjectedConnector({ chains })],
  publicClient,
})
```

Update `src/index.js` to use the Wagmi configuration:

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { WagmiConfig } from 'wagmi';
import { config } from './wagmi';
import App from './App';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <App />
    </WagmiConfig>
  </React.StrictMode>,
  document.getElementById('root')
);
```

## Testing the dApp

1. Start your React app:
   ```bash
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Connect your MetaMask wallet to the Linea Sepolia testnet

4. Interact with the dApp:
   - Connect your wallet
   - Send waves with messages
   - View the total wave count and recent waves

## Conclusion

Congratulations! You've successfully built a Wave Portal dApp on Linea using Foundry for smart contract development and React for the frontend. This project demonstrates key concepts of Web3 development, including:

- Smart contract development and testing with Foundry
- Deploying smart contracts to Linea Sepolia testnet
- Frontend development with React and Wagmi for Ethereum interactions
- Connecting a frontend application to a smart contract on Linea

From here, you can expand on this project by adding more features, improving the UI, or exploring other aspects of decentralized application development on Linea.

Remember to always follow best practices for smart contract development, including thorough testing and careful handling of user funds and data. Happy building on Linea!
