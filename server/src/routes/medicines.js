import express from 'express';
import { randomUUID } from 'node:crypto';
import db from '../config/db.js';

const router = express.Router();

// Helper to check expiry status
const isExpired = (expiryDate) => {
  return new Date(expiryDate).getTime() < new Date().setHours(0, 0, 0, 0);
};

const isExpiringSoon = (expiryDate, days = 30) => {
  const expiry = new Date(expiryDate).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  const future = now + days * 24 * 60 * 60 * 1000;
  return expiry >= now && expiry <= future;
};

// GET all medicines with filters
router.get('/', (req, res) => {
  try {
    let medicines = db.getMedicines();
    const { search, category, status, prescription } = req.query;

    if (search) {
      const q = search.toLowerCase().trim();
      medicines = medicines.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.brandName.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.batchNumber.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'All') {
      medicines = medicines.filter(m => m.category === category);
    }

    if (prescription !== undefined && prescription !== '') {
      const isRx = prescription === 'true';
      medicines = medicines.filter(m => Boolean(m.prescriptionRequired) === isRx);
    }

    if (status && status !== 'all') {
      medicines = medicines.filter(m => {
        const expired = isExpired(m.expiryDate);
        const expiring = isExpiringSoon(m.expiryDate, 30);
        const outOfStock = m.currentStock <= 0;
        const lowStock = m.currentStock > 0 && m.currentStock <= m.minReorderLevel;

        if (status === 'out') return outOfStock;
        if (status === 'low') return lowStock;
        if (status === 'expired') return expired;
        if (status === 'expiring') return expiring;
        if (status === 'in-stock') return !outOfStock && !lowStock && !expired;
        return true;
      });
    }

    // Enhance each record with flags for convenience
    const enriched = medicines.map(m => ({
      ...m,
      isExpired: isExpired(m.expiryDate),
      isExpiringSoon: isExpiringSoon(m.expiryDate, 30),
      isLowStock: m.currentStock > 0 && m.currentStock <= m.minReorderLevel,
      isOutOfStock: m.currentStock <= 0,
      stockValueCost: Number((m.currentStock * m.costPrice).toFixed(2)),
      stockValueRetail: Number((m.currentStock * m.sellingPrice).toFixed(2))
    }));

    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single medicine
router.get('/:id', (req, res) => {
  try {
    const medicine = db.getMedicineById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const movements = db
      .getMovements()
      .filter(m => m.medicineId === medicine.id)
      .slice(0, 15);

    res.json({
      success: true,
      data: {
        ...medicine,
        isExpired: isExpired(medicine.expiryDate),
        isExpiringSoon: isExpiringSoon(medicine.expiryDate, 30),
        isLowStock: medicine.currentStock > 0 && medicine.currentStock <= medicine.minReorderLevel,
        isOutOfStock: medicine.currentStock <= 0,
        movements
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create new medicine
router.post('/', (req, res) => {
  try {
    const {
      name,
      brandName,
      genericName,
      sku,
      category,
      dosageForm,
      strength,
      batchNumber,
      manufacturer,
      supplierId,
      supplierName,
      expiryDate,
      costPrice,
      sellingPrice,
      currentStock,
      minReorderLevel,
      location,
      prescriptionRequired,
      description
    } = req.body;

    if (!name || !batchNumber || !expiryDate || costPrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, batch number, expiry date, cost price, and selling price are required.'
      });
    }

    const id = `med-${randomUUID().substring(0, 8)}`;
    const parsedStock = parseInt(currentStock || 0, 10);
    const parsedMinStock = parseInt(minReorderLevel || 10, 10);
    const parsedCost = parseFloat(costPrice || 0);
    const parsedSelling = parseFloat(sellingPrice || 0);

    const newMedicine = {
      id,
      name: name.trim(),
      brandName: brandName ? brandName.trim() : name.trim(),
      genericName: genericName ? genericName.trim() : '',
      sku: sku ? sku.trim().toUpperCase() : `MED-${batchNumber.toUpperCase()}`,
      category: category || 'General',
      dosageForm: dosageForm || 'Tablet',
      strength: strength || 'N/A',
      batchNumber: batchNumber.trim().toUpperCase(),
      manufacturer: manufacturer || 'Standard Pharma',
      supplierId: supplierId || 'sup-001',
      supplierName: supplierName || 'General Supplier',
      expiryDate,
      costPrice: parsedCost,
      sellingPrice: parsedSelling,
      currentStock: parsedStock,
      minReorderLevel: parsedMinStock,
      location: location || 'General Shelf',
      prescriptionRequired: Boolean(prescriptionRequired),
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.addMedicine(newMedicine);

    // If initial stock is positive, log a STOCK_IN movement
    if (parsedStock > 0) {
      db.addMovement({
        id: `mov-${randomUUID().substring(0, 8)}`,
        date: new Date().toISOString(),
        medicineId: newMedicine.id,
        medicineName: newMedicine.brandName || newMedicine.name,
        sku: newMedicine.sku,
        batchNumber: newMedicine.batchNumber,
        type: 'STOCK_IN',
        quantity: parsedStock,
        balanceBefore: 0,
        balanceAfter: parsedStock,
        referenceType: 'INITIAL_STOCK',
        referenceId: `INIT-${newMedicine.id}`,
        reason: 'Initial Inventory Entry',
        performedBy: req.body.performedBy || 'System Pharmacist',
        notes: 'Initial stock intake upon catalog registration.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Medicine added to inventory successfully',
      data: newMedicine
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update medicine
router.put('/:id', (req, res) => {
  try {
    const existing = db.getMedicineById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const updates = { ...req.body };
    if (updates.costPrice !== undefined) updates.costPrice = parseFloat(updates.costPrice);
    if (updates.sellingPrice !== undefined) updates.sellingPrice = parseFloat(updates.sellingPrice);
    if (updates.minReorderLevel !== undefined) updates.minReorderLevel = parseInt(updates.minReorderLevel, 10);
    // Note: direct stock changes should normally go through /adjust-stock for audit trails,
    // but if currentStock is passed, keep it safe
    if (updates.currentStock !== undefined) updates.currentStock = parseInt(updates.currentStock, 10);

    const updated = db.updateMedicine(req.params.id, updates);

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE medicine
router.delete('/:id', (req, res) => {
  try {
    const medicine = db.getMedicineById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    db.deleteMedicine(req.params.id);

    // Log movement for deletion/removal
    db.addMovement({
      id: `mov-${randomUUID().substring(0, 8)}`,
      date: new Date().toISOString(),
      medicineId: medicine.id,
      medicineName: medicine.brandName || medicine.name,
      sku: medicine.sku,
      batchNumber: medicine.batchNumber,
      type: 'DISPOSAL',
      quantity: -medicine.currentStock,
      balanceBefore: medicine.currentStock,
      balanceAfter: 0,
      referenceType: 'DELETION',
      referenceId: `DEL-${medicine.id}`,
      reason: 'Product De-listed from Pharmacy Catalog',
      performedBy: 'Pharmacist Admin',
      notes: `Catalog item removed. Stock of ${medicine.currentStock} decommissioned.`
    });

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST adjust stock (Reconciliation, Damage write-off, Expiry disposal, Physical count adjustment)
router.post('/:id/adjust-stock', (req, res) => {
  try {
    const medicine = db.getMedicineById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const { type, quantity, reason, notes, performedBy } = req.body;
    // type: 'SET' | 'ADD' | 'DEDUCT'
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ success: false, message: 'Valid positive quantity is required' });
    }

    const balanceBefore = medicine.currentStock;
    let balanceAfter = balanceBefore;
    let delta = 0;
    let movementType = 'ADJUSTMENT';

    if (type === 'SET') {
      balanceAfter = qty;
      delta = balanceAfter - balanceBefore;
      if (reason && reason.toLowerCase().includes('expired')) {
        movementType = 'DISPOSAL';
      }
    } else if (type === 'ADD') {
      delta = qty;
      balanceAfter = balanceBefore + qty;
      movementType = 'STOCK_IN';
    } else if (type === 'DEDUCT') {
      if (qty > balanceBefore) {
        return res.status(400).json({
          success: false,
          message: `Cannot deduct ${qty} units. Current stock is only ${balanceBefore}.`
        });
      }
      delta = -qty;
      balanceAfter = balanceBefore - qty;
      movementType = reason && (reason.toLowerCase().includes('expired') || reason.toLowerCase().includes('damage'))
        ? 'DISPOSAL'
        : 'STOCK_OUT';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid adjustment type. Must be SET, ADD, or DEDUCT.' });
    }

    // Update medicine stock
    const updatedMed = db.updateMedicine(medicine.id, { currentStock: balanceAfter });

    // Record stock movement audit entry
    const movement = db.addMovement({
      id: `mov-${randomUUID().substring(0, 8)}`,
      date: new Date().toISOString(),
      medicineId: medicine.id,
      medicineName: medicine.brandName || medicine.name,
      sku: medicine.sku,
      batchNumber: medicine.batchNumber,
      type: movementType,
      quantity: delta,
      balanceBefore,
      balanceAfter,
      referenceType: 'ADJUSTMENT',
      referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
      reason: reason || 'Inventory Audit Reconciliation',
      performedBy: performedBy || 'Chief Pharmacist',
      notes: notes || 'Stock manual adjustment recorded.'
    });

    res.json({
      success: true,
      message: `Stock adjusted successfully. New balance: ${balanceAfter}`,
      data: {
        medicine: updatedMed,
        movement
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
