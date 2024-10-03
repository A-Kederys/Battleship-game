
const express = require("express");
const app = express();

// fetching backend api, making sure backend accepts requests from frontend

const cors = require("cors");
const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));


// backend api setup
app.get("/api", (req, res) => {
    res.json({movies: ["Interstellar", "Back to The Future", "Frequency"] });
});

app.listen(8080, () => {
    console.log("Server started on port 8080");
  });
