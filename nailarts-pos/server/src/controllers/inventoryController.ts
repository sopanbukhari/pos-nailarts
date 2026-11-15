import { Request, Response } from 'express';
import prisma from '../config/db';

export class InventoryController {
  static async getItems(req: Request, res: Response): Promise<void> {
    try {
      const { category, lowStock, search } = req.query;
      const whereClause: any = { isActive: true };

      if (category) whereClause.category = String(category);
      if (search) {
        whereClause.OR = [
          { name: { contains: String(search), mode: 'insensitive' } },
          { sku: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      let products = await prisma.product.findMany({
        where: whereClause,
        include: {
          movements: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: [{ stockQuantity: 'asc' }, { name: 'asc' }],
      });

      if (lowStock === 'true') {
        products = products.filter((p) => p.stockQuantity <= p.minStockAlert);
      }

      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createItem(req: Request, res: Response): Promise<void> {
    try {
      const {
        sku,
        name,
        category,
        description,
        retailPrice = 0,
        costPrice = 0,
        stockQuantity = 0,
        minStockAlert = 5,
        unit = 'pcs',
      } = req.body;

      const generatedSku = sku || `SKU-${Date.now().toString().slice(-6)}`;

      const product = await prisma.$transaction(async (tx) => {
        const prod = await tx.product.create({
          data: {
            sku: generatedSku,
            name: String(name),
            category: category ? String(category) : 'Supplies',
            description: description ? String(description) : null,
            retailPrice: Number(retailPrice),
            costPrice: Number(costPrice),
            stockQuantity: Number(stockQuantity),
            minStockAlert: Number(minStockAlert),
            unit: unit ? String(unit) : 'pcs',
          },
        });

        if (Number(stockQuantity) > 0) {
          await tx.inventoryMovement.create({
            data: {
              productId: prod.id,
              movementType: 'STOCK_IN',
              quantity: Number(stockQuantity),
              beforeQuantity: 0,
              afterQuantity: Number(stockQuantity),
              referenceNumber: 'INITIAL-STOCK',
              notes: 'Stok awal barang baru',
            },
          });
        }

        return prod;
      });

      res.status(201).json({ success: true, message: 'Barang produk/inventaris berhasil ditambahkan.', data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateStock(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const {
        quantityChange,
        newStockQuantity,
        movementType = 'STOCK_IN',
        notes = 'Restock barang',
        referenceNumber,
      } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        const current = await tx.product.findUnique({ where: { id } });
        if (!current) throw new Error('Produk/barang tidak ditemukan.');

        let newQty = current.stockQuantity;
        let diff = 0;

        if (newStockQuantity !== undefined) {
          diff = Number(newStockQuantity) - current.stockQuantity;
          newQty = Number(newStockQuantity);
        } else if (quantityChange !== undefined) {
          diff = Number(quantityChange);
          newQty = current.stockQuantity + diff;
        } else {
          throw new Error('Jumlah perubahan stok wajib ditentukan.');
        }

        if (newQty < 0) {
          throw new Error(`Stok tidak boleh negatif (Stok saat ini: ${current.stockQuantity}).`);
        }

        const updated = await tx.product.update({
          where: { id },
          data: { stockQuantity: newQty },
        });

        // Catat riwayat pergerakan inventaris (Inventory Movement)
        await tx.inventoryMovement.create({
          data: {
            productId: id,
            movementType: (movementType as any) || (diff >= 0 ? 'STOCK_IN' : 'STOCK_OUT'),
            quantity: diff,
            beforeQuantity: current.stockQuantity,
            afterQuantity: newQty,
            referenceNumber: referenceNumber ? String(referenceNumber) : `MOV-${Date.now().toString().slice(-6)}`,
            notes: String(notes),
          },
        });

        return updated;
      });

      res.json({ success: true, message: 'Stok inventaris dan riwayat mutasi berhasil diperbarui.', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMovements(req: Request, res: Response): Promise<void> {
    try {
      const { productId, limit = 50 } = req.query;
      const whereClause: any = {};
      if (productId) whereClause.productId = String(productId);

      const movements = await prisma.inventoryMovement.findMany({
        where: whereClause,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
        },
      });

      res.json({ success: true, data: movements });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
