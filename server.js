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

// NUEVA SECCIÓN: API para Stream Deck
app.get('/api/:action/:value?', (req, res) => {
    const { action, value } = req.params;

    if (action === 'homeScore') state.homeScore = Math.max(0, state.homeScore + parseInt(value));
    if (action === 'awayScore') state.awayScore = Math.max(0, state.awayScore + parseInt(value));
    if (action === 'homeSets') state.homeSets = Math.max(0, state.homeSets + parseInt(value));
    if (action === 'awaySets') state.awaySets = Math.max(0, state.awaySets + parseInt(value));
    
    if (action === 'timer') {
        if (value === 'start') state.isRunning = true;
        if (value === 'pause') state.isRunning = false;
        if (value === 'reset') { state.timer = 0; state.isRunning = false; }
    }

    if (action === 'pushSet') {
        state.homeSetsHistory.push(state.homeScore);
        state.awaySetsHistory.push(state.awayScore);
        state.homeScore = 0;
        state.awayScore = 0;
    }

    io.emit('update', state); // Avisar a todos los marcadores
    res.send({ status: 'ok', current: state });
});

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

// Endpoint para que Companion lea todo el estado de una vez
app.get('/api/state', (req, res) => {
    res.json(state);
});

// Rutas de texto plano para botones que no saben leer JSON
app.get('/api/view/homeScore', (req, res) => res.send(state.homeScore.toString()));
app.get('/api/view/awayScore', (req, res) => res.send(state.awayScore.toString()));


server.listen(3000, () => console.log("Servidor V10 - Online"));





