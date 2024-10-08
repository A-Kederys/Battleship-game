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

// Function to initialize or reset the game state
const initializeGame = () => {
  const shipPositions = placeAllShips(10);
  const hitTiles = new Set(); // for tracking hits
  const guessedTiles = new Set(); // for tracking guesses
  let remainingTries = 25;
  let gameOver = false;

  return { shipPositions, hitTiles, guessedTiles, remainingTries, gameOver };
};

// socket connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Initialize the game state for the player
  let { shipPositions, hitTiles, guessedTiles, remainingTries, gameOver } =
    initializeGame();

  let gameStarted = false;

  socket.on("gameStart", () => {
    gameStarted = true;
    socket.emit("gameStarted", { shipPositions });
    console.log("Ship position sent to client:", shipPositions)
    console.log("Game started for:", socket.id);
    socket.emit("updateRemainingTries", remainingTries);
  });

  socket.on("restartGame", () => {
    ({ shipPositions, hitTiles, guessedTiles, remainingTries, gameOver } =
      initializeGame()); // resetting game state
    socket.emit("gameStarted", { shipPositions });
    console.log("Ship position sent to client:", shipPositions)
    console.log("Game restarted for:", socket.id);
    socket.emit("updateRemainingTries", remainingTries);
  });

  socket.on("playerGuess", ({ row, col }) => {
    if (!gameStarted) {
      console.log("Game hasn't started yet!");
      return;
    }

    console.log(`Player ${socket.id} guessed position: Row ${row}, Col ${col}`);

    if (gameOver) {
      return;
    }

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
      remainingTries -= 1;
      socket.emit("miss", { row, col });
      console.log(`Miss at position: Row ${row}, Col ${col}`);
    }

    // emit remaining tries to the client after each guess
    socket.emit("updateRemainingTries", remainingTries);

    // check if all ships have been destroyed
    const allShipsDestroyed = shipPositions.every((ship) =>
      ship.every((tile) => hitTiles.has(`${tile.row},${tile.col}`))
    );

    // check if the game is over due to either condition
    if (allShipsDestroyed || remainingTries <= 0) {
      console.log(`${socket.id} game over!`);
      gameOver = true;
      socket.emit("gameOver", { allShipsDestroyed });
    }

    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);
    });
  });
});

server.listen(8080, () => {
  console.log("Server started on port 8080");
});