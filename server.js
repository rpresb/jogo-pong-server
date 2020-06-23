import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import path from 'path';

const app = express();
const server = http.createServer(app);
const sockets = socketio(server);

const gameConfig = {
  width: 580,
  height: 320,
  maxScore: 10,
};

const game = {
  players: {},
  rooms: {},
  match: {},
};

sockets.on('connection', (socket) => {
  console.log(`${socket.id} conectado.`);

  socket.on('disconnect', () => {
    const player = game.players[socket.id];
    if (player) {
      console.log(`${player.name} desconectou.`);
      const playerId = socket.id;
      game.players[playerId].disconnected = new Date().getTime();
      const timerId = setTimeout(() => {
        removePlayer(playerId);
      }, 5000);
      game.players[playerId].timerId = timerId;
    } else {
      console.log(`${socket.id} desconectou.`);
    }
  });

  const removePlayer = (playerId) => {
    sendMessage(game.players[playerId], 'saiu');
    leaveRoom(playerId);

    delete game.players[playerId];

    refreshPlayers();
    refreshRooms();
  };

  socket.on('Reconnect', (reconnectedPlayer) => {
    console.log('Reconnect', reconnectedPlayer);
    const oldSocketId = reconnectedPlayer.socketId;
    const existingPlayer = game.players[oldSocketId];

    if (existingPlayer) {
      clearTimeout(game.players[oldSocketId].timerId);
      game.players[socket.id] = {
        ...existingPlayer,
        disconnected: undefined,
        socketId: socket.id,
      };

      delete game.players[oldSocketId];

      sendMessage(game.players[socket.id], 'reconectou');

      rejoinRoom(socket, oldSocketId);
    } else {
      console.log(`Player ${reconnectedPlayer.name} not found`);
    }
    refreshPlayers();
    refreshRooms();
  });

  socket.on('Login', (name) => {
    console.log('Login', name);
    game.players[socket.id] = { name, socketId: socket.id };
    sendMessage(game.players[socket.id], 'entrou');
    refreshPlayers();
    refreshRooms();
  });

  socket.on('SendMessage', (message) => {
    sendMessage(game.players[socket.id], message);
  });

  socket.on('CreateRoom', () => {
    socket.join(socket.id);

    game.rooms[socket.id] = {
      name: `Sala do ${game.players[socket.id].name}`,
      player1: socket.id,
      player2: undefined,
    };

    game.players[socket.id].room = socket.id;

    refreshPlayers();
    refreshRooms();
    sendMessage(game.players[socket.id], 'criou uma sala');
  });

  socket.on('LeaveRoom', () => {
    const player = game.players[socket.id];
    const roomId = player && player.room;

    leaveRoom(socket.id);

    if (roomId) {
      socket.leave(roomId);
      refreshMatch(roomId);

      socket.emit('MatchClear');
    }

    refreshPlayers();
    refreshRooms();
  });

  const rejoinRoom = (socket, oldSocketId) => {
    const socketId = socket.id;
    const player = game.players[socketId];

    if (!player || !player.room) {
      return;
    }

    const roomId = player.room;
    const room = game.rooms[roomId];

    if (room.player1 === oldSocketId) {
      room.player1 = socketId;
    } else if (room.player2 === oldSocketId) {
      room.player2 = socketId;
    } else {
      return;
    }

    socket.join(roomId);
    console.log(`${player.name} room rejoined`);
  };

  socket.on('JoinRoom', (roomId) => {
    socket.join(roomId);

    const room = game.rooms[roomId];

    const position = room.player1 ? '2' : '1';

    room[`player${position}`] = socket.id;

    game.players[socket.id].room = roomId;

    if (room.player1 && room.player2) {
      game.match[roomId] = {
        gameConfig,
        player1: {
          ready: false,
          x: 5,
          y: gameConfig.height / 2 - 40,
          height: 80,
          width: 10,
          speed: 5,
        },
        player2: {
          ready: false,
          x: gameConfig.width - 15,
          y: gameConfig.height / 2 - 40,
          height: 80,
          width: 10,
          speed: 5,
        },
        score1: 0,
        score2: 0,
        status: 'START',
      };

      gameInProgress(roomId);
    }

    refreshPlayers();
    refreshRooms();
    refreshMatch(roomId);
    sendMessage(game.players[socket.id], 'entrou numa sala');
  });

  socket.on('GameLoaded', () => {
    const player = game.players[socket.id];
    if (!player) {
      return;
    }
    const roomId = player.room;
    const room = game.rooms[roomId];

    if (!room) {
      return;
    }

    const match = game.match[roomId];
    const playerIndex = 'player' + (room.player1 == socket.id ? 1 : 2);

    match[playerIndex] = {
      ...match[playerIndex],
      ready: true,
    };

    if (match.player1.ready && match.player2.ready) {
      if (match.status !== 'PLAY') {
        match.status = 'PLAY';
        restartMatch(match, roomId);
      }
    }
  });

  socket.on('SendKey', ({ type, key }) => {
    const socketId = socket.id;
    const player = game.players[socketId];
    const roomId = player.room;
    const room = game.rooms[roomId];
    const playerNumber = 'player' + (socketId === room.player1 ? 1 : 2);
    const match = game.match[roomId];
    const direction =
      type === 'keyup' ? 'STOP' : key.replace('Arrow', '').toUpperCase();

    match[playerNumber] = { ...match[playerNumber], direction };
  });
});

const leaveRoom = (socketId) => {
  const player = game.players[socketId];
  const roomId = player && player.room;
  const room = game.rooms[roomId];

  if (room) {
    const match = game.match[roomId];

    player.room = undefined;

    const playerNumber = 'player' + (socketId === room.player1 ? 1 : 2);
    room[playerNumber] = undefined;

    if (match) {
      match[playerNumber] = undefined;

      if (match.status !== 'END') {
        match.status = 'END';
        match.message = `O jogador ${game.players[socketId].name} desconectou.`;
      }
    }

    if (!room.player1 && !room.player2) {
      delete game.rooms[roomId];
      if (match) {
        delete game.match[roomId];
      }
    }
  }
};

const gameInProgress = (roomId) => {
  const match = game.match[roomId];
  if (!match || match.status === 'END') {
    return;
  }

  if (match.status === 'PLAY') {
    moveBall(match);
    movePaddle(match);
    checkCollision(match, roomId);
  }

  refreshMatch(roomId);

  setTimeout(() => gameInProgress(roomId), 1000 / 30);
};

const moveBall = ({ ball }) => {
  const xpos = ball.x + ball.xspeed * ball.xdirection;
  const ypos = ball.y + ball.yspeed * ball.ydirection;

  ball.x = xpos;
  ball.y = ypos;
};

const movePaddle = (match) => {
  [1, 2].forEach((i) => {
    const player = match[`player${i}`];

    switch (player.direction) {
      case 'UP':
        player.y -= player.speed;
        break;
      case 'DOWN':
        player.y += player.speed;
        break;
    }

    if (player.y < 0) {
      player.y = 0;
    } else if (player.y + player.height > match.gameConfig.height) {
      player.y = match.gameConfig.height - player.height;
    }
  });
};

const checkCollision = (match, roomId) => {
  const { ball, gameConfig } = match;

  if (ball.y > gameConfig.height - ball.width) {
    ball.y = gameConfig.height - ball.width * 2;
    ball.ydirection = -1;
  }

  if (ball.y < ball.width) {
    ball.y = ball.width * 2;
    ball.ydirection = 1;
  }

  const { x: bx, y: by, width: br } = ball;

  const playerNumber = bx < gameConfig.width / 2 ? 1 : 2;
  const player = `player${playerNumber}`;
  const { x: rx, y: ry, width: rw, height: rh } = match[player];

  let testX = bx;
  let testY = by;

  if (bx < rx) {
    testX = rx;
  } else if (bx > rx + rw) {
    testX = rx + rw;
  }

  if (by < ry) {
    testY = ry;
  } else if (by > ry + rh) {
    testY = ry + rh;
  }

  const distX = bx - testX;
  const distY = by - testY;
  const distance = Math.sqrt(distX * distX + distY * distY);

  if (distance <= br) {
    ball.xdirection *= -1;
    ball.x =
      playerNumber === 1
        ? match[player].x + match[player].width + br
        : match[player].x - br;

    const quarterTop = by < ry + rh / 4;
    const quarterBottom = by > ry + rh - rh / 4;
    const halfTop = by < ry + rh / 2;
    const halfBottom = by > ry + rh - rh / 2;

    if (quarterTop || quarterBottom) {
      ball.yspeed += 0.15;
      ball.xspeed -= 0.15;

      ball.ydirection = quarterBottom ? 1 : -1;
    } else if (halfTop || halfBottom) {
      ball.yspeed += 0.05;
      ball.xspeed -= 0.05;
    }

    ball.xspeed *= 1.1;
  } else if (ball.x < ball.width) {
    match.score2++;
    restartMatch(match, roomId);
  } else if (ball.x > gameConfig.width - ball.width) {
    match.score1++;
    restartMatch(match, roomId);
  }
};

const restartMatch = (match, roomId) => {
  match.ball = {
    ...match.ball,
    width: 5,
    xdirection: match.ball ? match.ball.xdirection * -1 : 1,
    ydirection: 1,
    xspeed: 5,
    yspeed: 5 * (match.gameConfig.height / match.gameConfig.width),
    x: match.gameConfig.width / 2,
    y: match.gameConfig.height / 2,
  };

  game.rooms[roomId] = {
    ...game.rooms[roomId],
    score1: match.score1,
    score2: match.score2,
  };

  if (
    match.score1 === match.gameConfig.maxScore ||
    match.score2 === match.gameConfig.maxScore
  ) {
    const playerNumber = match.score1 === match.gameConfig.maxScore ? 1 : 2;
    const playerSocketId = game.rooms[roomId][`player${playerNumber}`];
    const player = game.players[playerSocketId];

    match.status = 'END';
    match.message = `O jogador ${
      player ? player.name : playerSocketId
    } venceu.`;
    sendMessage(
      undefined,
      match.message + ` ${match.score1} x ${match.score2}`
    );
  }

  refreshRooms();
};

const sendMessage = (player, message) => {
  if (player) {
    sockets.emit('ReceiveMessage', `${player.name}: ${message}`);
  } else {
    sockets.emit('ReceiveMessage', `${message}`);
  }
};

const refreshPlayers = () => {
  sockets.emit('PlayersRefresh', game.players);
};

const refreshRooms = () => {
  sockets.emit('RoomsRefresh', game.rooms);
};

const refreshMatch = (roomId) => {
  sockets.to(roomId).emit('MatchRefresh', game.match[roomId] || {});
};

app.use(express.static(path.resolve()));
app.use(express.static(path.join(path.resolve(), 'build')));

app.get('/ping', function (req, res) {
  return res.send('pong');
});

app.get('/*', function (req, res) {
  res.sendFile(path.join(path.resolve(), 'build', 'index.html'));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server rodando na porta ${PORT}!`));
