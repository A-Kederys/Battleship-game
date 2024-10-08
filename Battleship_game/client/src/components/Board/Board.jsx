import React, { useState, useEffect } from "react";
import styles from "./Board.module.css";
import io from "socket.io-client";

// connecting to erver
const socket = io("http://localhost:8080");

function Board() {

    const rowLabels = Array.from({ length: 10 }, (_, index) => index + 1); //1 to 10
    const colLabels = Array.from({ length: 10 }, (_, index) =>
        String.fromCharCode(65 + index) // A to J (65 is ASCII code for 'A')
    );

    // 10x10 grid
    const [boardGrid, setBoardGrid] = useState(
        Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ""))
    );

    const [shipPositions, setShipPositions] = useState([]);
    const [message, setMessage] = useState("");
    const [remainingTries, setRemainingTries] = useState(25);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);


    useEffect(() => {
        socket.connect();
        
        // listen for the shipPositions event from the server
        socket.on("gameStarted", ({ shipPositions }) => {
          console.log("Received ship position from server:", shipPositions);
          setShipPositions(shipPositions);
          setMessage("Game has started. Make your shot!");
    
          // creating a new grid to update state immutably
          const updatedBoardGrid = boardGrid.map(row => [...row]);
    
          // placing the ship on the grid based on received coordinates
          shipPositions.forEach((ship) => {
            ship.forEach(({ row, col }) => {
            updatedBoardGrid[row][col] = "S";
             });
          });
    
          // updating the board grid state
          setBoardGrid(updatedBoardGrid);
        });

        // updating remaining tries when server sends the count
        socket.on("updateRemainingTries", (triesLeft) => {
            setRemainingTries(triesLeft);
        });

        // listening for hit results from the server
        socket.on("hit", ({ row, col }) => {
            console.log(`Hit at position: Row ${row}, Col ${col}`);
            setBoardGrid((prevGrid) => {
                const updatedBoardGrid = prevGrid.map((r) => [...r]);
                updatedBoardGrid[row][col] = "🚢";
                setMessage(`You hit! on ${colLabels[col]}${row + 1}`);
                return updatedBoardGrid;
            });
        });

        // listening for miss results from the server
        socket.on("miss", ({ row, col }) => {
            console.log(`Miss at position: Row ${row}, Col ${col}`);
            setBoardGrid((prevGrid) => {
                const updatedBoardGrid = prevGrid.map((r) => [...r]);
                updatedBoardGrid[row][col] = "❌";
                setMessage(`You missed on  ${colLabels[col]}${row + 1}`);
                return updatedBoardGrid;
            });
        });

        socket.on("alreadyGuessed", ({ row, col }) => {
            console.log(`Tile at Row ${row}, Col ${col} has already been guessed.`);
            setMessage(`You have already guessed ${colLabels[col]}${row + 1}. Try another tile.`);
        });

        // listening for single ship destroyed event from the server
        socket.on("shipDestroyed", (destroyedShip) => {
            console.log("Destroyed ship at positions:", destroyedShip);
            setMessage("You destroyed a ship!");

            setBoardGrid((prevGrid) => {
                const updatedBoardGrid = prevGrid.map((r) => [...r]);
        
                destroyedShip.forEach(({ row, col }) => {
                  updatedBoardGrid[row][col] = "☠️";
                });
        
                return updatedBoardGrid;
              });
          });
        
        // listening for game over event from the server
        socket.on("gameOver", ({ allShipsDestroyed }) => {
            setMessage(
              allShipsDestroyed
                ? "Congratulations! You destroyed all ships!"
                : "No remaining tries left. Game Over!"
            );
            setGameStarted(false);
            setGameOver(true);
          });
    
        // cleaning up the effect when the component unmounts
        return () => {
          socket.disconnect();
        };
      }, []);

      const handleTileClick = (row, col) => {
        if (!gameStarted) {
          setMessage("Start the game first!");
          return;
        }
        console.log(`Clicked on ${colLabels[row]}${rowLabels[col]}`);
        socket.emit("playerGuess", { row, col }); // send guess to server
      };

      const handleStartGame = () => {
        socket.emit("gameStart");
        setGameStarted(true);
        setGameOver(false);
        setMessage("Game started!");
      };
    
      const handleRestartGame = () => {
        socket.emit("restartGame");
        setBoardGrid(Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => "")));
        setMessage("Game restarted! Make your shot.");
        setGameStarted(true);
        setGameOver(false);
      };


    return (
        <div className={styles.boardContainer}>
           {!gameStarted && !gameOver && (
                <button onClick={handleStartGame}>
                    Start Game
                </button>
            )}
            {(gameStarted || gameOver) && (
                <button onClick={handleRestartGame}>
                    {gameOver ? "Play Again" : "Restart Game"}
                </button>
            )}
            {/* column labels */}
            <div className={styles.colLabels}>
                <div className={styles.emptyCorner}></div>
                {colLabels.map((label, index) => (
                <div key={index} className={styles.colLabel}>
                    {label}
                </div>
                ))}
            </div>

             {/* grid */}
            <div className={styles.gridContainer}>
                {boardGrid.map((row, rowIndex) => (
                    <div key={rowIndex} className={styles.row}>
                        {/* row labels */}
                        <div className={styles.rowLabel}>{rowLabels[rowIndex]}</div>
                        {row.map((cell, colIndex) => (
                            <div
                            key={colIndex}
                                className={styles.cell}
                                onClick={() => {
                                    handleTileClick(rowIndex, colIndex);
                                }}
                            >
                            {cell}
                        </div>
                        ))}
                    </div>
                ))}
            </div>
            <div className={styles.message}>{message}</div>
            <div className={styles.message}>Remaining shots: {remainingTries}</div>
        </div>
    );
}

export default Board;