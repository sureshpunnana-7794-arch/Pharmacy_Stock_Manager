import express from 'express';
import { randomUUID } from 'node:crypto';
import db from '../config/db.js';

const router = express.Router();

// GET purchases list
router.get('/', (req, res) => {
  try {
    let purchases = db.getPurchases();
    const { supplierId, search, startDate, endDate } = req.query;

    if (supplierId && supplierId !== 'All') {
      purchases = purchases.filter(p => p.supplierId === supplierId);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      purchases = purchases.filter(
        p =>
          p.poNumber.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          (p.invoiceReference && p.invoiceReference.toLowerCase().includes(q))
      );
    }

    if (startDate) {
      purchases = purchases.filter(p => new Date(p.date) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      purchases = purchases.filter(p => new Date(p.date) <= end);
    }

    res.json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single purchase order
router.get('/:id', (req, res) => {
  try {
    const purchase = db.getPurchaseById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }
    res.json({ success: true, data: purchase });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST record new purchase (Stock Inward Entry)
router.post('/', (req, res) => {
  try {
    const {
      supplierId,
      supplierName,
      invoiceReference,
      items,
      notes,
      receivedBy
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Purchase must contain at least one medicine item.'
      });
    }

    const supplier = supplierId ? db.getSupplierById(supplierId) : null;
    const resolvedSupplierName = supplierName || (supplier ? supplier.name : 'Direct Pharma Distributor');

    const poDate = new Date().toISOString();
    const todayStr = poDate.slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const poNumber = `PO-${todayStr}-${randSuffix}`;
    const poId = `po-${randomUUID().substring(0, 8)}`;

    let totalCost = 0;
    const processedItems = [];

    for (const item of items) {
      let medicine = item.medicineId ? db.getMedicineById(item.medicineId) : null;
      const qty = parseInt(item.quantity, 10);
      const costPrice = parseFloat(item.costPrice || 0);
      const sellingPrice = parseFloat(item.sellingPrice || costPrice * 1.3);
      const lineTotal = Number((qty * costPrice).toFixed(2));
      totalCost += lineTotal;

      if (medicine) {
        // Existing medicine restock
        const balanceBefore = medicine.currentStock;
        const balanceAfter = balanceBefore + qty;

        const updates = {
          currentStock: balanceAfter,
          costPrice,
          sellingPrice
        };
        if (item.batchNumber) updates.batchNumber = item.batchNumber.trim().toUpperCase();
        if (item.expiryDate) updates.expiryDate = item.expiryDate;
        if (item.location) updates.location = item.location;

        db.updateMedicine(medicine.id, updates);

        db.addMovement({
          id: `mov-${randomUUID().substring(0, 8)}`,
          date: poDate,
          medicineId: medicine.id,
          medicineName: medicine.brandName || medicine.name,
          sku: medicine.sku,
          batchNumber: updates.batchNumber || medicine.batchNumber,
          type: 'STOCK_IN',
          quantity: qty,
          balanceBefore,
          balanceAfter,
          referenceType: 'PURCHASE',
          referenceId: poNumber,
          reason: 'Supplier Goods Receipt (Inward)',
          performedBy: receivedBy || 'Inventory Manager',
          notes: `Supplier: ${resolvedSupplierName} | Ref: ${invoiceReference || 'N/A'}`
        });

        processedItems.push({
          medicineId: medicine.id,
          medicineName: medicine.brandName || medicine.name,
          batchNumber: updates.batchNumber || medicine.batchNumber,
          expiryDate: updates.expiryDate || medicine.expiryDate,
          quantity: qty,
          costPrice,
          sellingPrice,
          total: lineTotal
        });
      } else {
        // Brand new medicine added directly through purchase order
        const newMedId = `med-${randomUUID().substring(0, 8)}`;
        const newMed = {
          id: newMedId,
          name: item.name || 'New Medicine',
          brandName: item.brandName || item.name || 'New Medicine',
          genericName: item.genericName || '',
          sku: item.sku || `MED-${Date.now().toString().slice(-6)}`,
          category: item.category || 'General',
          dosageForm: item.dosageForm || 'Tablet',
          strength: item.strength || 'N/A',
          batchNumber: (item.batchNumber || 'BATCH-01').toUpperCase(),
          manufacturer: item.manufacturer || 'General Pharma',
          supplierId: supplierId || 'sup-001',
          supplierName: resolvedSupplierName,
          expiryDate: item.expiryDate || '2028-01-01',
          costPrice,
          sellingPrice,
          currentStock: qty,
          minReorderLevel: item.minReorderLevel ? parseInt(item.minReorderLevel, 10) : 20,
          location: item.location || 'Rack General',
          prescriptionRequired: Boolean(item.prescriptionRequired),
          description: item.description || '',
          createdAt: poDate,
          updatedAt: poDate
        };

        db.addMedicine(newMed);

        db.addMovement({
          id: `mov-${randomUUID().substring(0, 8)}`,
          date: poDate,
          medicineId: newMed.id,
          medicineName: newMed.brandName || newMed.name,
          sku: newMed.sku,
          batchNumber: newMed.batchNumber,
          type: 'STOCK_IN',
          quantity: qty,
          balanceBefore: 0,
          balanceAfter: qty,
          referenceType: 'PURCHASE',
          referenceId: poNumber,
          reason: 'New Stock Inward Entry',
          performedBy: receivedBy || 'Inventory Manager',
          notes: `Supplier: ${resolvedSupplierName}`
        });

        processedItems.push({
          medicineId: newMed.id,
          medicineName: newMed.brandName || newMed.name,
          batchNumber: newMed.batchNumber,
          expiryDate: newMed.expiryDate,
          quantity: qty,
          costPrice,
          sellingPrice,
          total: lineTotal
        });
      }
    }

    const newPurchase = {
      id: poId,
      poNumber,
      date: poDate,
      supplierId: supplierId || 'sup-custom',
      supplierName: resolvedSupplierName,
      invoiceReference: invoiceReference ? invoiceReference.trim() : `INV-${poNumber}`,
      items: processedItems,
      totalCost: Number(totalCost.toFixed(2)),
      status: 'Received',
      notes: notes || '',
      receivedBy: receivedBy || 'Inventory Manager'
    };

    db.addPurchase(newPurchase);

    res.status(201).json({
      success: true,
      message: 'Stock inward order processed and inventory updated',
      data: newPurchase
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
