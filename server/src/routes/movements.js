import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// GET all stock movements
router.get('/', (req, res) => {
  try {
    let movements = db.getMovements();
    const { type, medicineId, search, startDate, endDate, limit } = req.query;

    if (type && type !== 'All') {
      movements = movements.filter(m => m.type === type);
    }

    if (medicineId) {
      movements = movements.filter(m => m.medicineId === medicineId);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      movements = movements.filter(
        m =>
          m.medicineName.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.batchNumber.toLowerCase().includes(q) ||
          m.referenceId.toLowerCase().includes(q) ||
          (m.reason && m.reason.toLowerCase().includes(q))
      );
    }

    if (startDate) {
      movements = movements.filter(m => new Date(m.date) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      movements = movements.filter(m => new Date(m.date) <= end);
    }

    const totalCount = movements.length;

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        movements = movements.slice(0, parsedLimit);
      }
    }

    res.json({
      success: true,
      totalCount,
      count: movements.length,
      data: movements
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET movement stats
router.get('/stats', (req, res) => {
  try {
    const movements = db.getMovements();

    let stockInCount = 0;
    let stockInUnits = 0;
    let stockOutCount = 0;
    let stockOutUnits = 0;
    let adjustmentCount = 0;
    let disposalCount = 0;

    for (const m of movements) {
      if (m.type === 'STOCK_IN') {
        stockInCount++;
        stockInUnits += Math.abs(m.quantity);
      } else if (m.type === 'STOCK_OUT') {
        stockOutCount++;
        stockOutUnits += Math.abs(m.quantity);
      } else if (m.type === 'ADJUSTMENT') {
        adjustmentCount++;
      } else if (m.type === 'DISPOSAL') {
        disposalCount++;
      }
    }

    res.json({
      success: true,
      data: {
        totalMovements: movements.length,
        stockInCount,
        stockInUnits,
        stockOutCount,
        stockOutUnits,
        adjustmentCount,
        disposalCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
