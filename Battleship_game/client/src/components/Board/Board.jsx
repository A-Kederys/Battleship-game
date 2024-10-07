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

    useEffect(() => {
        socket.connect();
        
        // listen for the shipPositions event from the server
        socket.on("shipPositions", (shipCoordinates) => {
          console.log("Received ship position from server:", shipCoordinates);
          setShipPositions(shipCoordinates);
    
          // creating a new grid to update state immutably
          const updatedBoardGrid = boardGrid.map(row => [...row]);
    
          // placing the ship on the grid based on received coordinates
          shipCoordinates.forEach((ship) => {
            ship.forEach(({ row, col }) => {
            updatedBoardGrid[row][col] = "S";
            });
        });
    
          // updating the board grid state
          setBoardGrid(updatedBoardGrid);
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
        
        // listening for all ships destroyed event from the server
        socket.on("allShipsDestroyed", () => {
            console.log("Congratulations! You have destroyed all ships!");
            setMessage("Congratulations! You have destroyed all ships!");
        });
    
        // cleaning up the effect when the component unmounts
        return () => {
          socket.off("shipPositions");
          socket.off("hit");
          socket.off("miss");
          socket.off("alreadyGuessed");
          socket.off("shipDestroyed");
          socket.off("allShipsDestroyed");

          socket.disconnect();
        };
      }, []);

    const handleTileClick = (rowIndex, colIndex) => {
        console.log(`Clicked on ${colLabels[colIndex]}${rowLabels[rowIndex]}`);
        socket.emit("playerGuess", { row: rowIndex, col: colIndex }); // send guess to server
    };


    return (
        <div className={styles.boardContainer}>
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
        </div>
    );
}

export default Board;