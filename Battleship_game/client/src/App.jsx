import { useState, useEffect } from 'react';
import axios from "axios";

import styles from "./App.module.css";

function App() {
  const [count, setCount] = useState(0)
  const [array, setArray] = useState([]);

  const fetchAPI = async () => {
    const response = await axios.get("http://localhost:8080/api");
    setArray(response.data.movies);
    console.log(response.data.movies);
  };

  useEffect(() => {
    fetchAPI()
  },[]);

  return (
    <>
      <div>
        {array.map((movies, index) => (
          <div className={styles.container} key={index}>
            <p className={styles.movies}>{movies}</p>
          </div>
        ))}
        
      </div>
      
    </>
  )
}

export default App
