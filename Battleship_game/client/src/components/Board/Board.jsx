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

    const [shipPositions, setShipPositions] = useState([]); // Store ship positions from server

    useEffect(() => {
        // listen for the shipPosition event from the server
        socket.on("shipPosition", (shipCoordinates) => {
          console.log("Received ship position from server:", shipCoordinates);
          setShipPositions(shipCoordinates);
    
          // creating a new grid to update state immutably
          const updatedBoardGrid = boardGrid.map(row => [...row]);
    
          // placing the ship on the grid based on received coordinates
          shipCoordinates.forEach(({ row, col }) => {
            updatedBoardGrid[row][col] = "S";
          });
    
          // updating the board grid state
          setBoardGrid(updatedBoardGrid);
        });

        // listening for hit results from the server
        socket.on("hit", ({ row, col }) => {
            console.log(`Hit at position: Row ${row}, Col ${col}`);
            setBoardGrid((prevGrid) => {
                const updatedBoardGrid = prevGrid.map((r) => [...r]);
                updatedBoardGrid[row][col] = "H";
                return updatedBoardGrid;
            });
        });

        // listening for miss results from the server
        socket.on("miss", ({ row, col }) => {
            console.log(`Miss at position: Row ${row}, Col ${col}`);
            setBoardGrid((prevGrid) => {
                const updatedBoardGrid = prevGrid.map((r) => [...r]);
                updatedBoardGrid[row][col] = "M";
                return updatedBoardGrid;
            });
        });

        // listening for all ships destroyed event from the server
        socket.on("allShipsDestroyed", () => {
            console.log("Congratulations! You have destroyed the ship!");
        });
    
        // cleaning up the effect when the component unmounts
        return () => {
          socket.off("shipPosition");
          socket.off("hit");
          socket.off("miss");
          socket.off("allShipsDestroyed");
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
                            console.log(`Clicked on ${colLabels[colIndex]}${rowLabels[rowIndex]}`);
                            handleTileClick(rowIndex, colIndex);
                        }}
                    >
                        {cell}
                    </div>
                    ))}
                </div>
                ))}
            </div>
        </div>
    );
}

export default Board;
