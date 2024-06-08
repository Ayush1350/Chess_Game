const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const chess = new Chess();
let players = {};

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', { title: 'Chess Game' });
});

io.on('connection', (socket) => {
  console.log('connected');

  if (!players.white) {
    players.white = socket.id;
    socket.emit('playerRole', 'w');
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit('playerRole', 'b');
  } else {
    socket.emit('spectatorRole');
  }

  socket.on('disconnect', () => {
    if (socket.id === players.white) {
      delete players.white;
    } else if (socket.id === players.black) {
      delete players.black;
    }
  });

  socket.on('move', (move) => {
    try {
      if (chess.turn() === 'w' && socket.id !== players.white) return;
      if (chess.turn() === 'b' && socket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        io.emit('move', move);
        io.emit('boardState', chess.fen());
      } else {
        socket.emit('invalidMove', move);
      }
    } catch (error) {
      console.log(error);
      socket.emit('invalidMove', move);
    }
  });

  socket.emit('boardState', chess.fen());
});

server.listen(3333, () => {
  console.log('Server is live on port 3333');
});
