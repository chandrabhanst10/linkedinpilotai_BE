import mongoose from 'mongoose';
import { getErrorMessage } from '../utils/errors.js';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/linkpilot');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: unknown) {
    console.error(`MongoDB Connection Error: ${getErrorMessage(error)}`);
    process.exit(1);
  }
};

export default connectDB;
