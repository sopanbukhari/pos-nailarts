import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_nailart_pos_jwt_key_2025',
  DATABASE_URL: process.env.DATABASE_URL || 'file:../prisma/dev.db',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};
