import { Request, Response } from 'express';
import prisma from '../config/db';

export class CatalogController {
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await prisma.category.findMany({
        include: {
          services: {
            where: { isActive: true },
            include: { addons: true },
          },
        },
      });
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getServices(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId, search } = req.query;
      const whereClause: any = { isActive: true };

      if (categoryId) whereClause.categoryId = String(categoryId);
      if (search) {
        whereClause.name = { contains: String(search) };
      }

      const services = await prisma.service.findMany({
        where: whereClause,
        include: {
          category: true,
          addons: true,
        },
        orderBy: { name: 'asc' },
      });

      res.json({ success: true, data: services });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createService(req: Request, res: Response): Promise<void> {
    try {
      const { name, categoryId, basePrice, durationMinutes = 45, description, image, addons = [] } = req.body;

      const service = await prisma.service.create({
        data: {
          name,
          categoryId,
          basePrice: Number(basePrice),
          durationMinutes: Number(durationMinutes),
          description,
          image,
          addons: {
            create: addons.map((a: any) => ({
              name: a.name,
              price: Number(a.price),
              extraMinutes: Number(a.extraMinutes || 15),
            })),
          },
        },
        include: { addons: true, category: true },
      });

      res.status(201).json({
        success: true,
        message: 'Layanan baru berhasil ditambahkan.',
        data: service,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, categoryId, basePrice, durationMinutes, description, image, isActive } = req.body;

      const updated = await prisma.service.update({
        where: { id },
        data: {
          name,
          categoryId,
          basePrice: basePrice !== undefined ? Number(basePrice) : undefined,
          durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : undefined,
          description,
          image,
          isActive,
        },
        include: { addons: true, category: true },
      });

      res.json({ success: true, message: 'Layanan berhasil diperbarui.', data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
