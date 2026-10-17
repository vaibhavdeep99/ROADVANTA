import app from './app';
import config from './config';
import connectDB from './config/database';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(config.port, () => {
      console.log('');
      console.log('🚀 ═══════════════════════════════════════════');
      console.log('   ROADVANTA AI — Server');
      console.log('   Detect. Predict. Protect.');
      console.log('═══════════════════════════════════════════════');
      console.log(`   🌐 Environment : ${config.nodeEnv}`);
      console.log(`   🔗 Server      : http://localhost:${config.port}`);
      console.log(`   📡 API         : http://localhost:${config.port}/api/v1`);
      console.log(`   💊 Health      : http://localhost:${config.port}/api/v1/health`);
      console.log(`   🎨 Frontend    : ${config.frontendUrl}`);
      console.log(`   🤖 Gemini      : ${config.gemini.apiKey ? '✅ Configured' : '❌ Not configured'}`);
      console.log('═══════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

startServer();

export default app;
