import { useState, useEffect } from 'react';
import axios from "axios";
import io from 'socket.io-client';

import styles from "./App.module.css";
import Board from './components/Board/Board';

let socket;

function App() {
  const [array, setArray] = useState([]);

  // fetch data from the API
  const fetchAPI = async () => {
    const response = await axios.get("http://localhost:8080/api");
    setArray(response.data.movies);
    console.log(response.data.movies);
  };

  useEffect(() => {
    socket = io("http://localhost:8080");

    // socket connection listener
    socket.on("connect", () => {
      console.log(`Connected to server with ID: ${socket.id}`);
    });

    // when the component mounts
    fetchAPI();

    return () => {
      // clean up the socket connection when the component unmounts
      if (socket) socket.disconnect();
    };
  }, []);

  return (
    <>
      <div className={styles.App}>
        <Board />


        {array.map((movie, index) => (
          <div className={styles.container} key={index}>
            <p className={styles.movies}>{movie}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;