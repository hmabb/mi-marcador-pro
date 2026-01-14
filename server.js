const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

let state = {
    sport: 'volleyball',
    tournamentName: 'VOLLEYBALL CHAMPIONSHIP',
    homeName: 'LOCAL',
    awayName: 'VISITA',
    homeColor: '#36ba98',
    awayColor: '#a044ff',
    homeTextColor: '#ffffff',
    awayTextColor: '#ffffff',
    homeLogo: '',
    awayLogo: '',
    homeScore: 0,
    awayScore: 0,
    homeSetsHistory: [],
    awaySetsHistory: [],
    timer: 0,
    isRunning: false,
    serverSide: 'none' 
};

// Variables para el cálculo de tiempo real (no volátil)
let startTime = null;
let accumulatedTime = 0;

setInterval(() => {
    if (state.isRunning && startTime) {
        // Calculamos la diferencia real entre "ahora" y "cuando empezamos"
        const now = Date.now();
        const elapsedMs = now - startTime + accumulatedTime;
        state.timer = Math.floor(elapsedMs / 1000);
        io.emit('tick', { timer: state.timer });
    }
}, 1000);

io.on('connection', (socket) => {
    socket.emit('init', state);

    socket.on('updateAction', (data) => {
        const { timer, ...restOfData } = data; 
        state = { ...state, ...restOfData };
        io.emit('update', state);
    });

    socket.on('controlTimer', (cmd) => {
        if (cmd === 'start' && !state.isRunning) {
            state.isRunning = true;
            startTime = Date.now();
        } else if (cmd === 'pause' && state.isRunning) {
            state.isRunning = false;
            accumulatedTime += Date.now() - startTime;
            startTime = null;
        } else if (cmd === 'reset') {
            state.isRunning = false;
            state.timer = 0;
            accumulatedTime = 0;
            startTime = null;
            io.emit('tick', { timer: 0 });
        }
        io.emit('update', state);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
