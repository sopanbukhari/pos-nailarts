import { Request, Response } from 'express';
import prisma from '../config/db';

export class InventoryController {
  static async getItems(req: Request, res: Response): Promise<void> {
    try {
      const { category, lowStock } = req.query;
      const whereClause: any = {};

      if (category) whereClause.category = String(category);
      if (lowStock === 'true') {
        whereClause.stockQuantity = { lte: 5 };
      }

      const items = await prisma.inventoryItem.findMany({
        where: whereClause,
        orderBy: [{ stockQuantity: 'asc' }, { name: 'asc' }],
      });

      res.json({ success: true, data: items });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createItem(req: Request, res: Response): Promise<void> {
    try {
      const { sku, name, category, stockQuantity, unit, minStockAlert = 5, costPrice = 0, supplier } = req.body;

      const item = await prisma.inventoryItem.create({
        data: {
          sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
          name,
          category,
          stockQuantity: Number(stockQuantity),
          unit: unit || 'pcs',
          minStockAlert: Number(minStockAlert),
          costPrice: Number(costPrice),
          supplier,
        },
      });

      res.status(201).json({ success: true, message: 'Barang inventaris ditambahkan.', data: item });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateStock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantityChange, newStockQuantity } = req.body;

      let updated;
      if (newStockQuantity !== undefined) {
        updated = await prisma.inventoryItem.update({
          where: { id },
          data: { stockQuantity: Number(newStockQuantity) },
        });
      } else if (quantityChange !== undefined) {
        updated = await prisma.inventoryItem.update({
          where: { id },
          data: { stockQuantity: { increment: Number(quantityChange) } },
        });
      } else {
        res.status(400).json({ success: false, message: 'Jumlah stok tidak ditentukan.' });
        return;
      }

      res.json({ success: true, message: 'Stok inventaris diperbarui.', data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
