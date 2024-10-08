import { useState, useEffect } from 'react';
import axios from "axios";
import { SocketProvider } from './SocketContext';

import styles from "./App.module.css";
import Board from './components/Board/Board';

function App() {
  return (
    <SocketProvider>
      <div className={styles.App}>
        <Board />
      </div>
    </SocketProvider>
  );
}

export default App;