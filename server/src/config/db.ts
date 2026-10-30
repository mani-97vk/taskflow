import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ MongoDB connected successfully to: ${env.MONGODB_URI.split('@').pop()}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    if (env.NODE_ENV !== 'test') {
      // In dev/prod, if MongoDB is unavailable, log clearly
      console.warn('⚠️ Server will continue, but database operations will fail until MongoDB is accessible.');
    }
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
}
