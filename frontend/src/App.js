import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useContractRead, useContractWrite, useWaitForTransaction, useNetwork } from 'wagmi';
import { lineaSepolia } from './wagmi';

// Use the chain ID for Linea Sepolia
const CHAIN_ID = 59140;

const CONTRACT_ADDRESS = "0x9C6D7b1687805F4bDFba002276c0FDbcf272c100";
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