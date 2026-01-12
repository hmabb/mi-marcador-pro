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
    homeLogo: '',
    awayLogo: '',
    homeScore: 0,
    awayScore: 0,
    homeSetsHistory: [], // Ej: [25, 25]
    awaySetsHistory: [], // Ej: [12, 20]
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
    socket.on('controlTimer', (cmd) => {
        if (cmd === 'start') state.isRunning = true;
        if (cmd === 'pause') state.isRunning = false;
        if (cmd === 'reset') { state.timer = 0; state.isRunning = false; }
        io.emit('update', state);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
