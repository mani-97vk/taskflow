import http from 'http';
import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSocketIO } from './sockets/socketHandler.js';

const httpServer = http.createServer(app);

// Initialize real-time Socket.IO
initSocketIO(httpServer);

async function startServer() {
  await connectDB();

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 TaskFlow Backend running on http://localhost:${env.PORT}`);
    console.log(`📡 Socket.IO listening for real-time collaboration`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
  });
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing HTTP server and database...');
  httpServer.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Closing HTTP server and database...');
  httpServer.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

startServer();
