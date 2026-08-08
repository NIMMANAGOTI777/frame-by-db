require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
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

// Start Server on 0.0.0.0
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Express API running on port ${PORT}`);
});

connectDB()
  .then(() => {
    console.log('[DATABASE] MongoDB connected');
  })
  .catch((error) => {
    console.error('[DATABASE] MongoDB connection failed:', error.message);
  });
