import express from 'express';
import { randomUUID } from 'node:crypto';
import db from '../config/db.js';

const router = express.Router();

// GET all suppliers
router.get('/', (req, res) => {
  try {
    const suppliers = db.getSuppliers();
    const medicines = db.getMedicines();

    const enriched = suppliers.map(s => {
      const suppliedMeds = medicines.filter(m => m.supplierId === s.id);
      return {
        ...s,
        medicinesCount: suppliedMeds.length,
        totalStockSupplied: suppliedMeds.reduce((acc, m) => acc + m.currentStock, 0)
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single supplier
router.get('/:id', (req, res) => {
  try {
    const supplier = db.getSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const medicines = db.getMedicines().filter(m => m.supplierId === supplier.id);
    const purchases = db.getPurchases().filter(p => p.supplierId === supplier.id);

    res.json({
      success: true,
      data: {
        ...supplier,
        medicines,
        purchases
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add new supplier
router.post('/', (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, gstin, paymentTerms } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name and contact phone number are required.'
      });
    }

    const newSupplier = {
      id: `sup-${randomUUID().substring(0, 8)}`,
      name: name.trim(),
      contactPerson: contactPerson ? contactPerson.trim() : '',
      phone: phone.trim(),
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      gstin: gstin ? gstin.trim().toUpperCase() : '',
      paymentTerms: paymentTerms || 'Net 30 Days',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.addSupplier(newSupplier);

    res.status(201).json({
      success: true,
      message: 'Supplier registered successfully',
      data: newSupplier
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update supplier
router.put('/:id', (req, res) => {
  try {
    const existing = db.getSupplierById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const updated = db.updateSupplier(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE supplier
router.delete('/:id', (req, res) => {
  try {
    const existing = db.getSupplierById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    db.deleteSupplier(req.params.id);
    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
