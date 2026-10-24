import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // 1. Connect to Database
    await connectDatabase();

    // 2. Initialize App
    const app = createApp();

    // 3. Start Listening
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Password Manager Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`🔒 Zero-Knowledge Cryptographic API ready at http://localhost:${env.PORT}/api`);
    });

    // 4. Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await disconnectDatabase();
          logger.info('Clean exit.');
          process.exit(0);
        } catch (err) {
          logger.error('Error during database disconnect', err);
          process.exit(1);
        }
      });

      // Force shutdown after 10s timeout
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Fatal bootstrap error', error);
    process.exit(1);
  }
}

bootstrap();
