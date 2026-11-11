import {
  defaultMedicines,
  defaultSuppliers,
  defaultSales,
  defaultPurchases,
  defaultStockMovements
} from './seedData.js';

const STORAGE_KEYS = {
  MEDICINES: 'pharmastock_medicines_v1',
  SUPPLIERS: 'pharmastock_suppliers_v1',
  SALES: 'pharmastock_sales_v1',
  PURCHASES: 'pharmastock_purchases_v1',
  MOVEMENTS: 'pharmastock_movements_v1'
};

const getStored = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn(`[LocalStore] Failed to parse ${key}:`, err);
  }
  return fallback;
};

const setStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[LocalStore] Failed to save ${key}:`, err);
  }
};

const isExpired = (expiryDate) => {
  return new Date(expiryDate).getTime() < new Date().setHours(0, 0, 0, 0);
};

const isExpiringWithinDays = (expiryDate, days) => {
  const expiry = new Date(expiryDate).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  const future = now + days * 24 * 60 * 60 * 1000;
  return expiry >= now && expiry <= future;
};

export const localStore = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.MEDICINES)) {
      setStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
      setStored(STORAGE_KEYS.SUPPLIERS, defaultSuppliers);
      setStored(STORAGE_KEYS.SALES, defaultSales);
      setStored(STORAGE_KEYS.PURCHASES, defaultPurchases);
      setStored(STORAGE_KEYS.MOVEMENTS, defaultStockMovements);
    }
  },

  // Medicines
  getMedicines(params = {}) {
    this.init();
    let medicines = getStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
    const { search, category, status } = params;

    if (search) {
      const q = search.toLowerCase().trim();
      medicines = medicines.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.brandName.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.batchNumber.toLowerCase().includes(q) ||
          (m.location && m.location.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'All') {
      medicines = medicines.filter(m => m.category === category);
    }

    if (status && status !== 'all') {
      medicines = medicines.filter(m => {
        const expired = isExpired(m.expiryDate);
        const expiring = isExpiringWithinDays(m.expiryDate, 30);
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

    const enriched = medicines.map(m => ({
      ...m,
      isExpired: isExpired(m.expiryDate),
      isExpiringSoon: isExpiringWithinDays(m.expiryDate, 30),
      isLowStock: m.currentStock > 0 && m.currentStock <= m.minReorderLevel,
      isOutOfStock: m.currentStock <= 0,
      stockValueCost: Number((m.currentStock * m.costPrice).toFixed(2)),
      stockValueRetail: Number((m.currentStock * m.sellingPrice).toFixed(2))
    }));

    return { success: true, count: enriched.length, data: enriched };
  },

  getMedicineById(id) {
    this.init();
    const medicines = getStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) return { success: false, message: 'Medicine not found' };
    return {
      success: true,
      data: {
        ...medicine,
        isExpired: isExpired(medicine.expiryDate),
        isExpiringSoon: isExpiringWithinDays(medicine.expiryDate, 30),
        isLowStock: medicine.currentStock > 0 && medicine.currentStock <= medicine.minReorderLevel,
        isOutOfStock: medicine.currentStock <= 0
      }
    };
  },

  addMedicine(data) {
    this.init();
    const medicines = getStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
    const id = `med-${Date.now().toString().slice(-6)}`;
    const newMed = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    medicines.unshift(newMed);
    setStored(STORAGE_KEYS.MEDICINES, medicines);

    if (newMed.currentStock > 0) {
      this.addMovement({
        medicineId: newMed.id,
        medicineName: newMed.brandName || newMed.name,
        sku: newMed.sku,
        batchNumber: newMed.batchNumber,
        type: 'STOCK_IN',
        quantity: newMed.currentStock,
        balanceBefore: 0,
        balanceAfter: newMed.currentStock,
        referenceId: `INIT-${newMed.id}`,
        reason: 'Initial Catalog Entry',
        performedBy: 'Chief Pharmacist P. Suresh',
        notes: 'Initial stock intake upon product registration.'
      });
    }
    return { success: true, message: 'Medicine added successfully', data: newMed };
  },

  updateMedicine(id, updates) {
    this.init();
    const medicines = getStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
    const idx = medicines.findIndex(m => m.id === id);
    if (idx === -1) return { success: false, message: 'Medicine not found' };
    medicines[idx] = {
      ...medicines[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    setStored(STORAGE_KEYS.MEDICINES, medicines);
    return { success: true, message: 'Medicine updated successfully', data: medicines[idx] };
  },

  deleteMedicine(id) {
    this.init();
    let medicines = getStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
    medicines = medicines.filter(m => m.id !== id);
    setStored(STORAGE_KEYS.MEDICINES, medicines);
    return { success: true, message: 'Medicine deleted successfully' };
  },

  adjustStock(id, { type, quantity, reason, notes, performedBy }) {
    this.init();
    const medicines = getStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
    const med = medicines.find(m => m.id === id);
    if (!med) return { success: false, message: 'Medicine not found' };

    const balanceBefore = med.currentStock;
    let balanceAfter = balanceBefore;
    let delta = 0;
    let movementType = 'ADJUSTMENT';

    const qty = parseInt(quantity, 10) || 0;
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
        throw new Error(`Cannot deduct ${qty}. Only ${balanceBefore} units available.`);
      }
      delta = -qty;
      balanceAfter = balanceBefore - qty;
      movementType = reason && (reason.toLowerCase().includes('expired') || reason.toLowerCase().includes('damage'))
        ? 'DISPOSAL'
        : 'STOCK_OUT';
    }

    med.currentStock = balanceAfter;
    med.updatedAt = new Date().toISOString();
    setStored(STORAGE_KEYS.MEDICINES, medicines);

    const movement = this.addMovement({
      medicineId: med.id,
      medicineName: med.brandName || med.name,
      sku: med.sku,
      batchNumber: med.batchNumber,
      type: movementType,
      quantity: delta,
      balanceBefore,
      balanceAfter,
      referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
      reason: reason || 'Stock Count Adjustment',
      performedBy: performedBy || 'Chief Pharmacist',
      notes: notes || 'Stock manual adjustment recorded.'
    });

    return {
      success: true,
      message: `Stock adjusted successfully. New balance: ${balanceAfter}`,
      data: { medicine: med, movement }
    };
  },

  // Sales
  getSales() {
    this.init();
    const sales = getStored(STORAGE_KEYS.SALES, defaultSales);
    return { success: true, count: sales.length, data: sales };
  },

  createSale(payload) {
    this.init();
    const medicines = getStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
    const sales = getStored(STORAGE_KEYS.SALES, defaultSales);

    const validatedItems = [];
    let subtotal = 0;

    for (const item of payload.items) {
      const med = medicines.find(m => m.id === item.medicineId);
      if (!med) throw new Error(`Medicine ID "${item.medicineId}" not found`);

      if (isExpired(med.expiryDate)) {
        throw new Error(`PATIENT SAFETY ALERT: Batch "${med.batchNumber}" of "${med.brandName || med.name}" is expired! Dispensation blocked.`);
      }

      if (item.quantity > med.currentStock) {
        throw new Error(`Insufficient stock for "${med.brandName || med.name}". Available: ${med.currentStock}`);
      }

      const unitPrice = parseFloat(item.unitPrice || med.sellingPrice);
      const total = Number((item.quantity * unitPrice).toFixed(2));
      subtotal += total;

      validatedItems.push({ med, quantity: item.quantity, unitPrice, total });
    }

    const discPct = Math.max(0, Math.min(100, parseFloat(payload.discountPercent || 0)));
    const discountAmount = Number(((subtotal * discPct) / 100).toFixed(2));
    const taxable = subtotal - discountAmount;
    const txPct = Math.max(0, parseFloat(payload.taxPercent !== undefined ? payload.taxPercent : 5));
    const taxAmount = Number(((taxable * txPct) / 100).toFixed(2));
    const totalAmount = Number((taxable + taxAmount).toFixed(2));

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${todayStr}-${randSuffix}`;
    const saleDate = new Date().toISOString();

    const invoiceItems = [];
    for (const line of validatedItems) {
      const { med, quantity, unitPrice, total } = line;
      const balanceBefore = med.currentStock;
      const balanceAfter = balanceBefore - quantity;
      med.currentStock = balanceAfter;

      this.addMovement({
        medicineId: med.id,
        medicineName: med.brandName || med.name,
        sku: med.sku,
        batchNumber: med.batchNumber,
        type: 'STOCK_OUT',
        quantity: -quantity,
        balanceBefore,
        balanceAfter,
        referenceId: invoiceNumber,
        reason: 'Customer Sale & Dispensing',
        performedBy: payload.pharmacistName || 'Dispensing Pharmacist',
        notes: `Sold to ${payload.customerName || 'Walk-in'} (Inv #${invoiceNumber})`
      });

      invoiceItems.push({
        medicineId: med.id,
        medicineName: med.brandName || med.name,
        genericName: med.genericName,
        sku: med.sku,
        batchNumber: med.batchNumber,
        expiryDate: med.expiryDate,
        quantity,
        unitPrice,
        total
      });
    }

    setStored(STORAGE_KEYS.MEDICINES, medicines);

    const newSale = {
      id: `sale-${Date.now().toString().slice(-6)}`,
      invoiceNumber,
      date: saleDate,
      customerName: payload.customerName || 'Walk-in Patient',
      customerPhone: payload.customerPhone || '',
      doctorName: payload.doctorName || '',
      items: invoiceItems,
      subtotal: Number(subtotal.toFixed(2)),
      discountPercent: discPct,
      discountAmount,
      taxPercent: txPct,
      taxAmount,
      totalAmount,
      paymentMethod: payload.paymentMethod || 'Cash',
      notes: payload.notes || '',
      pharmacistName: payload.pharmacistName || 'P. Suresh (Chief Pharmacist)'
    };

    sales.unshift(newSale);
    setStored(STORAGE_KEYS.SALES, sales);

    return { success: true, message: 'Sale processed successfully', data: newSale };
  },

  // Purchases
  getPurchases() {
    this.init();
    const purchases = getStored(STORAGE_KEYS.PURCHASES, defaultPurchases);
    return { success: true, count: purchases.length, data: purchases };
  },

  createPurchase(payload) {
    this.init();
    const medicines = getStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
    const purchases = getStored(STORAGE_KEYS.PURCHASES, defaultPurchases);

    const poDate = new Date().toISOString();
    const todayStr = poDate.slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const poNumber = `PO-${todayStr}-${randSuffix}`;

    let totalCost = 0;
    const processedItems = [];

    for (const item of payload.items) {
      const qty = parseInt(item.quantity, 10);
      const costPrice = parseFloat(item.costPrice || 0);
      const sellingPrice = parseFloat(item.sellingPrice || costPrice * 1.3);
      const lineTotal = Number((qty * costPrice).toFixed(2));
      totalCost += lineTotal;

      const med = medicines.find(m => m.id === item.medicineId);
      if (med) {
        const balanceBefore = med.currentStock;
        const balanceAfter = balanceBefore + qty;
        med.currentStock = balanceAfter;
        med.costPrice = costPrice;
        med.sellingPrice = sellingPrice;
        if (item.batchNumber) med.batchNumber = item.batchNumber.trim().toUpperCase();
        if (item.expiryDate) med.expiryDate = item.expiryDate;

        this.addMovement({
          medicineId: med.id,
          medicineName: med.brandName || med.name,
          sku: med.sku,
          batchNumber: med.batchNumber,
          type: 'STOCK_IN',
          quantity: qty,
          balanceBefore,
          balanceAfter,
          referenceId: poNumber,
          reason: 'Supplier Goods Receipt (Inward)',
          performedBy: payload.receivedBy || 'Chief Pharmacist',
          notes: `Supplier: ${payload.supplierName} | Ref: ${payload.invoiceReference || 'N/A'}`
        });

        processedItems.push({
          medicineId: med.id,
          medicineName: med.brandName || med.name,
          batchNumber: med.batchNumber,
          expiryDate: med.expiryDate,
          quantity: qty,
          costPrice,
          sellingPrice,
          total: lineTotal
        });
      }
    }

    setStored(STORAGE_KEYS.MEDICINES, medicines);

    const newPO = {
      id: `po-${Date.now().toString().slice(-6)}`,
      poNumber,
      date: poDate,
      supplierId: payload.supplierId,
      supplierName: payload.supplierName,
      invoiceReference: payload.invoiceReference,
      items: processedItems,
      totalCost: Number(totalCost.toFixed(2)),
      status: 'Received',
      notes: payload.notes || '',
      receivedBy: payload.receivedBy || 'P. Suresh'
    };

    purchases.unshift(newPO);
    setStored(STORAGE_KEYS.PURCHASES, purchases);

    return { success: true, message: 'Purchase recorded and stock added', data: newPO };
  },

  // Stock Movements
  getMovements(params = {}) {
    this.init();
    let movements = getStored(STORAGE_KEYS.MOVEMENTS, defaultStockMovements);
    if (params.type && params.type !== 'All') {
      movements = movements.filter(m => m.type === params.type);
    }
    if (params.limit) {
      movements = movements.slice(0, parseInt(params.limit, 10));
    }
    return { success: true, totalCount: movements.length, data: movements };
  },

  getMovementStats() {
    this.init();
    const movements = getStored(STORAGE_KEYS.MOVEMENTS, defaultStockMovements);
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

    return {
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
    };
  },

  addMovement(mov) {
    const movements = getStored(STORAGE_KEYS.MOVEMENTS, defaultStockMovements);
    const newMov = {
      id: `mov-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      ...mov
    };
    movements.unshift(newMov);
    setStored(STORAGE_KEYS.MOVEMENTS, movements);
    return newMov;
  },

  // Suppliers
  getSuppliers() {
    this.init();
    const suppliers = getStored(STORAGE_KEYS.SUPPLIERS, defaultSuppliers);
    const medicines = getStored(STORAGE_KEYS.MEDICINES, defaultMedicines);

    const enriched = suppliers.map(s => {
      const suppliedMeds = medicines.filter(m => m.supplierId === s.id);
      return {
        ...s,
        medicinesCount: suppliedMeds.length,
        totalStockSupplied: suppliedMeds.reduce((acc, m) => acc + m.currentStock, 0)
      };
    });
    return { success: true, count: enriched.length, data: enriched };
  },

  addSupplier(data) {
    this.init();
    const suppliers = getStored(STORAGE_KEYS.SUPPLIERS, defaultSuppliers);
    const newSup = {
      ...data,
      id: `sup-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString()
    };
    suppliers.push(newSup);
    setStored(STORAGE_KEYS.SUPPLIERS, suppliers);
    return { success: true, message: 'Supplier registered', data: newSup };
  },

  updateSupplier(id, updates) {
    this.init();
    const suppliers = getStored(STORAGE_KEYS.SUPPLIERS, defaultSuppliers);
    const idx = suppliers.findIndex(s => s.id === id);
    if (idx === -1) return { success: false, message: 'Supplier not found' };
    suppliers[idx] = { ...suppliers[idx], ...updates, updatedAt: new Date().toISOString() };
    setStored(STORAGE_KEYS.SUPPLIERS, suppliers);
    return { success: true, message: 'Supplier updated', data: suppliers[idx] };
  },

  deleteSupplier(id) {
    this.init();
    let suppliers = getStored(STORAGE_KEYS.SUPPLIERS, defaultSuppliers);
    suppliers = suppliers.filter(s => s.id !== id);
    setStored(STORAGE_KEYS.SUPPLIERS, suppliers);
    return { success: true, message: 'Supplier deleted' };
  },

  // Dashboard Aggregates
  getDashboardStats() {
    this.init();
    const medicines = getStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
    const sales = getStored(STORAGE_KEYS.SALES, defaultSales);
    const purchases = getStored(STORAGE_KEYS.PURCHASES, defaultPurchases);
    const movements = getStored(STORAGE_KEYS.MOVEMENTS, defaultStockMovements);

    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiredCount = 0;
    let expiring30DaysCount = 0;

    for (const m of medicines) {
      totalStockUnits += m.currentStock;
      totalCostValuation += m.currentStock * m.costPrice;
      totalRetailValuation += m.currentStock * m.sellingPrice;

      if (m.currentStock <= 0) outOfStockCount++;
      else if (m.currentStock <= m.minReorderLevel) lowStockCount++;

      if (isExpired(m.expiryDate)) expiredCount++;
      else if (isExpiringWithinDays(m.expiryDate, 30)) expiring30DaysCount++;
    }

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

    return {
      success: true,
      data: {
        totalMedicines: medicines.length,
        totalStockUnits,
        totalCostValuation: Number(totalCostValuation.toFixed(2)),
        totalRetailValuation: Number(totalRetailValuation.toFixed(2)),
        potentialGrossProfit: Number((totalRetailValuation - totalCostValuation).toFixed(2)),
        lowStockCount,
        outOfStockCount,
        expiredCount,
        expiring30DaysCount,
        todaySalesRevenue: Number(todaySalesRevenue.toFixed(2)),
        todaySalesCount,
        allTimeSalesRevenue: Number(allTimeSalesRevenue.toFixed(2)),
        totalPurchasesCost: purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0),
        totalMovementsCount: movements.length
      }
    };
  },

  getSalesTrend() {
    this.init();
    const sales = getStored(STORAGE_KEYS.SALES, defaultSales);
    const daysMap = {};
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

    return {
      success: true,
      data: Object.values(daysMap).map(d => ({ ...d, revenue: Number(d.revenue.toFixed(2)) }))
    };
  },

  getCategoryStats() {
    this.init();
    const medicines = getStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
    const catMap = {};
    for (const m of medicines) {
      const cat = m.category || 'General';
      if (!catMap[cat]) {
        catMap[cat] = { category: cat, medicinesCount: 0, totalStock: 0, stockValueCost: 0 };
      }
      catMap[cat].medicinesCount++;
      catMap[cat].totalStock += m.currentStock;
      catMap[cat].stockValueCost += m.currentStock * m.costPrice;
    }
    return {
      success: true,
      data: Object.values(catMap).map(c => ({ ...c, stockValueCost: Number(c.stockValueCost.toFixed(2)) }))
    };
  },

  getTopSelling() {
    this.init();
    const sales = getStored(STORAGE_KEYS.SALES, defaultSales);
    const map = {};
    for (const s of sales) {
      if (s.items) {
        for (const it of s.items) {
          if (!map[it.medicineId]) {
            map[it.medicineId] = { medicineId: it.medicineId, name: it.medicineName, totalQuantitySold: 0, totalRevenue: 0 };
          }
          map[it.medicineId].totalQuantitySold += it.quantity;
          map[it.medicineId].totalRevenue += it.total || it.quantity * it.unitPrice;
        }
      }
    }
    const sorted = Object.values(map)
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, 5)
      .map(i => ({ ...i, totalRevenue: Number(i.totalRevenue.toFixed(2)) }));
    return { success: true, data: sorted };
  },

  getAlerts() {
    this.init();
    const medicines = getStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
    const outOfStock = [];
    const lowStock = [];
    const expired = [];
    const expiringSoon = [];
    const reorderRecommendations = [];

    for (const m of medicines) {
      const exp = isExpired(m.expiryDate);
      const expSoon = isExpiringWithinDays(m.expiryDate, 60);

      if (exp) expired.push(m);
      else if (expSoon) expiringSoon.push(m);

      if (m.currentStock <= 0) outOfStock.push(m);
      else if (m.currentStock <= m.minReorderLevel) lowStock.push(m);

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

    return {
      success: true,
      data: { outOfStock, lowStock, expired, expiringSoon, reorderRecommendations }
    };
  },

  resetDatabase() {
    setStored(STORAGE_KEYS.MEDICINES, defaultMedicines);
    setStored(STORAGE_KEYS.SUPPLIERS, defaultSuppliers);
    setStored(STORAGE_KEYS.SALES, defaultSales);
    setStored(STORAGE_KEYS.PURCHASES, defaultPurchases);
    setStored(STORAGE_KEYS.MOVEMENTS, defaultStockMovements);
    return { success: true, message: 'Database reset to default seed state' };
  }
};

export default localStore;
