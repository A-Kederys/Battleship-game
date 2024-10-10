import React, { useState, useEffect } from "react";
import styles from "./Board.module.css";
import { useSocket } from "../../SocketContext";

function Board() {
    const socket = useSocket();

    const rowLabels = Array.from({ length: 10 }, (_, index) => index + 1); //1 to 10
    const colLabels = Array.from({ length: 10 }, (_, index) =>
        String.fromCharCode(65 + index) // A to J (65 is ASCII code for 'A')
    );

    // 10x10 grid
    const [boardGrid, setBoardGrid] = useState(
        Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ""))
    );

    const [shipPositions, setShipPositions] = useState([]);
    const [message, setMessage] = useState("Press the button to start the game");
    const [remainingTries, setRemainingTries] = useState(25);
    const [remainingShips, setRemainingShips] = useState(10);
    const [remainingShipsByLength, setRemainingShipsByLength] = useState({
        1: 3,
        2: 3,
        3: 2,
        4: 1,
        5: 1
    });
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [wavingCells, setWavingCells] = useState([]);
    const [isButtonActive, setIsButtonActive] = useState(true);
    const [cellsClickable, setCellsClickable] = useState(true);
    const [missedCells, setMissedCells] = useState([]);
    const [hitCells, setHitCells] = useState([]);
    const [destroyedShipCells, setDestroyedShipCells] = useState([]);
    const [particles, setParticles] = useState([]); 


    useEffect(() => {
        
        // listen for the shipPositions event from the server
        socket.on("gameStarted", ({ shipPositions }) => {
          //console.log("Received ship position from server:", shipPositions);
          setShipPositions(shipPositions);
          setMessage("Game has started. Make your shot!");
    
          // creating a new grid to update state immutably
          const updatedBoardGrid = boardGrid.map(row => [...row]);
    
          // placing the ship on the grid based on received coordinates
        /*  shipPositions.forEach((ship) => {
            ship.forEach(({ row, col }) => {
            updatedBoardGrid[row][col] = "S";
             });
          });
        */
          // updating the board grid state
          setBoardGrid(updatedBoardGrid);
        });

        // updating remaining tries when server sends the count
        socket.on("updateRemainingTries", (triesLeft) => {
            setRemainingTries(triesLeft);
        });

        // updating remaining ships when server sends the count
        socket.on("updateRemainingShips", (shipsLeft) => {
            setRemainingShips(shipsLeft);
        });

        socket.on("updateShipCountsByLength", (countsLeft) => {
            setRemainingShipsByLength(countsLeft);
        });

        // listening for hit results from the server
        socket.on("hit", ({ row, col }) => {
            //console.log(`Hit at position: Row ${row}, Col ${col}`);
            setBoardGrid((prevGrid) => {
                const updatedBoardGrid = prevGrid.map((r) => [...r]);
                updatedBoardGrid[row][col] = "🚢";
                setMessage(`You hit! on ${colLabels[col]}${row + 1}`);

                // for animation
                setHitCells(prev => [...prev, `${row}-${col}`]);
                return updatedBoardGrid;
            });
        });

        // listening for miss results from the server
        socket.on("miss", ({ row, col }) => {
            //console.log(`Miss at position: Row ${row}, Col ${col}`);
            setBoardGrid((prevGrid) => {
                const updatedBoardGrid = prevGrid.map((r) => [...r]);
                updatedBoardGrid[row][col] = "❌";
                setMessage(`You missed on  ${colLabels[col]}${row + 1}`);

                // for animation
                setMissedCells(prev => [...prev, `${row}-${col}`]);
                return updatedBoardGrid;
            });
        });

        socket.on("alreadyGuessed", ({ row, col }) => {
            //console.log(`Tile at Row ${row}, Col ${col} has already been guessed.`);
            setMessage(`You have already guessed ${colLabels[col]}${row + 1}. Try another tile.`);
        });

        // listening for single ship destroyed event from the server
        socket.on("shipDestroyed", (destroyedShip) => {
            //console.log("Destroyed ship at positions:", destroyedShip);
            setMessage("You destroyed a ship!");

            // for animation
            const newDestroyedCells = destroyedShip.map(({ row, col }) => `${row}-${col}`);
            setDestroyedShipCells(newDestroyedCells);

            setBoardGrid((prevGrid) => {
                const updatedBoardGrid = prevGrid.map((r) => [...r]);
        
                destroyedShip.forEach(({ row, col }) => {
                  updatedBoardGrid[row][col] = "☠️";
                });
        
                return updatedBoardGrid;
              });

              setTimeout(() => {
                setDestroyedShipCells([]);
              }, 800);
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

            // particle effect
            if (allShipsDestroyed) {
                setIsButtonActive(false);
                setCellsClickable(false);
                createParticles();

                setTimeout(() => {
                    setIsButtonActive(true);
                    setCellsClickable(true);
                }, 6000);
            }
          });
          
      }, []);

      const handleTileClick = (row, col) => {
        if (!gameStarted) {
          setMessage("Start the game first!");
          return;
        }
        if (!cellsClickable) {
            return;
        }
        //console.log(`Clicked on ${colLabels[row]}${rowLabels[col]}`);
        socket.emit("playerGuess", { row, col }); // send guess to server
      };

      const handleStartGame = () => {
        if (!isButtonActive) return;
        setIsButtonActive(false);
        setCellsClickable(false);
        socket.emit("gameStart");
        setGameStarted(true);
        setGameOver(false);
        setMessage("Game started!");

        triggerWaveEffect();
        
        // re-enabling after 1500ms
        setTimeout(() => {
            setIsButtonActive(true);
            setCellsClickable(true);
        }, 1500);
      };
    
      const handleRestartGame = () => {
        if (!isButtonActive) return;
        setIsButtonActive(false);
        setCellsClickable(false);

        setHitCells([]);
        setMissedCells([]);
        setDestroyedShipCells([]); 

        socket.emit("restartGame");
        setGameStarted(true);
        setGameOver(false);
        setMessage("Game restarted! Make your shot.");

        triggerWaveEffect();

        // re-enabling after 1500ms
        setTimeout(() => {
            setIsButtonActive(true);
            setCellsClickable(true);
        }, 1500);
      };

      const triggerWaveEffect = () => {
        const newWavingCells = [];
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                setTimeout(() => {
                    newWavingCells.push(`${row}-${col}`);
                    setWavingCells(prev => [...prev, `${row}-${col}`]);
                }, (row + col) * 30);
            }
        }

        // wave reset
        setTimeout(() => {
            setWavingCells([]);
        }, 1500);
    };

    const createParticles = () => {
        const newParticles = [];
        for (let i = 0; i < 100; i++) {
            newParticles.push({
                id: i,
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
            });
        }
        setParticles(newParticles);

        setTimeout(() => {
            setParticles([]);
        }, 6000); 
    };


    return (
        <>
        <h1 className={styles.title}>Aqua Strike!</h1>
        <div className={styles.boardWrapper}>
            <div className={styles.controlsContainer}>
                <h1>Remaining:</h1>
                <p>Shots: {remainingTries}</p>
                {remainingShips > 0 && (
                    <p>Ships: {remainingShips}</p>
                )}
                {!gameStarted && !gameOver && (
                    <button onClick={handleStartGame} disabled={!isButtonActive}>
                        Start Game
                    </button>
                )}
                {(gameStarted || gameOver) && (
                    <button onClick={handleRestartGame} disabled={!isButtonActive}>
                        {gameOver ? "Play Again" : "Restart Game"}
                    </button>
                )}
            </div>
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
                            {row.map((cell, colIndex) => {
                                const isWaving = wavingCells.includes(`${rowIndex}-${colIndex}`);
                                const isMissed = missedCells.includes(`${rowIndex}-${colIndex}`);
                                const isHit = hitCells.includes(`${rowIndex}-${colIndex}`);
                                const isDestroyed = destroyedShipCells.includes(`${rowIndex}-${colIndex}`);
                                return (
                                    <div
                                        key={colIndex}
                                        className={`${styles.cell} 
                                            ${isWaving ? styles.waving : ''} 
                                            ${isMissed ? styles.distorted : ''} 
                                            ${isHit ? styles.hitEffect : ''}
                                            ${isDestroyed ? styles.shipDestroyedEffect : ''}`
                                        }
                                        onClick={() => {
                                            handleTileClick(rowIndex, colIndex);
                                        }}
                                        style={{ pointerEvents: cellsClickable ? 'auto' : 'none' }}
                                    >
                                        {cell}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.message}>
                <h4>{message}</h4>
                {Object.entries(remainingShipsByLength).map(([length, count]) => (
                    count > 0 && (
                        <p key={length}>{length}-cell length: {count}</p>
                    )
                ))}
            </div>
        </div>
        {particles.map(particle => (
                <div
                    key={particle.id}
                    className={styles.particle}
                    style={{
                        left: particle.left,
                        top: particle.top,
                        position: 'absolute'
                    }}
                />
        ))}
        {/* game rules */}
        {/* remaining ship count */}
        {/* show where ships were after losing */}
        </>
    );
}

export default Board;