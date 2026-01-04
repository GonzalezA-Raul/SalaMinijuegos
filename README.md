# 🎮 Sala de Juegos Multijugador - WebSocket

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-ws-blue?style=flat-square)](https://github.com/websockets/ws)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Sala de juegos multijugador** con 4 minijuegos usando WebSockets para comunicación en tiempo real.  
Juega contra amigos en la misma red local o despliega con Docker. 🎮

[Juegos](#-juegos-disponibles) • [Instalación](#-instalación-local) • [Docker](#-docker) • [Red Local](#-jugar-en-red-local)

</div>

---

## 🎯 Juegos Disponibles

### 🪨📄✂️ Piedra, Papel o Tijera
El clásico juego de manos. Elige tu opción y espera a que tu rival elija la suya. ¡El ganador suma un punto!

### ⭕❌ 3 en Raya (Tic-Tac-Toe)
Coloca 3 símbolos en línea (horizontal, vertical o diagonal) para ganar. Turnos alternados.

### 🔢 Par o Impar
1. Cada jugador elige si quiere **PAR** o **IMPAR**
2. Cada jugador elige un número del **1 al 10**
3. Se suman los números: si la suma es par, gana quien eligió PAR; si es impar, gana quien eligió IMPAR

### 🔳 Puntos y Cajas (Dots and Boxes)
1. Cuadrícula de 4x4 puntos (9 cajas posibles)
2. Por turnos, dibuja una línea entre dos puntos adyacentes
3. **Si cierras una caja**, la anotas y **juegas otra vez**
4. Gana quien cierra más cajas

---

## ✨ Características

- ✅ **4 minijuegos** — Variedad para no aburrirse
- ✅ **Multijugador en tiempo real** — Comunicación instantánea vía WebSockets
- ✅ **Salas con códigos** — Crea o únete con códigos de 6 caracteres
- ✅ **Selector de juegos** — Cambia de juego sin salir de la sala
- ✅ **Marcador visual** — Puntuación persistente durante la sesión
- ✅ **Docker ready** — Despliega en minutos
- ✅ **Red local** — Juega con amigos en la misma WiFi/LAN
- ✅ **Diseño moderno** — Interfaz limpia con animaciones

---

## 📋 Estructura del Proyecto

```plaintext
PiedraPapelTijera/
├── server.js        # Servidor WebSocket + Express (lógica de todos los juegos)
├── index.html       # UI principal con todos los juegos
├── src/
│   ├── main.js      # Lógica cliente WebSocket
│   └── style.css    # Estilos y animaciones
├── package.json
├── Dockerfile
└── README.md
```

---

## 🚀 Instalación Local

### Requisitos
- [Node.js](https://nodejs.org/) v18 o superior
- npm (viene con Node.js)

### Pasos

```bash
# 1. Clonar o descargar el proyecto
git clone <tu-repo> && cd PiedraPapelTijera

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor
npm start
```

### Abrir en el navegador
```
http://localhost:3000
```

---

## 🐳 Docker

### Opción 1: Construir y ejecutar

```bash
# Construir la imagen
docker build -t sala-juegos .

# Ejecutar el contenedor
docker run -d -p 3000:3000 --name juegos sala-juegos
```

### Opción 2: Con Docker Compose

Crea un archivo `docker-compose.yml`:

```yaml
version: '3.8'
services:
  juegos:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
```

Luego ejecuta:

```bash
docker-compose up -d
```

### Verificar que funciona

```bash
# Ver logs
docker logs juegos

# Debería mostrar: Server running on http://localhost:3000
```

---

## 🌐 Jugar en Red Local

¡Puedes jugar con amigos conectados a la **misma red WiFi o LAN**!

### Paso 1: Obtener tu IP local

**Windows:**
```powershell
ipconfig
# Busca "IPv4 Address" (ej: 192.168.1.50)
```

**Mac/Linux:**
```bash
ifconfig | grep "inet "
# O también:
hostname -I
```

### Paso 2: Iniciar el servidor

```bash
npm start
# O con Docker:
docker run -d -p 3000:3000 --name juegos sala-juegos
```

### Paso 3: Conectarse desde otros dispositivos

En el navegador de **cualquier dispositivo en la misma red**, abre:

```
http://<TU-IP-LOCAL>:3000

# Ejemplo:
http://192.168.1.50:3000
```

### Paso 4: Crear y unirse a una sala

1. **Jugador 1**: Pulsa "Crear sala" → Comparte el código (ej: `ABC123`)
2. **Jugador 2**: Introduce el código y pulsa "Unirme"
3. **¡A jugar!** Seleccionen un juego y disfruten

---

## 🎮 Cómo Jugar

### Flujo del juego

1. **Crear/Unirse** — Un jugador crea sala, otro se une con el código
2. **Selector** — Cuando hay 2 jugadores, aparece el menú de juegos
3. **Jugar** — Cada juego tiene sus propias reglas (ver arriba)
4. **Volver a jugar** — Al terminar, pulsa "Jugar otra ronda"
5. **Cambiar juego** — Pulsa "Cambiar de juego" para volver al selector

### Controles

| Acción | Descripción |
|--------|-------------|
| `Crear sala` | Genera un código único para la sala |
| `Unirme` | Introduce un código para unirte |
| `🔄 Cambiar de juego` | Volver al selector de juegos |
| `🔁 Jugar otra ronda` | Reiniciar el juego actual |

---

## 🔧 Configuración

### Puerto personalizado

Puedes cambiar el puerto con la variable de entorno `PORT`:

```bash
# Local
PORT=8080 npm start

# Docker
docker run -d -p 8080:8080 -e PORT=8080 --name juegos sala-juegos
```

### Firewall (Windows)

Si otros dispositivos no pueden conectarse, asegúrate de que el puerto esté abierto:

```powershell
# Abrir puerto 3000 en el firewall de Windows
netsh advfirewall firewall add rule name="Sala Juegos" dir=in action=allow protocol=tcp localport=3000
```

---

## 🛠️ Desarrollo

```bash
# Ejecutar en modo desarrollo (mismo que start)
npm run dev

# El servidor se ejecuta en http://localhost:3000
# Los cambios en archivos estáticos se reflejan al recargar el navegador
```

---

## 📡 API WebSocket

### Mensajes del Cliente → Servidor

| Tipo | Payload | Descripción |
|------|---------|-------------|
| `create_room` | - | Crear nueva sala |
| `join_room` | `{ roomCode }` | Unirse a sala existente |
| `select_game` | `{ mode }` | Seleccionar juego (`rps`, `ttt`, `oe`, `dab`) |
| `choice` | `{ choice }` | Piedra/Papel/Tijera (`rock`, `paper`, `scissors`) |
| `ttt_move` | `{ cell }` | Movimiento en 3 en raya (0-8) |
| `oe_parity` | `{ parity }` | Elegir par/impar (`even`, `odd`) |
| `oe_number` | `{ number }` | Elegir número (1-10) |
| `dab_move` | `{ lineType, lineIndex }` | Dibujar línea (`h`/`v`, índice) |
| `reset_*` | - | Reiniciar juego (`reset_ttt`, `reset_oe`, `reset_dab`) |
| `change_game` | - | Volver al selector |

### Mensajes del Servidor → Cliente

| Tipo | Descripción |
|------|-------------|
| `connected` | Conexión establecida con `playerId` |
| `room_created` | Sala creada con `roomCode` |
| `room_joined` | Unido a sala |
| `state` | Estado actual de la sala y juego |
| `game_selected` | Juego seleccionado |
| `result` | Resultado de Piedra/Papel/Tijera |
| `ttt_result` | Resultado de 3 en raya |
| `oe_result` | Resultado de Par o Impar |
| `dab_result` | Resultado de Puntos y Cajas |
| `error` | Mensaje de error |

---

## ❓ FAQ / Troubleshooting

### No puedo conectarme desde otro dispositivo

1. Verifica que ambos estén en la **misma red WiFi/LAN**
2. Usa la **IP local** del host (no `localhost`)
3. Revisa el **firewall** del host
4. Prueba desactivar temporalmente el antivirus

### El WebSocket no conecta

- Asegúrate de usar `http://` (no `https://`) en red local
- El navegador debe soportar WebSockets (todos los modernos lo hacen)

### Docker: puerto ya en uso

```bash
# Ver qué usa el puerto
netstat -ano | findstr :3000

# Matar el proceso o usar otro puerto
docker run -d -p 3001:3000 --name juegos sala-juegos
```

### El juego no responde

- Recarga la página (F5)
- Verifica que el servidor esté corriendo
- Revisa la consola del navegador (F12) para errores

---

## 📄 Licencia

MIT License - Usa, modifica y comparte libremente.

---

<div align="center">

**¡Diviértete jugando!** 🎮

Hecho con ❤️ usando Node.js y WebSockets

</div>