import app from '../server/src/app';
import connectDB from '../server/src/config/database';

// Ensure MongoDB Atlas is connected
connectDB();

export default app;
