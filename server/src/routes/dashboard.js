import express from 'express';
import db from '../config/db.js';

const router = express.Router();

const isExpired = (expiryDate) => {
  return new Date(expiryDate).getTime() < new Date().setHours(0, 0, 0, 0);
};

const isExpiringWithinDays = (expiryDate, days) => {
  const expiry = new Date(expiryDate).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  const future = now + days * 24 * 60 * 60 * 1000;
  return expiry >= now && expiry <= future;
};

// GET dashboard statistics & analytics
router.get('/stats', (req, res) => {
  try {
    const medicines = db.getMedicines();
    const sales = db.getSales();
    const purchases = db.getPurchases();
    const movements = db.getMovements();

    const totalMedicines = medicines.length;
    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiredCount = 0;
    let expiring30DaysCount = 0;
    let expiring90DaysCount = 0;

    for (const m of medicines) {
      totalStockUnits += m.currentStock;
      totalCostValuation += m.currentStock * m.costPrice;
      totalRetailValuation += m.currentStock * m.sellingPrice;

      if (m.currentStock <= 0) {
        outOfStockCount++;
      } else if (m.currentStock <= m.minReorderLevel) {
        lowStockCount++;
      }

      if (isExpired(m.expiryDate)) {
        expiredCount++;
      } else if (isExpiringWithinDays(m.expiryDate, 30)) {
        expiring30DaysCount++;
      } else if (isExpiringWithinDays(m.expiryDate, 90)) {
        expiring90DaysCount++;
      }
    }

    // Sales metrics
    const today = new Date().toISOString().slice(0, 10);
    let todaySalesRevenue = 0;
    let todaySalesCount = 0;
    let allTimeSalesRevenue = 0;

    for (const s of sales) {
      allTimeSalesRevenue += s.totalAmount;
      if (s.date && s.date.slice(0, 10) === today) {
        todaySalesRevenue += s.totalAmount;
        todaySalesCount++;
      }
    }

    // Total purchase cost
    const totalPurchasesCost = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);

    res.json({
      success: true,
      data: {
        totalMedicines,
        totalStockUnits,
        totalCostValuation: Number(totalCostValuation.toFixed(2)),
        totalRetailValuation: Number(totalRetailValuation.toFixed(2)),
        potentialGrossProfit: Number((totalRetailValuation - totalCostValuation).toFixed(2)),
        lowStockCount,
        outOfStockCount,
        expiredCount,
        expiring30DaysCount,
        expiring90DaysCount,
        todaySalesRevenue: Number(todaySalesRevenue.toFixed(2)),
        todaySalesCount,
        allTimeSalesRevenue: Number(allTimeSalesRevenue.toFixed(2)),
        totalPurchasesCost: Number(totalPurchasesCost.toFixed(2)),
        totalMovementsCount: movements.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET sales trend for charts
router.get('/sales-trend', (req, res) => {
  try {
    const sales = db.getSales();
    const daysMap = {};

    // Prepare last 7 days keys
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daysMap[dateKey] = { date: dateKey, label, revenue: 0, orders: 0 };
    }

    for (const s of sales) {
      const dateKey = s.date ? s.date.slice(0, 10) : '';
      if (daysMap[dateKey]) {
        daysMap[dateKey].revenue += s.totalAmount;
        daysMap[dateKey].orders += 1;
      }
    }

    const trend = Object.values(daysMap).map(day => ({
      ...day,
      revenue: Number(day.revenue.toFixed(2))
    }));

    res.json({ success: true, data: trend });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET category distribution
router.get('/category-stats', (req, res) => {
  try {
    const medicines = db.getMedicines();
    const catMap = {};

    for (const m of medicines) {
      const cat = m.category || 'General';
      if (!catMap[cat]) {
        catMap[cat] = {
          category: cat,
          medicinesCount: 0,
          totalStock: 0,
          stockValueCost: 0
        };
      }
      catMap[cat].medicinesCount++;
      catMap[cat].totalStock += m.currentStock;
      catMap[cat].stockValueCost += m.currentStock * m.costPrice;
    }

    const data = Object.values(catMap).map(c => ({
      ...c,
      stockValueCost: Number(c.stockValueCost.toFixed(2))
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET top selling medicines
router.get('/top-selling', (req, res) => {
  try {
    const sales = db.getSales();
    const medicineSalesMap = {};

    for (const s of sales) {
      if (s.items && Array.isArray(s.items)) {
        for (const item of s.items) {
          const medId = item.medicineId;
          if (!medicineSalesMap[medId]) {
            medicineSalesMap[medId] = {
              medicineId: medId,
              name: item.medicineName,
              totalQuantitySold: 0,
              totalRevenue: 0
            };
          }
          medicineSalesMap[medId].totalQuantitySold += item.quantity;
          medicineSalesMap[medId].totalRevenue += item.total || item.quantity * item.unitPrice;
        }
      }
    }

    const sorted = Object.values(medicineSalesMap)
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, 5)
      .map(item => ({
        ...item,
        totalRevenue: Number(item.totalRevenue.toFixed(2))
      }));

    res.json({ success: true, data: sorted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET alert and stockout prevention center
router.get('/alerts', (req, res) => {
  try {
    const medicines = db.getMedicines();

    const outOfStock = [];
    const lowStock = [];
    const expired = [];
    const expiringSoon = [];
    const reorderRecommendations = [];

    for (const m of medicines) {
      const exp = isExpired(m.expiryDate);
      const expSoon = isExpiringWithinDays(m.expiryDate, 60);

      if (exp) {
        expired.push(m);
      } else if (expSoon) {
        expiringSoon.push(m);
      }

      if (m.currentStock <= 0) {
        outOfStock.push(m);
      } else if (m.currentStock <= m.minReorderLevel) {
        lowStock.push(m);
      }

      // Reorder recommendation algorithm:
      // If stock <= minReorderLevel, suggest ordering target stock = (minReorderLevel * 2.5)
      if (m.currentStock <= m.minReorderLevel) {
        const targetStock = Math.ceil(m.minReorderLevel * 2.5);
        const suggestedOrderQty = Math.max(10, targetStock - m.currentStock);
        const estimatedCost = Number((suggestedOrderQty * m.costPrice).toFixed(2));

        reorderRecommendations.push({
          medicineId: m.id,
          name: m.brandName || m.name,
          sku: m.sku,
          batchNumber: m.batchNumber,
          category: m.category,
          currentStock: m.currentStock,
          minReorderLevel: m.minReorderLevel,
          suggestedOrderQty,
          unitCost: m.costPrice,
          estimatedCost,
          supplierId: m.supplierId,
          supplierName: m.supplierName,
          urgency: m.currentStock <= 0 ? 'CRITICAL' : 'HIGH'
        });
      }
    }

    res.json({
      success: true,
      data: {
        outOfStock,
        lowStock,
        expired,
        expiringSoon,
        reorderRecommendations
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
