const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

let state = {
    tournamentName: 'COPA LINARES 2026',
    bgColorTitle: '#0b1422', textColorTitle: '#ffffff',
    homeName: 'LOCAL', homeColor: '#00cba9', homeTextColor: '#ffffff', homeLogo: '',
    homeScore: 0, homeSets: 0, homeSetsHistory: [],
    awayName: 'VISITA', awayColor: '#a044ff', awayTextColor: '#ffffff', awayLogo: '',
    awayScore: 0, awaySets: 0, awaySetsHistory: [],
    serverSide: 'none', timer: 0, isRunning: false, timerMode: 'up'
};

setInterval(() => {
    if (state.isRunning) {
        state.timerMode === 'up' ? state.timer++ : (state.timer > 0 ? state.timer-- : state.isRunning = false);
        io.emit('tick', { timer: state.timer });
    }
}, 1000);

io.on('connection', (socket) => {
    socket.emit('init', state);
    socket.on('updateAction', (data) => {
        state = { ...state, ...data };
        io.emit('update', state);
    });
    socket.on('controlTimer', (data) => {
        if (data.cmd === 'start') state.isRunning = true;
        if (data.cmd === 'pause') state.isRunning = false;
        if (data.cmd === 'reset') { state.timer = 0; state.isRunning = false; }
        if (data.cmd === 'adjust') state.timer = Math.max(0, state.timer + data.val);
        if (data.cmd === 'set') state.timer = data.val;
        if (data.cmd === 'mode') state.timerMode = data.val;
        io.emit('update', state);
    });
});

server.listen(3000, () => console.log("Broadcast Server V9 - Ready"));
