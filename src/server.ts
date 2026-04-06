import prisma from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 3000;

try {
  await prisma.$connect();
  console.log('Successfully connected to the database');

  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  // Graceful Shutdown
  const shutdown = async () => {
    console.log('Shutting down server...');
    await prisma.$disconnect();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error('Failed to start the server:', error);
  process.exit(1);
}
