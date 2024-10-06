const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { placeAllShips } = require("./shipPlacement");

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

const hasAlreadyBeenGuessed = (row, col, guessedTiles) => {
  return guessedTiles.has(`${row},${col}`);

};

// socket connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  const shipPositions = placeAllShips(10); 
  const hitTiles = new Set(); // for tracking tiles
  const guessedTiles = new Set();  // for tracking guessed tiles

  // sending ship position to the client
  socket.emit("shipPosition", shipPositions);
  console.log("Ship position sent to client:", shipPositions)


  socket.on("playerGuess", ({ row, col }) => {
    console.log(`Player ${socket.id} guessed position: Row ${row}, Col ${col}`);

    if (hasAlreadyBeenGuessed(row, col, guessedTiles)) {
      console.log(`Player ${socket.id} already guessed Row ${row}, Col ${col}`);
      socket.emit("alreadyGuessed", { row, col });
      return;
    }

    // if not guessed, add to guessedTiles
    guessedTiles.add(`${row},${col}`);

    let hitTile = false;
    let destroyedShip = false;

    // check against all ship positions
    for (const ship of shipPositions) {
      if (ship.some((tile) => tile.row === row && tile.col === col)) {
        hitTile = true;
        hitTiles.add(`${row},${col}`);
        socket.emit("hit", { row, col });
        console.log(`Hit at position: Row ${row}, Col ${col}`);

        // check if the entire ship has been destroyed
        const allTilesHit = ship.every((tile) =>
          hitTiles.has(`${tile.row},${tile.col}`)
        );
        if (allTilesHit) {
          console.log(`Ship at ${JSON.stringify(ship)} destroyed`);
          socket.emit("shipDestroyed", ship);
          destroyedShip = true;
        }
        break;
      }
    }

    if (!hitTile) {
      socket.emit("miss", { row, col });
      console.log(`Miss at position: Row ${row}, Col ${col}`);
    }

    // check if all ships have been destroyed
    const allShipsDestroyed = shipPositions.every((ship) =>
      ship.every((tile) => hitTiles.has(`${tile.row},${tile.col}`))
    );
    if (allShipsDestroyed) {
      console.log(`${socket.id} destroyed all ships`);
      socket.emit("allShipsDestroyed");
    }
  });


  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

server.listen(8080, () => {
  console.log("Server started on port 8080");
});