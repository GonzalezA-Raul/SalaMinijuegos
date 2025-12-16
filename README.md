# 🪨📄✂️ Piedra, Papel o Tijera - Multijugador WebSocket

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-ws-blue?style=flat-square)](https://github.com/websockets/ws)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

Juego multijugador de **Piedra, Papel o Tijera** usando WebSockets para comunicación en tiempo real.  
Juega contra amigos en la misma red local sin complicaciones. 🎮

[Características](#características) • [Instalación](#instalación-local) • [Docker](#-docker) • [API](#-api-websocket) • [FAQ](#-troubleshooting)

</div>

---

## ✨ Características

- ✅ **Multijugador en tiempo real** — Comunicación instantánea vía WebSockets
- ✅ **Salas dinámicas** — Crea o únete a salas con códigos únicos (6 caracteres)
- ✅ **Sin servidor externo** — Todo funciona localmente en tu PC o servidor
- ✅ **Docker ready** — Despliega en minutos con un simple comando
- ✅ **Red local** — Juega con amigos en la misma WiFi/LAN
- ✅ **Diseño responsive** — Interfaz limpia y moderna
- ✅ **Marcador persistente** — Mantiene puntos durante la sesión

---

## 📋 Estructura del Proyecto

```plaintext
rps-ws/
 ├── server.js # Servidor WebSocket + Express
 ├── index.html # UI principal
 ├── src/ │
 ├── main.js # Lógica cliente WebSocket
 │ └── style.css # Estilos
 ├── package.json
 ├── Dockerfile
 ├── .dockerignore
 └── README.md
```

---

## 🎮 Cómo Funciona

### Arquitectura
- **Backend**: Servidor Node.js con Express y WebSocket Server (ws)
- **Frontend**: HTML/CSS/JavaScript vanilla con WebSocket client
- **Comunicación**: Protocolo WebSocket bidireccional en tiempo real

### Flujo del Juego

1. **Crear/Unirse a Sala**
   - Un jugador crea una sala (genera código de 6 caracteres)
   - Otro jugador se une usando ese código
   - Máximo 2 jugadores por sala

2. **Jugar**
   - Cuando hay 2 jugadores, se habilitan los botones
   - Cada jugador elige: Piedra, Papel o Tijera
   - El servidor determina el ganador automáticamente
   - Se actualiza el marcador en tiempo real

3. **Sistema de Puntos**
   - Piedra vence Tijera 🪨 > ✂️
   - Papel vence Piedra 📄 > 🪨
   - Tijera vence Papel ✂️ > 📄
   - Los puntos se acumulan durante la sesión

### Mensajes WebSocket

**Cliente → Servidor:**
- `create_room`: Crear nueva sala
- `join_room`: Unirse a sala existente
- `choice`: Enviar elección (rock/paper/scissors)

**Servidor → Cliente:**
- `connected`: Confirmación de conexión + ID jugador
- `room_created`: Sala creada exitosamente
- `room_joined`: Unido a sala
- `state`: Estado actual de la sala
- `result`: Resultado de la ronda
- `error`: Mensaje de error

---

## 🚀 Instalación Local (Sin Docker)

```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🐳 Instalación con Docker

### Requisitos Previos
- Docker instalado en tu PC ([Descargar Docker](https://www.docker.com/))
- Estar en la misma red local que tu amigo

### Paso 1: Construir la Imagen
```bash
docker build -t rps-game .
```

### Paso 2: Ejecutar el Contenedor
```bash
docker run -p 3000:3000 rps-game
```

### Paso 3: Jugar en Red Local

Encuentra tu IP local:

**Windows (CMD o PowerShell):**
```bash
ipconfig
```
Busca "Dirección IPv4" (ejemplo: 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```

**Jugador 1 (anfitrión):**
- Ejecuta el contenedor Docker
- Abre en tu navegador: [http://localhost:3000](http://localhost:3000)
- Haz clic en "Crear sala"
- Comparte el código de 6 caracteres con tu amigo

**Jugador 2 (invitado):**
- Abre en tu navegador: [http://IP_DEL_ANFITRION:3000](http://IP_DEL_ANFITRION:3000)
  Ejemplo: [http://192.168.1.100:3000](http://192.168.1.100:3000)
- Introduce el código de sala que te compartieron
- Haz clic en "Unirme"

¡A jugar!

---

## 🛠️ Comandos Docker Útiles

```bash
# Listar contenedores activos
docker ps

# Ver logs del contenedor
docker logs <container_id>

# Reconstruir la imagen sin usar caché
docker build --no-cache -t rps-game .
```

---

## 🔧 Configuración Avanzada

### Cambiar Puerto
```bash
docker run -p 8080:3000 rps-game
```
Accede en: [http://localhost:8080](http://localhost:8080)

### Modo Desarrollo con Volúmenes
```bash
docker run -p 3000:3000 -v $(pwd):/app rps-game
```

---

## 🛠️ Tecnologías

- **Node.js v18** — Runtime JavaScript
- **Express v4.18** — Servidor HTTP
- **ws v8.14** — WebSocket server/client
- **Docker** — Containerización

---

## 📝 Notas Importantes

- ✅ Las salas se mantienen en memoria (se pierden al reiniciar el servidor)
- ✅ Máximo 2 jugadores por sala
- ✅ Los códigos de sala son únicos y de 6 caracteres alfanuméricos
- ✅ Si un jugador se desconecta, la sala queda inválida
- ✅ El servidor escucha en 0.0.0.0 para permitir conexiones externas
- ⚠️ No revelar las elecciones hasta que ambos jugadores elijan

---

## 🐛 Troubleshooting

### No puedo conectarme desde otro PC:
- ✅ Verifica que ambos estén en la misma red WiFi/LAN
- ✅ Desactiva el firewall temporalmente o permite el puerto 3000
- ✅ Usa la IP local (192.168.x.x), NO uses localhost desde otro PC
- ✅ Asegúrate de que el contenedor esté corriendo: `docker ps`

### El contenedor no inicia:
- ✅ Verifica que el puerto 3000 no esté en uso:
  - **Mac/Linux:** `lsof -i :3000`
  - **Windows:** `netstat -ano | findstr :3000`
- ✅ Revisa logs del contenedor: `docker logs <container_id>`
- ✅ Reconstruye la imagen: `docker build --no-cache -t rps-game .`

### Problemas de conexión WebSocket:
- ✅ Asegúrate de usar `ws://` (no `wss://`) en red local
- ✅ Verifica que el navegador permita WebSockets (Chrome, Firefox, Edge modernos)
- ✅ Comprueba la consola del navegador (F12) para errores

### El juego no responde:
- ✅ Ambos jugadores deben estar en la sala antes de jugar
- ✅ Espera a que aparezca "2/2" en la interfaz
- ✅ Refresca la página si los botones no se habilitan

---

## 📄 Licencia

MIT - Úsalo libremente para aprender

---

## 👨‍💻 Autor

Raúl González