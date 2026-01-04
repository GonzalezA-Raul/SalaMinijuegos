const info = document.getElementById("info");
const log = document.getElementById("log");
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const roomCodeInput = document.getElementById("roomCode");
const choiceButtons = [...document.querySelectorAll(".choice")];
const scoreboard = document.getElementById("scoreboard");
const roundResult = document.getElementById("roundResult");
const gameSelector = document.getElementById("gameSelector");
const btnSelectRPS = document.getElementById("btnSelectRPS");
const btnSelectTTT = document.getElementById("btnSelectTTT");
const rpsGame = document.getElementById("rpsGame");
const tttGame = document.getElementById("tttGame");
const tttBoard = document.getElementById("tttBoard");
const tttTurn = document.getElementById("tttTurn");
const btnResetTTT = document.getElementById("btnResetTTT");
const tttCells = [...document.querySelectorAll(".ttt-cell")];
const btnChangeGameRPS = document.getElementById("btnChangeGameRPS");
const btnChangeGameTTT = document.getElementById("btnChangeGameTTT");
const rpsPlayAgain = document.getElementById("rpsPlayAgain");
const btnPlayAgainRPS = document.getElementById("btnPlayAgainRPS");
const rpsChoices = document.getElementById("rpsChoices");

// Par o Impar elements
const oeGame = document.getElementById("oeGame");
const btnSelectOE = document.getElementById("btnSelectOE");
const oeStatus = document.getElementById("oeStatus");
const oeParityPhase = document.getElementById("oeParityPhase");
const oeNumberPhase = document.getElementById("oeNumberPhase");
const btnEven = document.getElementById("btnEven");
const btnOdd = document.getElementById("btnOdd");
const oeNumberButtons = [...document.querySelectorAll(".oe-number")];
const oeMyParity = document.getElementById("oeMyParity");
const oePlayAgain = document.getElementById("oePlayAgain");
const btnResetOE = document.getElementById("btnResetOE");
const btnChangeGameOE = document.getElementById("btnChangeGameOE");

// Dots and Boxes elements
const dabGame = document.getElementById("dabGame");
const btnSelectDAB = document.getElementById("btnSelectDAB");
const dabBoard = document.getElementById("dabBoard");
const dabTurn = document.getElementById("dabTurn");
const dabScoreMe = document.getElementById("dabScoreMe");
const dabScoreRival = document.getElementById("dabScoreRival");
const dabPlayAgain = document.getElementById("dabPlayAgain");
const btnResetDAB = document.getElementById("btnResetDAB");
const btnChangeGameDAB = document.getElementById("btnChangeGameDAB");

let myParity = null;

function addLog(line) {
  log.textContent = `${line}\n` + log.textContent;
}

function setChoicesEnabled(enabled) {
  choiceButtons.forEach(b => b.disabled = !enabled);
}

function getChoiceEmoji(choice) {
  const emojis = { rock: "🪨", paper: "📄", scissors: "✂️" };
  return emojis[choice] || "?";
}

function showGameSelector(show) {
  gameSelector.style.display = show ? "block" : "none";
}

function showGame(mode) {
  rpsGame.style.display = mode === "rps" ? "block" : "none";
  tttGame.style.display = mode === "ttt" ? "block" : "none";
  oeGame.style.display = mode === "oe" ? "block" : "none";
  dabGame.style.display = mode === "dab" ? "block" : "none";
  // Solo ocultar el selector si estamos mostrando un juego
  if (mode) {
    gameSelector.style.display = "none";
  }
}

function updateTTTBoard(tttState) {
  if (!tttState) return;
  
  tttCells.forEach((cell, index) => {
    cell.textContent = tttState.board[index] || "";
    cell.disabled = tttState.board[index] !== null || tttState.gameOver;
    cell.classList.remove("winner");
  });
  
  if (tttState.gameOver) {
    tttTurn.textContent = "Juego terminado";
    btnResetTTT.style.display = "block";
  } else {
    const isMyTurn = tttState.currentTurn === myId;
    const mySymbol = tttState.symbols[myId];
    tttTurn.textContent = isMyTurn 
      ? `Tu turno (${mySymbol})` 
      : `Turno del oponente (${tttState.symbols[tttState.currentTurn]})`;
    btnResetTTT.style.display = "none";
    
    // Solo habilitar celdas vacías si es mi turno
    tttCells.forEach((cell, index) => {
      if (tttState.board[index] === null) {
        cell.disabled = !isMyTurn;
      }
    });
  }
}

function updateScoreboard(players) {
  if (players.length === 2) {
    scoreboard.style.display = "flex";
    
    // Encontrar mi jugador y el rival
    const me = players.find(p => p.id === myId);
    const rival = players.find(p => p.id !== myId);
    
    if (me && rival) {
      document.getElementById("p1Id").textContent = `#${me.id}`;
      document.getElementById("p1Score").textContent = me.score;
      document.getElementById("p1Choice").textContent = me.hasChosen ? "✓" : "?";
      
      document.getElementById("p2Id").textContent = `#${rival.id}`;
      document.getElementById("p2Score").textContent = rival.score;
      document.getElementById("p2Choice").textContent = rival.hasChosen ? "✓" : "?";
    }
  } else {
    scoreboard.style.display = "none";
  }
}

function showResult(msg) {
  const isMyWin = msg.resultText.includes(`Gana jugador ${myId}`);
  const isMyLose = msg.resultText.includes("Gana jugador") && !isMyWin;
  const isDraw = msg.resultText === "Empate";
  
  let resultClass = "";
  let resultText = "";
  
  if (isDraw) {
    resultClass = "draw";
    resultText = "🤝 EMPATE";
  } else if (isMyWin) {
    resultClass = "win";
    resultText = "🎉 ¡GANASTE!";
  } else if (isMyLose) {
    resultClass = "lose";
    resultText = "😔 Perdiste";
  }
  
  roundResult.className = `round-result ${resultClass}`;
  roundResult.textContent = resultText;
  
  // Mostrar las elecciones de cada jugador - identificar quién es quién
  const myChoice = msg.p1.id === myId ? msg.p1.choice : msg.p2.choice;
  const rivalChoice = msg.p1.id === myId ? msg.p2.choice : msg.p1.choice;
  
  document.getElementById("p1Choice").textContent = getChoiceEmoji(myChoice);
  document.getElementById("p2Choice").textContent = getChoiceEmoji(rivalChoice);
  
  // Actualizar puntajes
  const myScore = msg.p1.id === myId ? msg.p1.score : msg.p2.score;
  const rivalScore = msg.p1.id === myId ? msg.p2.score : msg.p1.score;
  document.getElementById("p1Score").textContent = myScore;
  document.getElementById("p2Score").textContent = rivalScore;
  
  // Ocultar botones de elección y mostrar "Jugar otra ronda"
  rpsChoices.style.display = "none";
  rpsPlayAgain.style.display = "block";
}

function updateOEState(oeState) {
  if (!oeState) return;
  
  const myOeState = oeState.players.find(p => p.id === myId);
  const otherOeState = oeState.players.find(p => p.id !== myId);
  
  // Si el juego terminó, mostrar botón de volver a jugar
  if (oeState.gameOver) {
    oeParityPhase.style.display = "none";
    oeNumberPhase.style.display = "none";
    oePlayAgain.style.display = "block";
    return;
  }
  
  if (oeState.phase === 'parity') {
    oeParityPhase.style.display = "block";
    oeNumberPhase.style.display = "none";
    oePlayAgain.style.display = "none";
    
    if (myOeState.hasParity) {
      oeStatus.textContent = "Esperando al otro jugador...";
      btnEven.disabled = true;
      btnOdd.disabled = true;
    } else {
      oeStatus.textContent = "Elige si quieres Par o Impar";
      btnEven.disabled = false;
      btnOdd.disabled = false;
    }
  } else if (oeState.phase === 'number') {
    oeParityPhase.style.display = "none";
    oeNumberPhase.style.display = "block";
    oePlayAgain.style.display = "none";
    
    oeMyParity.textContent = myParity === 'even' ? '✌️ PAR' : '☝️ IMPAR';
    
    if (myOeState.hasNumber) {
      oeStatus.textContent = "Esperando al otro jugador...";
      oeNumberButtons.forEach(btn => btn.disabled = true);
    } else {
      oeStatus.textContent = "Elige un número del 1 al 10";
      oeNumberButtons.forEach(btn => btn.disabled = false);
    }
  }
  
  // Actualizar marcador
  document.getElementById("p1Choice").textContent = myOeState.hasParity ? "✓" : "?";
  document.getElementById("p2Choice").textContent = otherOeState.hasParity ? "✓" : "?";
}

// Función para generar y actualizar el tablero de Dots and Boxes
function renderDABBoard(dabState) {
  if (!dabState) return;
  
  dabBoard.innerHTML = '';
  
  const isMyTurn = dabState.currentTurn === myId;
  const rivalId = dabState.scores ? Object.keys(dabState.scores).find(id => parseInt(id) !== myId) : null;
  
  // Grid 4x4 puntos, generamos 7x7 elementos (punto, línea, punto, línea...)
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const isDotRow = row % 2 === 0;
      const isDotCol = col % 2 === 0;
      
      if (isDotRow && isDotCol) {
        // Punto
        const dot = document.createElement('div');
        dot.className = 'dab-dot';
        dabBoard.appendChild(dot);
      } else if (isDotRow && !isDotCol) {
        // Línea horizontal
        const lineIndex = (row / 2) * 3 + Math.floor(col / 2);
        const btn = document.createElement('button');
        btn.className = 'dab-hline';
        const owner = dabState.hLines[lineIndex];
        if (owner !== null) {
          btn.classList.add('taken');
          btn.classList.add(owner === myId ? 'mine' : 'rival');
        } else {
          btn.disabled = !isMyTurn || dabState.gameOver;
          btn.addEventListener('click', () => {
            ws.send(JSON.stringify({ type: 'dab_move', lineType: 'h', lineIndex }));
          });
        }
        dabBoard.appendChild(btn);
      } else if (!isDotRow && isDotCol) {
        // Línea vertical
        const lineIndex = Math.floor(row / 2) * 4 + (col / 2);
        const btn = document.createElement('button');
        btn.className = 'dab-vline';
        const owner = dabState.vLines[lineIndex];
        if (owner !== null) {
          btn.classList.add('taken');
          btn.classList.add(owner === myId ? 'mine' : 'rival');
        } else {
          btn.disabled = !isMyTurn || dabState.gameOver;
          btn.addEventListener('click', () => {
            ws.send(JSON.stringify({ type: 'dab_move', lineType: 'v', lineIndex }));
          });
        }
        dabBoard.appendChild(btn);
      } else {
        // Caja
        const boxRow = Math.floor(row / 2);
        const boxCol = Math.floor(col / 2);
        const boxIndex = boxRow * 3 + boxCol;
        const box = document.createElement('div');
        box.className = 'dab-box';
        const owner = dabState.boxes[boxIndex];
        if (owner !== null) {
          box.classList.add(owner === myId ? 'mine' : 'rival');
          box.textContent = owner === myId ? '★' : '●';
        }
        dabBoard.appendChild(box);
      }
    }
  }
  
  // Actualizar info de turno y scores
  if (dabState.gameOver) {
    dabTurn.textContent = "¡Juego terminado!";
    dabPlayAgain.style.display = "block";
  } else {
    dabTurn.textContent = isMyTurn ? "Tu turno" : "Turno del rival";
    dabPlayAgain.style.display = "none";
  }
  
  const myScore = dabState.scores[myId] || 0;
  const rivalScore = rivalId ? (dabState.scores[rivalId] || 0) : 0;
  dabScoreMe.textContent = `Tú: ${myScore}`;
  dabScoreRival.textContent = `Rival: ${rivalScore}`;
}

// ws:// en local, wss:// en cloud
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

    updateScoreboard(players);

    if (!ready) {
      info.textContent = `Sala ${msg.roomCode} | Esperando jugadores (${players.length}/2)`;
      showGameSelector(false);
      showGame(null);
    } else if (!msg.gameMode) {
      info.textContent = `Sala ${msg.roomCode} | ¡Selecciona un juego!`;
      showGameSelector(true);
      showGame(null);
    } else {
      const gameName = msg.gameMode === 'rps' ? 'Piedra Papel Tijera' : 
                        msg.gameMode === 'ttt' ? '3 en Raya' : 
                        msg.gameMode === 'oe' ? 'Par o Impar' : 'Puntos y Cajas';
      info.textContent = `Sala ${msg.roomCode} | ${gameName}`;
      showGameSelector(false);
      showGame(msg.gameMode);
      
      if (msg.gameMode === 'rps') {
        setChoicesEnabled(true);
      } else if (msg.gameMode === 'ttt') {
        updateTTTBoard(msg.tttState);
      } else if (msg.gameMode === 'oe') {
        updateOEState(msg.oeState);
      } else if (msg.gameMode === 'dab') {
        renderDABBoard(msg.dabState);
      }
    }
    return;
  }

  if (msg.type === "game_selected") {
    const gameNames = { rps: 'Piedra Papel Tijera', ttt: '3 en Raya', oe: 'Par o Impar', dab: 'Puntos y Cajas' };
    addLog(`Juego seleccionado: ${gameNames[msg.mode]}`);
    // Resetear estado visual de RPS
    if (msg.mode === 'rps') {
      rpsPlayAgain.style.display = "none";
      rpsChoices.style.display = "flex";
      roundResult.className = "round-result";
      roundResult.textContent = "";
      document.getElementById("p1Choice").textContent = "?";
      document.getElementById("p2Choice").textContent = "?";
    }
    // Resetear estado de Par o Impar
    if (msg.mode === 'oe') {
      myParity = null;
      oePlayAgain.style.display = "none";
      oeParityPhase.style.display = "block";
      oeNumberPhase.style.display = "none";
      btnEven.disabled = false;
      btnOdd.disabled = false;
      roundResult.className = "round-result";
      roundResult.textContent = "";
      document.getElementById("p1Choice").textContent = "?";
      document.getElementById("p2Choice").textContent = "?";
    }
    // Resetear estado de Dots and Boxes
    if (msg.mode === 'dab') {
      dabPlayAgain.style.display = "none";
      roundResult.className = "round-result";
      roundResult.textContent = "";
    }
    return;
  }

  if (msg.type === "game_changed") {
    addLog(`Volviendo al selector de juegos`);
    // Resetear estado de RPS
    rpsPlayAgain.style.display = "none";
    rpsChoices.style.display = "flex";
    roundResult.className = "round-result";
    roundResult.textContent = "";
    // Resetear estado de Par o Impar
    myParity = null;
    oePlayAgain.style.display = "none";
    oeParityPhase.style.display = "block";
    oeNumberPhase.style.display = "none";
    // Resetear estado de Dots and Boxes
    dabPlayAgain.style.display = "none";
    dabBoard.innerHTML = '';
    return;
  }

  if (msg.type === "result") {
    showResult(msg);
    addLog(`RESULTADO: ${msg.resultText}
- J${msg.p1.id}: ${msg.p1.choice} (score ${msg.p1.score})
- J${msg.p2.id}: ${msg.p2.choice} (score ${msg.p2.score})`);
    return;
  }

  if (msg.type === "ttt_result") {
    let resultText = "";
    let resultClass = "";
    
    if (msg.winnerId === null) {
      resultText = "🤝 EMPATE";
      resultClass = "draw";
    } else if (msg.winnerId === myId) {
      resultText = "🎉 ¡GANASTE!";
      resultClass = "win";
    } else {
      resultText = "😔 Perdiste";
      resultClass = "lose";
    }
    
    roundResult.className = `round-result ${resultClass}`;
    roundResult.textContent = resultText;
    
    // Resaltar línea ganadora
    if (msg.winLine && msg.winLine.length > 0) {
      msg.winLine.forEach(index => {
        tttCells[index].classList.add("winner");
      });
    }
    
    setTimeout(() => {
      roundResult.className = "round-result";
      roundResult.textContent = "";
    }, 3000);
    
    addLog(`3 en Raya - ${msg.winnerId === null ? 'Empate' : `Gana jugador ${msg.winnerId}`}`);
    return;
  }

  if (msg.type === "oe_phase") {
    if (msg.phase === "number") {
      oeStatus.textContent = "Elige un número del 1 al 10";
    }
    return;
  }

  if (msg.type === "oe_result") {
    const isMyWin = msg.winnerId === myId;
    
    let resultClass = isMyWin ? "win" : "lose";
    let resultText = isMyWin ? "🎉 ¡GANASTE!" : "😔 Perdiste";
    
    roundResult.className = `round-result ${resultClass}`;
    roundResult.textContent = resultText;
    
    // Mostrar detalles de la suma
    const sumText = msg.sumIsEven ? 'PAR' : 'IMPAR';
    oeStatus.textContent = `${msg.p1.number} + ${msg.p2.number} = ${msg.sum} (${sumText})`;
    
    // Mostrar paridad y número de cada jugador en el marcador
    const myResult = msg.p1.id === myId ? msg.p1 : msg.p2;
    const otherResult = msg.p1.id === myId ? msg.p2 : msg.p1;
    
    const parityEmoji = (parity) => parity === 'even' ? '✌️' : '☝️';
    document.getElementById("p1Choice").textContent = `${parityEmoji(myResult.parity)} ${myResult.number}`;
    document.getElementById("p2Choice").textContent = `${parityEmoji(otherResult.parity)} ${otherResult.number}`;
    
    // Ocultar fase de números y mostrar jugar otra ronda
    oeNumberPhase.style.display = "none";
    oePlayAgain.style.display = "block";
    
    addLog(`Par o Impar - ${msg.resultText}`);
    return;
  }

  if (msg.type === "dab_result") {
    const isMyWin = msg.winnerId === myId;
    const isDraw = msg.winnerId === null;
    
    let resultClass = "";
    let resultText = "";
    
    if (isDraw) {
      resultClass = "draw";
      resultText = "🤝 EMPATE";
    } else if (isMyWin) {
      resultClass = "win";
      resultText = "🎉 ¡GANASTE!";
    } else {
      resultClass = "lose";
      resultText = "😔 Perdiste";
    }
    
    roundResult.className = `round-result ${resultClass}`;
    roundResult.textContent = resultText;
    
    addLog(`Puntos y Cajas - ${isDraw ? 'Empate' : `Gana jugador ${msg.winnerId}`}`);
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

btnSelectRPS.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "select_game", mode: "rps" }));
});

btnSelectTTT.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "select_game", mode: "ttt" }));
});

tttCells.forEach(cell => {
  cell.addEventListener("click", () => {
    const cellIndex = parseInt(cell.dataset.cell);
    ws.send(JSON.stringify({ type: "ttt_move", cell: cellIndex }));
  });
});

btnResetTTT.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "reset_ttt" }));
});

btnChangeGameRPS.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "change_game" }));
});

btnChangeGameTTT.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "change_game" }));
});

btnPlayAgainRPS.addEventListener("click", () => {
  // Ocultar botón de jugar otra ronda y mostrar elecciones
  rpsPlayAgain.style.display = "none";
  rpsChoices.style.display = "flex";
  roundResult.className = "round-result";
  roundResult.textContent = "";
  // Resetear los indicadores del marcador
  document.getElementById("p1Choice").textContent = "?";
  document.getElementById("p2Choice").textContent = "?";
});

// Par o Impar event listeners
btnSelectOE.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "select_game", mode: "oe" }));
});

btnEven.addEventListener("click", () => {
  myParity = 'even';
  ws.send(JSON.stringify({ type: "oe_parity", parity: "even" }));
});

btnOdd.addEventListener("click", () => {
  myParity = 'odd';
  ws.send(JSON.stringify({ type: "oe_parity", parity: "odd" }));
});

oeNumberButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const number = parseInt(btn.dataset.number);
    ws.send(JSON.stringify({ type: "oe_number", number }));
  });
});

btnResetOE.addEventListener("click", () => {
  myParity = null;
  roundResult.className = "round-result";
  roundResult.textContent = "";
  ws.send(JSON.stringify({ type: "reset_oe" }));
});

btnChangeGameOE.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "change_game" }));
});

// Dots and Boxes event listeners
btnSelectDAB.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "select_game", mode: "dab" }));
});

btnResetDAB.addEventListener("click", () => {
  roundResult.className = "round-result";
  roundResult.textContent = "";
  ws.send(JSON.stringify({ type: "reset_dab" }));
});

btnChangeGameDAB.addEventListener("click", () => {
  ws.send(JSON.stringify({ type: "change_game" }));
});
