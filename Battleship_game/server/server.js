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

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);


  // handle events sent from client  
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

server.listen(8080, () => {
  console.log("Server started on port 8080");
});