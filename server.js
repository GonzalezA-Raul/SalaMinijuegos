import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
app.use(express.static("."));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Cloud: usar PORT del entorno y escuchar en 0.0.0.0
const PORT = process.env.PORT || 3000;

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function broadcast(room, obj) {
  for (const p of room.players) send(p.ws, obj);
}

function randomRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function winner(a, b) {
  // returns: 0 draw, 1 => a wins, 2 => b wins
  if (a === b) return 0;
  if (
    (a === "rock" && b === "scissors") ||
    (a === "paper" && b === "rock") ||
    (a === "scissors" && b === "paper")
  ) return 1;
  return 2;
}

// Rooms en memoria
const rooms = new Map();

let nextPlayerId = 1;

function checkTTTWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columnas
    [0, 4, 8], [2, 4, 6] // diagonales
  ];
  
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  
  if (board.every(cell => cell !== null)) {
    return { winner: 'draw', line: [] };
  }
  
  return null;
}

function roomState(room) {
  const state = {
    type: "state",
    roomCode: room.code,
    gameMode: room.gameMode,
    players: room.players.map(p => ({
      id: p.id,
      score: p.score,
      hasChosen: p.choice !== null
    }))
  };
  
  if (room.gameMode === 'ttt' && room.tttState) {
    state.tttState = room.tttState;
  }
  
  if (room.gameMode === 'oe' && room.oeState) {
    state.oeState = {
      phase: room.oeState.phase,
      gameOver: room.oeState.gameOver,
      players: room.oeState.players.map(p => ({
        id: p.id,
        hasParity: p.parity !== null,
        hasNumber: p.number !== null
      }))
    };
  }
  
  if (room.gameMode === 'dab' && room.dabState) {
    state.dabState = room.dabState;
  }
  
  return state;
}

wss.on("connection", (ws) => {
  const playerId = nextPlayerId++;
  ws.meta = { playerId, roomCode: null };

  send(ws, { type: "connected", playerId });

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); }
    catch { return send(ws, { type: "error", message: "JSON inválido" }); }

    const { type } = msg;

    // --- CREATE ROOM ---
    if (type === "create_room") {
      if (ws.meta.roomCode) return send(ws, { type: "error", message: "Ya estás en una sala" });

      let code = randomRoomCode();
      while (rooms.has(code)) code = randomRoomCode();

      const room = {
        code,
        players: [
          { id: playerId, ws, choice: null, score: 0 }
        ],
        gameMode: null,
        tttState: null
      };
      rooms.set(code, room);
      ws.meta.roomCode = code;

      send(ws, { type: "room_created", roomCode: code });
      send(ws, roomState(room));
      return;
    }

    // --- JOIN ROOM ---
    if (type === "join_room") {
      if (ws.meta.roomCode) return send(ws, { type: "error", message: "Ya estás en una sala" });

      const code = (msg.roomCode || "").toString().trim().toUpperCase();
      const room = rooms.get(code);
      if (!room) return send(ws, { type: "error", message: "Sala no existe" });
      if (room.players.length >= 2) return send(ws, { type: "error", message: "Sala llena (máx 2)" });

      room.players.push({ id: playerId, ws, choice: null, score: 0 });
      ws.meta.roomCode = code;

      broadcast(room, { type: "room_joined", roomCode: code });
      broadcast(room, roomState(room));
      return;
    }

    // A partir de aquí necesitas estar en sala
    const code = ws.meta.roomCode;
    const room = code ? rooms.get(code) : null;
    if (!room) return send(ws, { type: "error", message: "No estás en una sala" });

    const me = room.players.find(p => p.id === playerId);
    if (!me) return send(ws, { type: "error", message: "Jugador no encontrado en la sala" });

    // --- SELECT GAME ---
    if (type === "select_game") {
      if (room.players.length < 2) {
        return send(ws, { type: "error", message: "Esperando a otro jugador" });
      }
      
      const mode = msg.mode;
      if (!['rps', 'ttt', 'oe', 'dab'].includes(mode)) {
        return send(ws, { type: "error", message: "Modo de juego inválido" });
      }
      
      room.gameMode = mode;
      
      if (mode === 'ttt') {
        const [p1, p2] = room.players;
        room.tttState = {
          board: Array(9).fill(null),
          currentTurn: p1.id,
          symbols: { [p1.id]: 'X', [p2.id]: 'O' },
          gameOver: false
        };
      } else if (mode === 'oe') {
        const [p1, p2] = room.players;
        room.oeState = {
          phase: 'parity',
          players: [
            { id: p1.id, parity: null, number: null },
            { id: p2.id, parity: null, number: null }
          ],
          gameOver: false
        };
      } else if (mode === 'dab') {
        const [p1, p2] = room.players;
        // Grid 4x4 puntos = 3x3 cajas = 9 cajas
        // 12 líneas horizontales (4 filas x 3), 12 verticales (3 filas x 4)
        room.dabState = {
          hLines: Array(12).fill(null), // líneas horizontales
          vLines: Array(12).fill(null), // líneas verticales
          boxes: Array(9).fill(null),   // dueño de cada caja
          currentTurn: p1.id,
          scores: { [p1.id]: 0, [p2.id]: 0 },
          gameOver: false
        };
      } else {
        room.players.forEach(p => p.choice = null);
      }
      
      broadcast(room, { type: "game_selected", mode });
      broadcast(room, roomState(room));
      return;
    }

    // --- CHOICE (Piedra Papel Tijera) ---
    if (type === "choice") {
      if (room.gameMode !== 'rps') {
        return send(ws, { type: "error", message: "No estás en modo Piedra Papel Tijera" });
      }
      if (room.players.length < 2) return send(ws, { type: "error", message: "Esperando a otro jugador" });

      const c = msg.choice;
      if (!["rock", "paper", "scissors"].includes(c)) {
        return send(ws, { type: "error", message: "Elección inválida" });
      }

      if (me.choice !== null) {
        return send(ws, { type: "error", message: "Ya elegiste esta ronda" });
      }

      me.choice = c;
      broadcast(room, roomState(room));

      const [p1, p2] = room.players;
      if (p1.choice && p2.choice) {
        const w = winner(p1.choice, p2.choice);

        let resultText = "Empate";
        if (w === 1) { p1.score++; resultText = `Gana jugador ${p1.id}`; }
        if (w === 2) { p2.score++; resultText = `Gana jugador ${p2.id}`; }

        broadcast(room, {
          type: "result",
          p1: { id: p1.id, choice: p1.choice, score: p1.score },
          p2: { id: p2.id, choice: p2.choice, score: p2.score },
          resultText
        });

        // Reset ronda
        p1.choice = null;
        p2.choice = null;

        broadcast(room, roomState(room));
      }
      return;
    }

    // --- TTT MOVE ---
    if (type === "ttt_move") {
      if (room.gameMode !== 'ttt') {
        return send(ws, { type: "error", message: "No estás en modo 3 en raya" });
      }
      
      const ttt = room.tttState;
      if (!ttt || ttt.gameOver) {
        return send(ws, { type: "error", message: "Juego no iniciado o terminado" });
      }
      
      if (ttt.currentTurn !== playerId) {
        return send(ws, { type: "error", message: "No es tu turno" });
      }
      
      const cell = msg.cell;
      if (cell < 0 || cell > 8 || ttt.board[cell] !== null) {
        return send(ws, { type: "error", message: "Movimiento inválido" });
      }
      
      ttt.board[cell] = ttt.symbols[playerId];
      
      const result = checkTTTWinner(ttt.board);
      if (result) {
        ttt.gameOver = true;
        
        let winnerId = null;
        if (result.winner !== 'draw') {
          winnerId = Object.keys(ttt.symbols).find(id => ttt.symbols[id] === result.winner);
          const winnerPlayer = room.players.find(p => p.id === parseInt(winnerId));
          if (winnerPlayer) winnerPlayer.score++;
        }
        
        broadcast(room, {
          type: "ttt_result",
          winnerId: winnerId ? parseInt(winnerId) : null,
          winLine: result.line,
          board: ttt.board
        });
      } else {
        const [p1, p2] = room.players;
        ttt.currentTurn = ttt.currentTurn === p1.id ? p2.id : p1.id;
      }
      
      broadcast(room, roomState(room));
      return;
    }

    // --- RESET TTT ---
    if (type === "reset_ttt") {
      if (room.gameMode !== 'ttt') {
        return send(ws, { type: "error", message: "No estás en modo 3 en raya" });
      }
      
      const [p1, p2] = room.players;
      room.tttState = {
        board: Array(9).fill(null),
        currentTurn: p1.id,
        symbols: room.tttState.symbols,
        gameOver: false
      };
      
      broadcast(room, roomState(room));
      return;
    }

    // --- OE PARITY (Par o Impar - elegir paridad) ---
    if (type === "oe_parity") {
      if (room.gameMode !== 'oe') {
        return send(ws, { type: "error", message: "No estás en modo Par o Impar" });
      }
      
      const oe = room.oeState;
      if (!oe || oe.phase !== 'parity') {
        return send(ws, { type: "error", message: "No es fase de elegir paridad" });
      }
      
      const parity = msg.parity;
      if (!['even', 'odd'].includes(parity)) {
        return send(ws, { type: "error", message: "Paridad inválida" });
      }
      
      const myOe = oe.players.find(p => p.id === playerId);
      if (myOe.parity !== null) {
        return send(ws, { type: "error", message: "Ya elegiste paridad" });
      }
      
      myOe.parity = parity;
      
      // Si ambos eligieron paridad, pasar a fase de números
      if (oe.players.every(p => p.parity !== null)) {
        oe.phase = 'number';
        broadcast(room, { type: "oe_phase", phase: "number" });
      }
      
      broadcast(room, roomState(room));
      return;
    }

    // --- OE NUMBER (Par o Impar - elegir número) ---
    if (type === "oe_number") {
      if (room.gameMode !== 'oe') {
        return send(ws, { type: "error", message: "No estás en modo Par o Impar" });
      }
      
      const oe = room.oeState;
      if (!oe || oe.phase !== 'number') {
        return send(ws, { type: "error", message: "No es fase de elegir número" });
      }
      
      const number = parseInt(msg.number);
      if (isNaN(number) || number < 1 || number > 10) {
        return send(ws, { type: "error", message: "Número inválido (1-10)" });
      }
      
      const myOe = oe.players.find(p => p.id === playerId);
      if (myOe.number !== null) {
        return send(ws, { type: "error", message: "Ya elegiste número" });
      }
      
      myOe.number = number;
      broadcast(room, roomState(room));
      
      // Si ambos eligieron número, calcular resultado
      if (oe.players.every(p => p.number !== null)) {
        const [oeP1, oeP2] = oe.players;
        const sum = oeP1.number + oeP2.number;
        const sumIsEven = sum % 2 === 0;
        
        let winnerId = null;
        let resultText = "";
        
        // Determinar ganador
        const evenPlayer = oe.players.find(p => p.parity === 'even');
        const oddPlayer = oe.players.find(p => p.parity === 'odd');
        
        if (sumIsEven) {
          winnerId = evenPlayer.id;
          resultText = `Suma ${sum} (PAR) - ¡Gana jugador ${winnerId}!`;
        } else {
          winnerId = oddPlayer.id;
          resultText = `Suma ${sum} (IMPAR) - ¡Gana jugador ${winnerId}!`;
        }
        
        // Actualizar score
        const winnerPlayer = room.players.find(p => p.id === winnerId);
        if (winnerPlayer) winnerPlayer.score++;
        
        oe.gameOver = true;
        
        broadcast(room, {
          type: "oe_result",
          p1: { id: oeP1.id, parity: oeP1.parity, number: oeP1.number },
          p2: { id: oeP2.id, parity: oeP2.parity, number: oeP2.number },
          sum,
          sumIsEven,
          winnerId,
          resultText
        });
        
        broadcast(room, roomState(room));
      }
      return;
    }

    // --- RESET OE ---
    if (type === "reset_oe") {
      if (room.gameMode !== 'oe') {
        return send(ws, { type: "error", message: "No estás en modo Par o Impar" });
      }
      
      const [p1, p2] = room.players;
      room.oeState = {
        phase: 'parity',
        players: [
          { id: p1.id, parity: null, number: null },
          { id: p2.id, parity: null, number: null }
        ],
        gameOver: false
      };
      
      broadcast(room, roomState(room));
      return;
    }

    // --- DAB MOVE (Dots and Boxes) ---
    if (type === "dab_move") {
      if (room.gameMode !== 'dab') {
        return send(ws, { type: "error", message: "No estás en modo Puntos y Cajas" });
      }
      
      const dab = room.dabState;
      if (!dab || dab.gameOver) {
        return send(ws, { type: "error", message: "Juego no iniciado o terminado" });
      }
      
      if (dab.currentTurn !== playerId) {
        return send(ws, { type: "error", message: "No es tu turno" });
      }
      
      const { lineType, lineIndex } = msg;
      const lines = lineType === 'h' ? dab.hLines : dab.vLines;
      
      if (lineIndex < 0 || lineIndex >= lines.length || lines[lineIndex] !== null) {
        return send(ws, { type: "error", message: "Línea inválida" });
      }
      
      // Marcar la línea
      lines[lineIndex] = playerId;
      
      // Verificar si se cerró alguna caja
      let boxesClosed = 0;
      
      // Para cada caja, verificar si está completa
      // Grid 3x3 cajas, caja (row, col) donde row,col = 0,1,2
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const boxIndex = row * 3 + col;
          if (dab.boxes[boxIndex] !== null) continue; // Ya cerrada
          
          // Líneas que forman esta caja:
          // Top: hLines[row * 3 + col]
          // Bottom: hLines[(row + 1) * 3 + col]
          // Left: vLines[row * 4 + col]
          // Right: vLines[row * 4 + col + 1]
          const top = dab.hLines[row * 3 + col];
          const bottom = dab.hLines[(row + 1) * 3 + col];
          const left = dab.vLines[row * 4 + col];
          const right = dab.vLines[row * 4 + col + 1];
          
          if (top !== null && bottom !== null && left !== null && right !== null) {
            dab.boxes[boxIndex] = playerId;
            dab.scores[playerId]++;
            boxesClosed++;
          }
        }
      }
      
      // Verificar si el juego terminó (todas las cajas cerradas)
      if (dab.boxes.every(b => b !== null)) {
        dab.gameOver = true;
        
        const [p1, p2] = room.players;
        const score1 = dab.scores[p1.id];
        const score2 = dab.scores[p2.id];
        
        let winnerId = null;
        if (score1 > score2) {
          winnerId = p1.id;
          p1.score++;
        } else if (score2 > score1) {
          winnerId = p2.id;
          p2.score++;
        }
        // Si empate, nadie suma punto global
        
        broadcast(room, {
          type: "dab_result",
          winnerId,
          scores: dab.scores
        });
      } else if (boxesClosed === 0) {
        // Si no cerró ninguna caja, cambia el turno
        const [p1, p2] = room.players;
        dab.currentTurn = dab.currentTurn === p1.id ? p2.id : p1.id;
      }
      // Si cerró cajas, sigue siendo su turno
      
      broadcast(room, roomState(room));
      return;
    }

    // --- RESET DAB ---
    if (type === "reset_dab") {
      if (room.gameMode !== 'dab') {
        return send(ws, { type: "error", message: "No estás en modo Puntos y Cajas" });
      }
      
      const [p1, p2] = room.players;
      room.dabState = {
        hLines: Array(12).fill(null),
        vLines: Array(12).fill(null),
        boxes: Array(9).fill(null),
        currentTurn: p1.id,
        scores: { [p1.id]: 0, [p2.id]: 0 },
        gameOver: false
      };
      
      broadcast(room, roomState(room));
      return;
    }

    // --- CHANGE GAME ---
    if (type === "change_game") {
      room.gameMode = null;
      room.tttState = null;
      room.oeState = null;
      room.dabState = null;
      room.players.forEach(p => p.choice = null);
      
      broadcast(room, { type: "game_changed" });
      broadcast(room, roomState(room));
      return;
    }

    // --- PLAY AGAIN ---
    if (type === "play_again") {
      me.choice = null;
      broadcast(room, roomState(room));
      return;
    }

    send(ws, { type: "error", message: "Evento no reconocido" });
  });

  ws.on("close", () => {
    const code = ws.meta.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);

    if (room.players.length === 0) {
      rooms.delete(code);
    } else {
      broadcast(room, { type: "error", message: "El otro jugador se desconectó" });
      broadcast(room, roomState(room));
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
