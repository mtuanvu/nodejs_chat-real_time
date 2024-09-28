const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on('connection',(socket) => {
    console.log("User connected");
    //lang nghe su kien chat tu phia user
    socket.on('chat message', (msg) => {
        io.emit("chat message", msg);
    });

    //lang nghe su kien "Typing" tu clinet
    socket.on("typing", () => {
        socket.broadcast.emit("typing");//thong bao cho moi tru user
    });

    socket.on("stop typing", () => {
        socket.broadcast.emit("stop typing"); // Thông báo khi người dùng dừng gõ
      });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    })
});


server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });