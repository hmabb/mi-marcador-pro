const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

let gameState = { home: 0, away: 0, period: 1 };

io.on('connection', (socket) => {
    // Enviar estado actual al conectar
    socket.emit('init', gameState);

    socket.on('updateScore', (data) => {
        gameState = { ...gameState, ...data };
        io.emit('scoreUpdated', gameState); // Avisa a todos (OBS y móvil)
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));