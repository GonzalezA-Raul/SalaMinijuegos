const info = document.getElementById("info");
const log = document.getElementById("log");
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const roomCodeInput = document.getElementById("roomCode");
const choiceButtons = [...document.querySelectorAll(".choice")];

function addLog(line) {
  log.textContent = `${line}\n` + log.textContent;
}

function setChoicesEnabled(enabled) {
  choiceButtons.forEach(b => b.disabled = !enabled);
}

// ws:// en local, wss:// en cloud (el navegador lo resuelve si usas la misma URL)
const wsProtocol = location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${wsProtocol}://${location.host}`);

let myId = null;
let currentRoom = null;

ws.addEventListener("open", () => {
  info.textContent = "Conectado. Crea sala o únete a una existente.";
  addLog("WS open");
});

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);

  if (msg.type === "connected") {
    myId = msg.playerId;
    addLog(`Tu id: ${myId}`);
    return;
  }

  if (msg.type === "room_created") {
    currentRoom = msg.roomCode;
    info.textContent = `Sala creada: ${currentRoom} (pasa este código)`;
    addLog(`Sala creada: ${currentRoom}`);
    return;
  }

  if (msg.type === "room_joined") {
    currentRoom = msg.roomCode;
    info.textContent = `En sala: ${currentRoom}. Cuando seáis 2, podéis jugar.`;
    addLog(`Sala lista: ${currentRoom}`);
    return;
  }

  if (msg.type === "state") {
    const players = msg.players || [];
    const ready = players.length === 2;
    setChoicesEnabled(ready);

    const status = players.map(p =>
      `Jugador ${p.id} | score ${p.score} | eligió: ${p.hasChosen ? "sí" : "no"}`
    ).join(" — ");

    info.textContent = `Sala ${msg.roomCode} | ${ready ? "2/2" : `${players.length}/2`} | ${status}`;
    return;
  }

  if (msg.type === "result") {
    addLog(`RESULTADO: ${msg.resultText}
- J${msg.p1.id}: ${msg.p1.choice} (score ${msg.p1.score})
- J${msg.p2.id}: ${msg.p2.choice} (score ${msg.p2.score})`);
    return;
  }

  if (msg.type === "error") {
    addLog(`ERROR: ${msg.message}`);
    return;
  }

  addLog(`Mensaje: ${ev.data}`);
});

ws.addEventListener("close", () => {
  info.textContent = "Conexión cerrada.";
  setChoicesEnabled(false);
});

btnCreate.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "create_room" }));
});

btnJoin.addEventListener("click", () => {
  const roomCode = roomCodeInput.value.trim().toUpperCase();
  ws.send(JSON.stringify({ type: "join_room", roomCode }));
});

choiceButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const choice = btn.dataset.choice;
    ws.send(JSON.stringify({ type: "choice", choice }));
  });
});
