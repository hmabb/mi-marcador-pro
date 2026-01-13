const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

// Estado inicial único
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

// Cronómetro en el servidor
setInterval(() => {
    if (state.isRunning) {
        state.timer++;
        io.emit('tick', { timer: state.timer });
    }
}, 1000);

io.on('connection', (socket) => {
    socket.emit('init', state);

    socket.on('updateAction', (data) => {
        // Ignoramos el timer que venga del cliente para no resetearlo
        const { timer, ...restOfData } = data; 
        state = { ...state, ...restOfData };
        io.emit('update', state);
    });

    socket.on('controlTimer', (cmd) => {
        if (cmd === 'start') state.isRunning = true;
        if (cmd === 'pause') state.isRunning = false;
        if (cmd === 'reset') { 
            state.timer = 0; 
            state.isRunning = false; 
            io.emit('tick', { timer: 0 }); 
        }
        io.emit('update', state);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
