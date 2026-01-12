const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

// ÚNICA DECLARACIÓN DE STATE EN TODO EL ARCHIVO
let state = {
    sport: 'football',
    homeScore: 0,
    awayScore: 0,
    homeSets: 0,
    awaySets: 0,
    homeColor: '#36ba98',
    awayColor: '#a044ff',
    homeLogo: '',
    awayLogo: '',
    timer: 0,
    isRunning: false
};

setInterval(() => {
    if (state.isRunning) {
        state.timer++;
        io.emit('tick', { timer: state.timer });
    }
}, 1000);

io.on('connection', (socket) => {
    socket.emit('init', state);

    socket.on('updateAction', (data) => {
        state = { ...state, ...data };
        io.emit('update', state);
    });

    socket.on('controlTimer', (command) => {
        if (command === 'start') state.isRunning = true;
        if (command === 'pause') state.isRunning = false;
        if (command === 'reset') { state.timer = 0; state.isRunning = false; }
        io.emit('update', state);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));


