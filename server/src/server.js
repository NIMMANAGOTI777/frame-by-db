require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// Initialize Database
connectDB().then(() => {
  // Create HTTP Server
  const server = http.createServer(app);

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || 'http://localhost:3000',
        'http://localhost:3000'
      ],
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
      credentials: true
    }
  });

  // Attach socketio instance to express app
  app.set('socketio', io);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // Start Server
  server.listen(PORT, () => {
    console.log(`Express API Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database, aborting start:', err);
  process.exit(1);
});
