const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

let state = {
    tournamentName: 'VOLLEYBALL CHAMPIONSHIP',
    bgColorTitle: '#0b1422',
    textColorTitle: '#ffffff',
    bgColorTimer: '#000000',
    bgColorHist: '#1a2a44',
    colorServeIndic: '#ffd700',
    broadcasterLogo: '', 
    overlayMode: 'match', // 'match', 'halftime', 'final'
    homeName: 'LOCAL', awayName: 'VISITA',
    homeColor: '#00cba9', awayColor: '#a044ff',
    homeTextColor: '#ffffff', awayTextColor: '#ffffff',
    homeLogo: '', awayLogo: '',
    homeScore: 0, awayScore: 0,
    homeSets: 0, awaySets: 0,
    homeSetsHistory: [], awaySetsHistory: [],
    serverSide: 'none',
    timer: 0, isRunning: false, timerMode: 'up'
};

setInterval(() => {
    if (state.isRunning) {
        if (state.timerMode === 'up') state.timer++;
        else if (state.timer > 0) state.timer--;
        else state.isRunning = false;
        io.emit('tick', { timer: state.timer });
    }
}, 1000);

io.on('connection', (socket) => {
    socket.emit('init', state);

    socket.on('updateAction', (data) => {
        let oldHome = state.homeScore;
        let oldAway = state.awayScore;
        state = { ...state, ...data };

        // Lógica de Saque Automático: El que anota, saca.
        if (state.homeScore > oldHome) state.serverSide = 'home';
        if (state.awayScore > oldAway) state.serverSide = 'away';

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

server.listen(process.env.PORT || 3000, () => console.log("Servidor Pro activo"));
