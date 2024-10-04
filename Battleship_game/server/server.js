const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true
    }
  })

app.use(cors());

app.get("/api", (req, res) => {
  res.json({ movies: ["Interstellar", "Back to The Future", "Frequency"] });
});


// random ship placement
const getRandomShipPosition = (boardSize, shipLength) => {
  // place randomly  horizontally or vertically
  const isHorizontal = Math.random() < 0.5;

  let shipCoordinates = [];

  if (isHorizontal) {
    const startRow = Math.floor(Math.random() * boardSize); // random row between 0 and boardSize - 1
    const startCol = Math.floor(Math.random() * (boardSize - shipLength + 1)); // column start position to fit the ship length

    for (let i = 0; i < shipLength; i++) {
      shipCoordinates.push({ row: startRow, col: startCol + i });
    }
  } else {
    const startRow = Math.floor(Math.random() * (boardSize - shipLength + 1)); // row start position to fit the ship length
    const startCol = Math.floor(Math.random() * boardSize); // random column between 0 and boardSize - 1

    for (let i = 0; i < shipLength; i++) {
      shipCoordinates.push({ row: startRow + i, col: startCol });
    }
  }

  return shipCoordinates;
};

const generateSingleShipPosition = (boardSize, shipLength) => {
  return getRandomShipPosition(boardSize, shipLength);
};

const SHIP_LENGTH = 3;  


io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // generate a random position for the sip
  const shipPosition = generateSingleShipPosition(10, SHIP_LENGTH);
  const hitTiles = new Set(); // for tracking tiles

  // sending the random ship position to the client
  socket.emit("shipPosition", shipPosition);
  console.log("Ship position sent to client:", shipPosition)


  socket.on("playerGuess", ({ row, col }) => {
    console.log(`Player guessed position: Row ${row}, Col ${col}`);

    const hitTile = shipPosition.some(tile => tile.row === row && tile.col === col);

    const isHit = shipPosition.some(
      (position) => position.row === row && position.col === col
    );

    if (hitTile) {
      hitTiles.add(`${row},${col}`);
      socket.emit("hit", { row, col });
      console.log(`Hit at position: Row ${row}, Col ${col}`);

      // checking if all the tiles of the ship have been hit
      if (hitTiles.size === shipPosition.length) {
        console.log("You destroyed the ship!");
        socket.emit("allShipsDestroyed"); // notifying client
      }
    } else {
      socket.emit("miss", { row, col });
      console.log(`Miss at position: Row ${row}, Col ${col}`);
    }
    
  });


  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

server.listen(8080, () => {
  console.log("Server started on port 8080");
});