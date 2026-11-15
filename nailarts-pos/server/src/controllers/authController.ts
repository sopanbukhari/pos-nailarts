import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { ENV } from '../config/env';
import { AuthenticatedRequest } from '../middlewares/auth';
import { RoleType } from '../models/types';

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
        include: { role: true, employee: true },
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

      // Role name representation for frontend compatibility
      const roleName = user.role.name;
      const normalizedRole: RoleType = (roleName === 'OWNER_ADMIN' ? 'ADMIN' : roleName) as RoleType;

      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: normalizedRole,
          employeeId: user.employee?.id,
        },
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
            role: normalizedRole,
            roleDisplayName: user.role.displayName,
            phone: user.phone,
            employeeId: user.employee?.id,
            commissionRate: user.employee?.commissionRate || 0,
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
      const { name, email, password, role = 'ARTIST', phone, commissionRate = 0.20, position } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
        return;
      }

      // Map role name
      const targetRoleName = role === 'ADMIN' ? 'OWNER_ADMIN' : role;
      let roleRecord = await prisma.role.findUnique({ where: { name: targetRoleName } });
      if (!roleRecord) {
        roleRecord = await prisma.role.findFirst();
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          roleId: roleRecord!.id,
          phone,
        },
        include: { role: true },
      });

      // If user is ARTIST, create an Employee record
      if (role === 'ARTIST') {
        const empCount = await prisma.employee.count();
        await prisma.employee.create({
          data: {
            userId: user.id,
            employeeNumber: `EMP-NA-${String(empCount + 1).padStart(3, '0')}`,
            position: position || 'Nail Artist Specialist',
            commissionRate: Number(commissionRate) || 0.20,
          },
        });
      }

      res.status(201).json({
        success: true,
        message: 'Pengguna berhasil didaftarkan.',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
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
        include: { role: true, employee: { include: { schedules: true } } },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name === 'OWNER_ADMIN' ? 'ADMIN' : user.role.name,
          roleDisplayName: user.role.displayName,
          phone: user.phone,
          employee: user.employee,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
