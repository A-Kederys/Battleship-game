import { useState, useEffect } from 'react';
import axios from "axios";
import { SocketProvider } from './SocketContext';

import styles from "./App.module.css";
import Board from './components/Board/Board';
import Menu from './components/Menu/Menu';

function App() {
  return (
    <SocketProvider>
      <div className={styles.App}>
        <Board />
        <Menu />
      </div>
    </SocketProvider>
  );
}

export default App;