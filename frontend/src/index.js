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