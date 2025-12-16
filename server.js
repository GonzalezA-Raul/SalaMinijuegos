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

// Rooms en memoria (suficiente para práctica)
const rooms = new Map(); // code -> { code, players:[{id,ws,choice,score}], locked:boolean }

let nextPlayerId = 1;

function roomState(room) {
  return {
    type: "state",
    roomCode: room.code,
    players: room.players.map(p => ({
      id: p.id,
      score: p.score,
      // IMPORTANTE: no revelar la elección hasta que ambos elijan
      hasChosen: p.choice !== null
    }))
  };
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
        ]
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

      // Notificar a ambos
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

    // --- CHOICE ---
    if (type === "choice") {
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

    // --- PLAY AGAIN (opcional, aquí solo fuerza reset si alguien se quedó colgado) ---
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

    // si queda alguien, avisa y elimina sala si vacía
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
