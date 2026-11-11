import express from 'express';
import { randomUUID } from 'node:crypto';
import db from '../config/db.js';

const router = express.Router();

// Helper to check expiry
const isMedicineExpired = (expiryDate) => {
  return new Date(expiryDate).getTime() < new Date().setHours(0, 0, 0, 0);
};

// GET sales list
router.get('/', (req, res) => {
  try {
    let sales = db.getSales();
    const { search, paymentMethod, startDate, endDate } = req.query;

    if (search) {
      const q = search.toLowerCase().trim();
      sales = sales.filter(
        s =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q) ||
          (s.customerPhone && s.customerPhone.includes(q)) ||
          (s.doctorName && s.doctorName.toLowerCase().includes(q))
      );
    }

    if (paymentMethod && paymentMethod !== 'All') {
      sales = sales.filter(s => s.paymentMethod === paymentMethod);
    }

    if (startDate) {
      sales = sales.filter(s => new Date(s.date) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      sales = sales.filter(s => new Date(s.date) <= end);
    }

    res.json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single sale
router.get('/:id', (req, res) => {
  try {
    const sale = db.getSaleById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create sale (Point of Sale checkout)
router.post('/', (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      doctorName,
      items,
      discountPercent,
      taxPercent,
      paymentMethod,
      notes,
      pharmacistName
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sale must contain at least one medicine item.'
      });
    }

    // Pre-flight check: Verify stock availability and expiry for all items
    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const medicine = db.getMedicineById(item.medicineId);
      if (!medicine) {
        return res.status(400).json({
          success: false,
          message: `Medicine ID "${item.medicineId}" does not exist in inventory.`
        });
      }

      // Check Expiry (Safety protection!)
      if (isMedicineExpired(medicine.expiryDate)) {
        return res.status(400).json({
          success: false,
          message: `PATIENT SAFETY ALERT: Batch "${medicine.batchNumber}" of "${medicine.brandName || medicine.name}" expired on ${medicine.expiryDate}. Dispensing expired medication is blocked! Please remove or write off this batch.`
        });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${medicine.brandName || medicine.name}. Must be at least 1.`
        });
      }

      // Check stock availability
      if (qty > medicine.currentStock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${medicine.brandName || medicine.name}". Requested: ${qty}, Available: ${medicine.currentStock}.`
        });
      }

      const unitPrice = parseFloat(item.unitPrice || medicine.sellingPrice);
      const lineTotal = Number((qty * unitPrice).toFixed(2));
      subtotal += lineTotal;

      validatedItems.push({
        medicine,
        quantity: qty,
        unitPrice,
        total: lineTotal
      });
    }

    // Calculations
    const discPct = Math.max(0, Math.min(100, parseFloat(discountPercent || 0)));
    const discountAmount = Number(((subtotal * discPct) / 100).toFixed(2));
    const taxableAmount = subtotal - discountAmount;

    const txPct = Math.max(0, parseFloat(taxPercent !== undefined ? taxPercent : 5));
    const taxAmount = Number(((taxableAmount * txPct) / 100).toFixed(2));

    const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

    // Generate Invoice Number
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${todayStr}-${randSuffix}`;
    const saleId = `sale-${randomUUID().substring(0, 8)}`;
    const saleDate = new Date().toISOString();

    // Deduct stock and log movements
    const invoiceItems = [];
    for (const line of validatedItems) {
      const { medicine, quantity, unitPrice, total } = line;
      const balanceBefore = medicine.currentStock;
      const balanceAfter = balanceBefore - quantity;

      // Update medicine stock
      db.updateMedicine(medicine.id, { currentStock: balanceAfter });

      // Record Stock Movement
      db.addMovement({
        id: `mov-${randomUUID().substring(0, 8)}`,
        date: saleDate,
        medicineId: medicine.id,
        medicineName: medicine.brandName || medicine.name,
        sku: medicine.sku,
        batchNumber: medicine.batchNumber,
        type: 'STOCK_OUT',
        quantity: -quantity,
        balanceBefore,
        balanceAfter,
        referenceType: 'SALE',
        referenceId: invoiceNumber,
        reason: 'Customer Sale & Dispensing',
        performedBy: pharmacistName || 'Dispensing Pharmacist',
        notes: `Sold to ${customerName || 'Walk-in Customer'} (Inv #${invoiceNumber})`
      });

      invoiceItems.push({
        medicineId: medicine.id,
        medicineName: medicine.brandName || medicine.name,
        genericName: medicine.genericName,
        sku: medicine.sku,
        batchNumber: medicine.batchNumber,
        expiryDate: medicine.expiryDate,
        quantity,
        unitPrice,
        total
      });
    }

    const newSale = {
      id: saleId,
      invoiceNumber,
      date: saleDate,
      customerName: customerName ? customerName.trim() : 'Walk-in Customer',
      customerPhone: customerPhone ? customerPhone.trim() : '',
      doctorName: doctorName ? doctorName.trim() : '',
      items: invoiceItems,
      subtotal: Number(subtotal.toFixed(2)),
      discountPercent: discPct,
      discountAmount,
      taxPercent: txPct,
      taxAmount,
      totalAmount,
      paymentMethod: paymentMethod || 'Cash',
      notes: notes || '',
      pharmacistName: pharmacistName || 'Dispensing Pharmacist'
    };

    db.addSale(newSale);

    res.status(201).json({
      success: true,
      message: 'Sale processed and stock updated successfully',
      data: newSale
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
