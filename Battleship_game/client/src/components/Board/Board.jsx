import React, { useState } from "react";
import styles from "./Board.module.css";

function Board() {

    const rowLabels = Array.from({ length: 10 }, (_, index) => index + 1); //1 to 10
    const colLabels = Array.from({ length: 10 }, (_, index) =>
        String.fromCharCode(65 + index) // A to J (65 is ASCII code for 'A')
    );

    // 10x10 grid
    const [boardGrid, setBoardGrid] = useState(
        Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ""))
    );

    return (
        <div className={styles.boardContainer}>
            <div className={styles.colLabels}>
                <div className={styles.emptyCorner}></div>
                {colLabels.map((label, index) => (
                <div key={index} className={styles.colLabel}>
                    {label}
                </div>
                ))}
            </div>
        
            <div className={styles.gridContainer}>
                {boardGrid.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.row}>
                    <div className={styles.rowLabel}>{rowLabels[rowIndex]}</div>
                    {row.map((cell, colIndex) => (
                    <div
                        key={colIndex}
                        className={styles.cell}
                        onClick={() => console.log(`Clicked on ${colLabels[colIndex]}${rowLabels[rowIndex]}`)}
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
