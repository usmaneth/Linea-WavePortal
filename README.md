# Building a Full Stack Wave Portal application on the Linea zkEVM with React, Metamask, and Foundry

## Introduction

In this tutorial, we'll build a full stack application called Wave Portal on the Linea network using React, Metamask, and Foundry. 

Linea is a Layer 2 scaling solution for Ethereum, offering faster and cheaper transactions while maintaining Ethereum's security guarantees. Foundry is a fast, portable, and modular toolkit for Ethereum application development written in Rust. We will also be integrating a Metamask wallet connector using Wagmi.js. The entire frontend will be written in React. 

The goal of this tutorial is to get an application that will allow users to send "waves" with messages, which will be stored on the blockchain, more specifically on the Linea zkEVM. /

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

Our Wave Portal app will have the following features:

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
    struct Wave {
        address waver;
        string message;
        uint256 timestamp;
    }

    Wave[] public waves;
    uint256 public totalWaves;

    event NewWave(address indexed from, uint256 timestamp, string message);

    function wave(string memory _message) public {
        totalWaves += 1;
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

### Contract Components
1. Wave Struct
```solidity
struct Wave {
    address waver;
    string message;
    uint256 timestamp;
}  
```
This struct defines the structure of a Wave:

- waver: Ethereum address of the person who sent the wave
- message: Text message accompanying the wave
- timestamp: Time when the wave was sent (Unix timestamp)

2. State Variables


```solidity
Wave[] public waves;
uint256 public totalWaves;

```

- waves: Public array storing all Wave structs
- totalWaves: Public variable tracking the total number of waves sent

3. Event


```solidity
event NewWave(address indexed from, uint256 timestamp, string message);

```
This event is emitted when a new wave is sent, including:

- from: Address of the wave sender (indexed for efficient filtering)
- timestamp: When the wave was sent
- message: Content of the wave

4. Functions

1. Wave Function

```solidity
function wave(string memory _message) public {
    totalWaves += 1;
    waves.push(Wave(msg.sender, _message, block.timestamp));
    emit NewWave(msg.sender, block.timestamp, _message);
}

```
This function allows users to send a wave:

- Increments the totalWaves counter
- Creates a new Wave struct and adds it to the waves array
- Emits a NewWave event with the wave details

- Get All Waves Function

```solidity
function getAllWaves() public view returns (Wave[] memory) {
    return waves;
}

```
- Returns the entire waves array, allowing anyone to view all waves sent.

3. Get Total Waves Function
   
```solidity
function getTotalWaves() public view returns (uint256) {
    return totalWaves;
}

```
- Returns the total number of waves sent.
  
How the Contract Works

The contract initializes with no waves and a total wave count of 0.
Users can send waves by calling the wave function:

- They provide a message as an argument.
- The contract creates a new Wave struct with the sender's address, message, and current timestamp.
- The new Wave is added to the waves array.
- totalWaves is incremented.
- A NewWave event is emitted.


Anyone can call getAllWaves to retrieve all waves ever sent.
Anyone can call getTotalWaves to get the total number of waves.
The waves array and totalWaves are public and can be accessed directly.


## Testing the Smart Contract

Create a new file `test/WavePortal.t.sol` for our tests:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/WavePortal.sol";
import {WavePortal} from "../src/WavePortal.sol";

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
        
        (address waver, string memory message, ) = wavePortal.waves(0);
        assertEq(waver, alice);
        assertEq(message, "Hello, Linea!");
    }

    function testMultipleWaves() public {
        vm.prank(alice);
        wavePortal.wave("Wave from Alice");

        vm.prank(bob);
        wavePortal.wave("Wave from Bob");

        vm.prank(alice);
        wavePortal.wave("Another wave from Alice");

        assertEq(wavePortal.getTotalWaves(), 3);

        WavePortal.Wave[] memory allWaves = wavePortal.getAllWaves();
        assertEq(allWaves.length, 3);
        assertEq(allWaves[0].waver, alice);
        assertEq(allWaves[0].message, "Wave from Alice");
        assertEq(allWaves[1].waver, bob);
        assertEq(allWaves[1].message, "Wave from Bob");
        assertEq(allWaves[2].waver, alice);
        assertEq(allWaves[2].message, "Another wave from Alice");
    }

    function testGetTotalWaves() public {
        assertEq(wavePortal.getTotalWaves(), 0);

        vm.prank(alice);
        wavePortal.wave("First wave");

        assertEq(wavePortal.getTotalWaves(), 1);

        vm.prank(bob);
        wavePortal.wave("Second wave");

        assertEq(wavePortal.getTotalWaves(), 2);
    }
}

```

This contract tests the functionality of the WavePortal smart contract using Forge's testing framework.
Setup

```Solidity
WavePortal public wavePortal;
address alice = address(0x1);
address bob = address(0x2);

function setUp() public {
    wavePortal = new WavePortal();
}
```

- Initializes a new WavePortal contract for each test.
- Sets up two test addresses: alice and bob.

Test Functions

1. testWave
```Solidity
function testWave() public {
    vm.prank(alice);
    wavePortal.wave("Hello, Linea!");

    assertEq(wavePortal.getTotalWaves(), 1);
    
    (address waver, string memory message, ) = wavePortal.waves(0);
    assertEq(waver, alice);
    assertEq(message, "Hello, Linea!");
}
```
- Tests a single wave:

- Sends a wave from Alice.
- Checks total waves is 1.
- Verifies the wave's sender and message.

2. testMultipleWaves
```solidity
function testMultipleWaves() public {
    vm.prank(alice);
    wavePortal.wave("Wave from Alice");

    vm.prank(bob);
    wavePortal.wave("Wave from Bob");

    vm.prank(alice);
    wavePortal.wave("Another wave from Alice");

    assertEq(wavePortal.getTotalWaves(), 3);

    WavePortal.Wave[] memory allWaves = wavePortal.getAllWaves();
    assertEq(allWaves.length, 3);
}
```
- Tests multiple waves:

- Sends waves from Alice and Bob.
- Checks total waves is 3.
- Verifies details of all waves.

3. testGetTotalWaves
   
```solidity 
function testGetTotalWaves() public {
    assertEq(wavePortal.getTotalWaves(), 0);

    vm.prank(alice);
    wavePortal.wave("First wave");

    assertEq(wavePortal.getTotalWaves(), 1);

    vm.prank(bob);
    wavePortal.wave("Second wave");

    assertEq(wavePortal.getTotalWaves(), 2);
}
```
- Tests the getTotalWaves function:

- Checks initial total is 0.
- Sends waves and verifies the total increases correctly.

Key Testing Techniques:

- Uses vm.prank() to simulate different senders.
- Utilizes assertEq() for equality checks.
- Accesses contract state directly to verify data.

Run the tests:

```bash
forge test
```

If successful, you should get a message like this: 

<img width="803" alt="Screen Shot 2024-09-10 at 10 44 18 AM" src="https://github.com/user-attachments/assets/747d010a-3291-4843-858e-5d0703a6f9e2">

## Deploying the Smart Contract to Linea

After a successful test - we are ready to deploy! 

First, create a `.env` file in the `smart-contract` directory:

```
PRIVATE_KEY=your_private_key_here
LINEA_SEPOLIA_RPC_URL=https://linea-sepolia.infura.io/v3/your_infura_project_id
```

This is where you can put the private key of the account you will be executing transactions from. Also where you add the RPC URl for the network you will be utilizing, which in this case is Linea Sepolia testnet. 

For information on where to get testnet Linea ETH, see here: https://docs.linea.build/users/move-funds/fund#linea-sepolia
For information on setting up a Linea RPC URL, see here: https://infura.io

Once you have gotten the necessary infromation, replace `your_private_key_here` with your MetaMask account's private key and `your_infura_project_id` with your Infura project ID.

Now, create a deployment script `script/DeployWavePortal.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WavePortal} from "../src/WavePortal.sol";

contract DeployWavePortal is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        WavePortal wavePortal = new WavePortal();
        console.log("WavePortal deployed to:", address(wavePortal));

        vm.stopBroadcast();
    }
}
```

This is a simple script that deploys your contract to the desired network of your choice.

To deploy to Linea Sepolia, run:

```bash
forge script script/DeployWavePortal.s.sol:DeployWavePortal --rpc-url $LINEA_SEPOLIA_RPC_URL --broadcast
```
If all works, should get a message like this: 

<img width="803" alt="Screen Shot 2024-09-10 at 10 49 14 AM" src="https://github.com/user-attachments/assets/1ec23b00-ae4c-4b88-b124-700f5c8a8011">

Congrats! You just deployed a smart contract onto the Linea zkEVM testnet - now we are going to build a frontend in React to interact with it.

Be sure to make note of the deployed contract address - we'll need it for the frontend we are about to build.

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
import { lineaSepolia } from './wagmi';

// Use the chain ID for Linea Sepolia
const CHAIN_ID = 59140;

const CONTRACT_ADDRESS = "your_contract_address_here";
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
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "message", "type": "string"}
    ],
    "name": "NewWave",
    "type": "event"
  }
]

function App() {
  const [message, setMessage] = useState('');
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { chain } = useNetwork();

  const { data: totalWaves, refetch: refetchTotalWaves } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTotalWaves',
    chainId: lineaSepolia.id,
  });

  const { data: allWaves, refetch: refetchAllWaves } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAllWaves',
    chainId: lineaSepolia.id,
  });

  const { write: sendWave, data: sendWaveData, isLoading: isSendingWave, isError: isSendError, error: sendError } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'wave',
    chainId: lineaSepolia.id,
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
    if (chain?.id !== lineaSepolia.id) {
      alert("Please switch to Linea Sepolia network in your wallet.");
      return;
    }
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
            {chain?.id !== lineaSepolia.id && (
              <p style={styles.warning}>Please switch to Linea Sepolia network in your wallet.</p>
            )}
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message"
                style={styles.input}
              />
              <button type="submit" disabled={isSendingWave || isWaveLoading || chain?.id !== lineaSepolia.id} style={styles.sendButton}>
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
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  },
  container: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    width: '80%',
    maxWidth: '600px',
  },
  title: {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2.5em',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
  },
  connectButton: {
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '50px',
    fontSize: '1em',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'block',
    margin: '0 auto',
    ':hover': {
      background: '#45a049',
      transform: 'translateY(-2px)',
    },
  },
  connectedInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    marginBottom: '20px',
  },
  connectedDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#4CAF50',
    marginRight: '10px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '1em',
  },
  sendButton: {
    background: '#3498db',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '1em',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      background: '#2980b9',
    },
    ':disabled': {
      background: '#bdc3c7',
      cursor: 'not-allowed',
    },
  },
  warning: {
    color: '#f39c12',
    textAlign: 'center',
    marginBottom: '20px',
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: '10px',
  },
  success: {
    color: '#2ecc71',
    textAlign: 'center',
    marginTop: '10px',
  },
  totalWaves: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: '1.2em',
    marginTop: '20px',
  },
  waveList: {
    marginTop: '30px',
  },
  waveListTitle: {
    color: '#ffffff',
    fontSize: '1.5em',
    marginBottom: '20px',
  },
  waveItem: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '15px',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    },
  },
  waveAddress: {
    color: '#ecf0f1',
    fontSize: '0.9em',
    marginBottom: '5px',
  },
  waveMessage: {
    color: '#ffffff',
    fontSize: '1.1em',
    marginBottom: '10px',
  },
  waveTime: {
    color: '#bdc3c7',
    fontSize: '0.8em',
  },
};

export default App;

```
So this is a React component that implements a user interface for the Wave Portal app on Linea Sepolia . 

It allows users to connect their wallet, send waves with messages, and view all previous waves - it uses Wagmi hooks for Ethereum interactions, including reading the total wave count and all waves from the smart contract, as well as writing new waves. Made sure that it features real-time updates, error handling, and network checking to ensure users are on the correct Linea Sepolia network.

We also gave it a slick UI that is styled with a gradient background, glassmorphic container, and responsive design, providing a modern and nice UX. It also includes features like displaying the connected wallet address, showing loading states during transactions, and formatting wave data for easy readability and making it seem like a modern Web3 App.

## Connecting Frontend to the Smart Contract

Create a new file `src/wagmi.js` to configure Wagmi:

```javascript
import { createConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'

const lineaSepolia = {
  id: 59141,
  name: 'Linea Sepolia',
  network: 'linea-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Linea Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://linea-sepolia.infura.io/v3/your_API_key'] },
    default: { http: ['https://linea-sepolia.infura.io/v3/your_API_key''] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://sepolia.lineascan.build/' },
  },
  testnet: true,
}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [lineaSepolia],
  [publicProvider()]
)

export const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ 
      chains,
      options: {
        name: 'Linea Sepolia',
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
})

export { lineaSepolia }
```

This code configures the Wagmi library for interacting with Linea Sepolia - it defines the network parameters for Linea Sepolia, including its chain ID, native currency details, and RPC endpoints - then uses Wagmi's ```configureChains``` and ```createConfig``` functions to set up the connection configuration, specifying the use of a public provider and an injected connector (like MetaMask). 

This setup enables the React application we just built to connect to the Linea Sepolia network, facilitating interactions with smart contract we deployed. 

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

This is the entry point of a React application that uses Wagmi for Ethereum interactions - it imports the necessary dependencies, including the Wagmi configuration from a separate file. The     ```ReactDOM.render``` function is used to mount the main App component within a ```WagmiConfig``` provider, which makes the Wagmi configuration available throughout the application. The         ```React.StrictMode``` wrapper is used for highlighting potential problems in the application. 

This setup ensures that the entire app has access to Ethereum functionality provided by Wagmi, allowing components to interact with the blockchain seamlessly.

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

If all works well, you should have an application that looks like this: 

<img width="1047" alt="Screen Shot 2024-09-10 at 10 59 48 AM" src="https://github.com/user-attachments/assets/4bc43613-2608-4e3e-bde8-c4b9f59f8286">



Congratulations! You've successfully built a full stack Wave Portal app on Linea using Solidiity and Foundry for smart contract development and React for the frontend. 

This project demonstrates key concepts of Web3 development, including:

- Smart contract development and testing with Foundry
- Deploying smart contracts to Linea Sepolia testnet
- Frontend development with React and Wagmi for Ethereum interactions
- Connecting a frontend application to a smart contract on Linea

From here, you can expand on this project by adding more features, improving the UI, etc. 

LGTM! 
