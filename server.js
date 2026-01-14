const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const ADMIN_PASS = "1234"; // <--- TU CONTRASEÑA

app.use(express.static('public'));

let state = {
    tournamentName: 'VOLLEYBALL CHAMPIONSHIP',
    overlayMode: 'match', 
    homeName: 'LOCAL', awayName: 'VISITA',
    homeColor: '#36ba98', awayColor: '#a044ff',
    homeTextColor: '#ffffff', awayTextColor: '#ffffff',
    homeLogo: '', awayLogo: '',
    homeScore: 0, awayScore: 0,
    homeSetsHistory: [], awaySetsHistory: [],
    timer: 0, isRunning: false, serverSide: 'none'
};

let startTime = null;
let accumulatedTime = 0;

setInterval(() => {
    if (state.isRunning && startTime) {
        state.timer = Math.floor((Date.now() - startTime + accumulatedTime) / 1000);
        io.emit('tick', { timer: state.timer });
    }
}, 1000);

io.on('connection', (socket) => {
    socket.emit('init', state);

    socket.on('updateAction', (data) => {
        if (data.password !== ADMIN_PASS) return;
        const { password, timer, ...rest } = data;
        state = { ...state, ...rest };
        io.emit('update', state);
    });

    socket.on('controlTimer', (data) => {
        if (data.password !== ADMIN_PASS) return;
        if (data.cmd === 'start' && !state.isRunning) {
            state.isRunning = true;
            startTime = Date.now();
        } else if (data.cmd === 'pause' && state.isRunning) {
            state.isRunning = false;
            accumulatedTime += Date.now() - startTime;
            startTime = null;
        } else if (data.cmd === 'reset') {
            state.isRunning = false; state.timer = 0; accumulatedTime = 0; startTime = null;
            io.emit('tick', { timer: 0 });
        }
        io.emit('update', state);
    });
});

server.listen(process.env.PORT || 3000, () => console.log("Servidor Listo"));
