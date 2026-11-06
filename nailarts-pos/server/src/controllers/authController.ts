import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { ENV } from '../config/env';
import { AuthenticatedRequest } from '../middlewares/auth';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive) {
        res.status(401).json({ success: false, message: 'Email atau password salah.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Email atau password salah.' });
        return;
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login berhasil.',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            commissionRate: user.commissionRate,
          },
          token,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role = 'ARTIST', phone, commissionRate } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          phone,
          commissionRate: commissionRate !== undefined ? Number(commissionRate) : 0.20,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Pengguna berhasil didaftarkan.',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          commissionRate: true,
          createdAt: true,
        },
      });

      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
