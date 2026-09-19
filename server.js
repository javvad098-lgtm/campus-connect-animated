const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 8e6
});

// Website files are directly in the repository root
app.use(express.static(__dirname));

io.on("connection", (socket) => {

  socket.on("visitor:location", (data) => {
    if (
      data &&
      Number.isFinite(data.latitude) &&
      Number.isFinite(data.longitude)
    ) {
      socket.broadcast.emit("visitor:location", {
        ...data,
        timestamp: Date.now()
      });
    }
  });

  socket.on("visitor:photo", (data) => {
    if (
      typeof data === "string" &&
      data.startsWith("data:image/")
    ) {
      socket.broadcast.emit("visitor:photo", data);
    }
  });

});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Campus Connect running on port ${PORT}`);
});
