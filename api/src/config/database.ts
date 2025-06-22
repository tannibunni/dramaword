import mongoose from 'mongoose';

let isConnected = false;
let connectionAttempted = false;

export async function connectDB(): Promise<void> {
  if (connectionAttempted) {
    console.log('🔄 Database connection already attempted, skipping');
    return;
  }

  connectionAttempted = true;
  
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.warn('⚠️ MongoDB URI is not defined, using mock mode');
      console.warn('⚠️ Database operations will be simulated');
      isConnected = false;
      return;
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    
    // 设置更短的超时时间
    await mongoose.connect(mongoURI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 3000, // 减少到3秒
      socketTimeoutMS: 10000, // 减少到10秒
      connectTimeoutMS: 3000, // 连接超时3秒
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    
    // 监听连接事件
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.warn('⚠️ Continuing without database connection');
    console.warn('⚠️ API will work in mock mode');
    isConnected = false;
  }
}

export function isDBConnected(): boolean {
  const readyState = mongoose.connection.readyState;
  const connected = isConnected && readyState === 1;
  
  if (connected) {
    console.log('✅ Database is connected and ready');
  } else {
    console.log(`⚠️ Database not ready - Connected: ${isConnected}, ReadyState: ${readyState}`);
  }
  
  return connected;
}

export async function disconnectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      isConnected = false;
      connectionAttempted = false;
      console.log('✅ MongoDB disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
} 