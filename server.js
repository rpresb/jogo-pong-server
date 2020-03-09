import express from 'express';
import http from 'http';
import socketio from 'socket.io';

const app = express();
const server = http.createServer(app);
const sockets = socketio(server);

const gameConfig = {
    width: 580,
    height: 320
};

const game = {
    players: {},
    rooms: {},
    match: {}
};

sockets.on('connection', (socket) => {
    console.log(`${socket.id} conectado.`);

    const name = 'Player_' + socket.id.substr(0, 5);
    game.players[socket.id] = { name };
    sendMessage(game.players[socket.id], 'entrou');
    refreshPlayers();
    refreshRooms();

    socket.on('disconnect', () => {
        console.log(`${socket.id} desconectou.`)
        sendMessage(game.players[socket.id], 'saiu');
        leaveRoom(socket);

        delete game.players[socket.id];

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
            player2: undefined
        };

        game.players[socket.id].room = socket.id;

        refreshPlayers();
        refreshRooms();
        sendMessage(game.players[socket.id], 'criou uma sala');
    });

    socket.on('LeaveRoom', () => {
        leaveRoom(socket);

        refreshPlayers();
        refreshRooms();
    });

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
                    speed: 5
                },
                player2: {
                    ready: false,
                    x: gameConfig.width - 15,
                    y: gameConfig.height / 2 - 40,
                    height: 80,
                    width: 10,
                    speed: 5
                },
                score1: 0,
                score2: 0,
                status: 'START'
            };

            gameInProgress(roomId);
        }

        refreshPlayers();
        refreshRooms();
        refreshMatch(roomId);
        sendMessage(game.players[socket.id], 'entrou numa sala');
    });

    socket.on('GameLoaded', () => {
        const roomId = game.players[socket.id].room;
        const match = game.match[roomId];
        const player = 'player' + (game.rooms[roomId].player1 == socket.id ? 1 : 2);

        match[player] = {
            ...match[player],
            ready: true
        };

        if (match.player1.ready && match.player2.ready) {
            match.status = 'PLAY';
            match.ball = {
                width: 5,
                xdirection: 1,
                ydirection: 1,
                xspeed: 2.8,
                yspeed: 2.2,
                x: gameConfig.width / 2,
                y: gameConfig.height / 2
            };
        }
    });

    socket.on('SendKey', ({ type, key }) => {
        const socketId = socket.id;
        const player = game.players[socketId];
        const roomId = player.room;
        const room = game.rooms[roomId];
        const playerNumber = 'player' + (socketId === room.player1 ? 1 : 2);
        const match = game.match[roomId];
        const direction = type === 'keyup' ? 'STOP' : key.replace('Arrow', '').toUpperCase();

        match[playerNumber] = { ...match[playerNumber], direction };
    });
});

const leaveRoom = (socket) => {
    const socketId = socket.id;
    const roomId = game.players[socketId].room;
    const room = game.rooms[roomId];

    if (room) {
        const match = game.match[roomId];

        game.players[socketId].room = undefined;

        const playerNumber = 'player' + (socketId === room.player1 ? 1 : 2);
        room[playerNumber] = undefined;

        if (match) {
            match[playerNumber] = undefined;
            match.status = 'END';
            match.message = `O jogador ${game.players[socketId].name} desconectou.`;
        }

        if (!room.player1 && !room.player2) {
            delete game.rooms[roomId];
            if (match) {
                delete game.match[roomId];
            }
        }

        refreshMatch(roomId);
        socket.leave(roomId);
    }
};

const gameInProgress = (roomId) => {
    const match = game.match[roomId];
    if (!match || match.status === 'END') {
        return;
    }

    switch (match.status) {
        case 'PLAY':
            moveBall(match);
            movePaddle(match);
            checkCollision(match);
            break;
    }

    refreshMatch(roomId);

    setTimeout(() => gameInProgress(roomId), 1000 / 60);
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

const checkCollision = (match) => {
    const { ball, gameConfig } = match;

    if (ball.y > gameConfig.height - ball.width || ball.y < ball.width) {
        ball.ydirection *= -1;
    }

    const { x: bx, y: by, width: br } = ball;

    const playerNumber = bx < gameConfig.width / 2 ? 1 : 2;
    const player = `player${playerNumber}`;
    const { x: rx, y: ry, width: rw, height: rh } = match[player];

    let testX = bx;
    let testY = by;

    if (bx < rx) {
        testX = rx;
    }
    else if (bx > rx + rw) {
        testX = rx + rw;
    }

    if (by < ry) {
        testY = ry;
    }
    else if (by > ry + rh) {
        testY = ry + rh;
    }

    const distX = bx - testX;
    const distY = by - testY;
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    if (distance <= br) {
        ball.xdirection *= -1;
        ball.x = playerNumber === 1 ? match[player].x + match[player].width + br : match[player].x - br;
    } else if (ball.x < ball.width) {
        match.score2++;
        restartMatch(match);
    } else if (ball.x > gameConfig.width - ball.width) {
        match.score1++;
        restartMatch(match);
    }
};

const restartMatch = (match) => {
    const { ball, gameConfig } = match;
    ball.xdirection *= -1;
    ball.x = gameConfig.width / 2;
    ball.y = gameConfig.height / 2;
};

const sendMessage = (player, message) => {
    sockets.emit('ReceiveMessage', `${player.name}: ${message}`);
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

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'build')));

app.get('/ping', function (req, res) {
 return res.send('pong');
});

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server rodando na porta ${PORT}!`));
