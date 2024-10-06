// shipPlacement.js

const getRandomShipPosition = (boardSize, shipLength, existingShips) => {
    let isPositionValid = false;
    let shipCoordinates = [];
    const attemptsLimit = 100; // to avoid infinite loops
    let attempts = 0;
  
    while (!isPositionValid && attempts < attemptsLimit) {
      // resseting array
      shipCoordinates = [];
  
      // random  determination on horizontally or vertically
      const isHorizontal = Math.random() < 0.5;
  
      if (isHorizontal) {
        const startRow = Math.floor(Math.random() * boardSize);
        const startCol = Math.floor(Math.random() * (boardSize - shipLength + 1));
  
        for (let i = 0; i < shipLength; i++) {
          shipCoordinates.push({ row: startRow, col: startCol + i });
        }
      } else {
        const startRow = Math.floor(Math.random() * (boardSize - shipLength + 1));
        const startCol = Math.floor(Math.random() * boardSize);
  
        for (let i = 0; i < shipLength; i++) {
          shipCoordinates.push({ row: startRow + i, col: startCol });
        }
      }
  
      isPositionValid = isValidShipPosition(shipCoordinates, existingShips);
      attempts++;
    }
  
    if (!isPositionValid) {
      throw new Error("Unable to place ship after several attempts.");
    }
  
    return shipCoordinates;
  };
  
  const isValidShipPosition = (newShip, existingShips) => {
    for (const tile of newShip) {
      for (const existingShip of existingShips) {
        for (const existingTile of existingShip) {
          // checking if tiles overlap
          if (tile.row === existingTile.row && tile.col === existingTile.col) {
            return false;
          }
  
          // checking if tiles are touching
          if (
            Math.abs(tile.row - existingTile.row) <= 1 &&
            Math.abs(tile.col - existingTile.col) <= 1
          ) {
            return false;
          }
        }
      }
    }
  
    return true;
  };
  
  // function to place all ships of different lengths on the board
  const placeAllShips = (boardSize) => {
    const shipsToPlace = [
      { length: 5, count: 1 },
      { length: 4, count: 1 },
      { length: 3, count: 2 },
      { length: 2, count: 3 },
      { length: 1, count: 3 },
    ];
  
    const allShips = [];
  
    for (const shipType of shipsToPlace) {
      for (let i = 0; i < shipType.count; i++) {
        const newShip = getRandomShipPosition(boardSize, shipType.length, allShips);
        allShips.push(newShip);
      }
    }
  
    return allShips;
  };
  
  module.exports = {
    placeAllShips,
  };  