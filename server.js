const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

// --- ESTADO MONOLÍTICO INICIAL ---
let state = {
    // Configuración General y Torneo
    tournamentName: 'VOLLEYBALL CHAMPIONSHIP',
    bgColorTitle: '#0b1422',
    textColorTitle: '#ffffff',
    bgColorTimer: '#000000',
    bgColorHist: '#1a2a44', // Color fondo sets previos
    colorServeIndic: '#ffd700', // Color dorado para el indicador
    broadcasterLogo: '', // URL logo transmisor

    // Modo de Pantalla
    overlayMode: 'match', // 'match', 'halftime', 'final'

    // Datos Equipos (Colores por defecto inspirados en la imagen)
    homeName: 'USA', awayName: 'ENGLAND',
    homeColor: '#00cba9', awayColor: '#a044ff',
    homeTextColor: '#ffffff', awayTextColor: '#ffffff',
    homeLogo: '', awayLogo: '',
    
    // Puntuación
    homeScore: 0, awayScore: 0,
    homeSets: 0, awaySets: 0, // Nuevos contadores de SETS ganados
    homeSetsHistory: [], awaySetsHistory: [], // Historial puntos por set
    serverSide: 'none', // 'home', 'away', 'none'

    // Cronómetro Avanzado
    timer: 0, 
    isRunning: false, 
    timerMode: 'up' // 'up' (cuenta progresiva) o 'down' (cuenta regresiva)
};


// --- LÓGICA DEL CRONÓMETRO ---
setInterval(() => {
    if (state.isRunning) {
        if (state.timerMode === 'up') {
            state.timer++;
        } else {
             // Evitar negativos en cuenta regresiva
            if (state.timer > 0) state.timer--;
            else state.isRunning = false; 
        }
        io.emit('tick', { timer: state.timer, isRunning: state.isRunning });
    }
}, 1000);


// --- SOCKETS ---
io.on('connection', (socket) => {
    // Enviar estado inicial al conectar
    socket.emit('init', state);

    // --- Recepción de Acciones de Puntuación y Configuración ---
    socket.on('updateAction', (data) => {
        // Extraemos datos sensibles que no queremos sobrescribir ciegamente
        const { timer, isRunning, ...incomingData } = data;
        let oldHomeScore = state.homeScore;
        let oldAwayScore = state.awayScore;

        // Fusionar estado
        state = { ...state, ...incomingData };

        // LÓGICA DE SAQUE AUTOMÁTICO
        // Si el puntaje subió, el que anotó tiene el saque.
        if (state.homeScore > oldHomeScore) state.serverSide = 'home';
        else if (state.awayScore > oldAwayScore) state.serverSide = 'away';
        // (Si el puntaje bajó por corrección, no cambiamos el saque automáticamente)

        io.emit('update', state);
    });

    // --- Control Específico del Cronómetro ---
    socket.on('controlTimer', (data) => {
        switch(data.cmd) {
            case 'start': state.isRunning = true; break;
            case 'pause': state.isRunning = false; break;
            case 'reset': state.timer = 0; state.isRunning = false; break;
            case 'set': state.timer = parseInt(data.val) || 0; break; // Ingreso manual
            case 'adjust': // Ajustes +1, -60, etc.
                state.timer = Math.max(0, state.timer + parseInt(data.val)); 
                break;
            case 'mode': state.timerMode = data.val; break; // Toggle up/down
        }
        // Emitir actualización inmediata del tiempo y estado
        io.emit('update', state);
        io.emit('tick', { timer: state.timer, isRunning: state.isRunning });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sistema Profesional Voley activo en puerto ${PORT}`));

