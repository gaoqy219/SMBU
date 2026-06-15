import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import { networkInterfaces } from 'node:os';
import { initSchema } from './db/schema.js';
import { seed } from './db/seed.js';
import { startAutoSave, closeDb } from './db/connection.js';
import { adminRouter } from './routes/admin.js';
import { setupGameHandlers } from './game/GameEngine.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
});

const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// LAN IP detection
function getLanIP(): string {
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    const net = ifaces[name];
    if (!net) continue;
    for (const info of net) {
      if (info.family === 'IPv4' && !info.internal) {
        // Skip virtual interfaces
        if (name.includes('vnic') || name.includes('utun') || name.includes('bridge')) continue;
        return info.address;
      }
    }
  }
  return '127.0.0.1';
}

const lanIP = getLanIP();
const serverURL = `http://${lanIP}:${PORT}`;

// Socket.io — game handlers
setupGameHandlers(io);

// Serve static in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
}

async function start() {
  await initSchema();
  await seed();
  startAutoSave(30000);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║   语法推箱子 Grammar Sokoban Server  ║');
    console.log('  ╠══════════════════════════════════════╣');
    console.log(`  ║  Local:   http://localhost:${PORT}       ║`);
    console.log(`  ║  Network: ${serverURL}  ║`);
    console.log('  ╚══════════════════════════════════════╝');
    console.log('');
  });
}

process.on('SIGINT', () => { closeDb(); process.exit(0); });
process.on('SIGTERM', () => { closeDb(); process.exit(0); });

start().catch(e => { console.error(e); process.exit(1); });
