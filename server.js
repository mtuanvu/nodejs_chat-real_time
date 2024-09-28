const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let gameBoard = Array(81).fill(""); // Bàn cờ 9x9
let currentPlayer = "X";
let players = {}; // Lưu thông tin biệt danh của người chơi

// Hàm kiểm tra người chiến thắng theo luật 5 lần liên tiếp
function checkWinner(board) {
  const size = 9; // Kích thước bàn cờ 9x9
  const winningLength = 5; // Cần 5 lần liên tiếp

  // Kiểm tra theo hàng ngang, dọc và chéo
  function checkDirection(dx, dy) {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        let symbol = board[x * size + y];
        if (symbol === "") continue;
        
        let count = 0;
        for (let step = 0; step < winningLength; step++) {
          let nx = x + dx * step;
          let ny = y + dy * step;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size && board[nx * size + ny] === symbol) {
            count++;
          } else {
            break;
          }
        }
        if (count === winningLength) return symbol; // Trả về biểu tượng của người chiến thắng
      }
    }
    return null;
  }

  // Kiểm tra các hướng: ngang (1, 0), dọc (0, 1), chéo chính (1, 1), chéo phụ (1, -1)
  return checkDirection(1, 0) || checkDirection(0, 1) || checkDirection(1, 1) || checkDirection(1, -1);
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on('connection', (socket) => {
  console.log("User connected");

  // Khi có kết nối mới, reset lại dữ liệu trò chơi
  gameBoard = Array(81).fill(""); // Reset lại bàn cờ
  players = {}; // Reset lại danh sách người chơi
  currentPlayer = "X"; // Đặt lại người chơi bắt đầu

  // Lắng nghe sự kiện đặt biệt danh
  socket.on("set nickname", (nickname) => {
    players[socket.id] = nickname; // Lưu biệt danh với ID của socket

    if (Object.keys(players).length === 2) {
      // Khi đủ 2 người chơi, bắt đầu game
      io.emit("start game", { 
        message: `Trò chơi bắt đầu! ${players[socket.id]} là người đánh trước.`, 
        currentPlayer: "X" 
      });
    }
  });

  // Lắng nghe sự kiện chat message
  socket.on('chat message', (msg) => {
    io.emit("chat message", msg);
  });

  // Lắng nghe sự kiện typing
  socket.on("typing", () => {
    socket.broadcast.emit("typing");
  });

  socket.on("stop typing", () => {
    socket.broadcast.emit("stop typing");
  });

  // Lắng nghe sự kiện đánh X/O
  socket.on("make move", (data) => {
    if (gameBoard[data.position] === "") {
      gameBoard[data.position] = data.player;
      currentPlayer = data.player === "X" ? "O" : "X";

      // Cập nhật bàn cờ trước khi kiểm tra chiến thắng
      io.emit("update board", { board: gameBoard, currentPlayer });

      // Kiểm tra chiến thắng sau khi bàn cờ đã được cập nhật
      setTimeout(() => {
        const winner = checkWinner(gameBoard);
        if (winner) {
          // Chỉ thông báo chiến thắng nếu phát hiện đúng 5 ký tự liên tiếp
          io.emit("game over", { winner: players[socket.id] });
          gameBoard = Array(81).fill(""); // Reset bàn cờ
        }
      }, 100); // Đặt thời gian trễ nhỏ để đảm bảo bàn cờ được hiển thị trước
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    delete players[socket.id]; // Xóa người chơi khi họ ngắt kết nối
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
