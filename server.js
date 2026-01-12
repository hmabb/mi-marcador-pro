const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

// Estado inicial robusto
let state = {
    sport: 'football',
    homeScore: 0,
    awayScore: 0,
    homeSets: 0, // Para voley
    awaySets: 0, // Para voley
    timer: 0,    // Segundos
    isRunning: false
};

// Lógica del Cronómetro en el servidor
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
server.listen(PORT, () => console.log(`Servidor listo en puerto ${PORT}`));
