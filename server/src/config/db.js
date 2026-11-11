import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  seedMedicines,
  seedSuppliers,
  seedSales,
  seedPurchases,
  seedStockMovements
} from '../utils/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'pharmacy_store.json');

class DatabaseStore {
  constructor() {
    this.data = {
      medicines: [],
      suppliers: [],
      sales: [],
      purchases: [],
      movements: []
    };
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          medicines: parsed.medicines || [],
          suppliers: parsed.suppliers || [],
          sales: parsed.sales || [],
          purchases: parsed.purchases || [],
          movements: parsed.movements || []
        };

        // If empty, re-seed
        if (this.data.medicines.length === 0) {
          this.seed();
        }
      } else {
        this.seed();
      }
    } catch (err) {
      console.error('[DB] Error loading database file. Initializing with default seed data:', err.message);
      this.seed();
    }
  }

  seed() {
    this.data = {
      medicines: [...seedMedicines],
      suppliers: [...seedSuppliers],
      sales: [...seedSales],
      purchases: [...seedPurchases],
      movements: [...seedStockMovements]
    };
    this.save();
    console.log('[DB] Seeded fresh pharmacy database with initial records.');
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempPath = `${DATA_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DATA_FILE);
    } catch (err) {
      console.error('[DB] Failed to persist data to disk:', err.message);
    }
  }

  // Medicines
  getMedicines() {
    return this.data.medicines;
  }

  getMedicineById(id) {
    return this.data.medicines.find(m => m.id === id);
  }

  addMedicine(medicine) {
    this.data.medicines.push(medicine);
    this.save();
    return medicine;
  }

  updateMedicine(id, updates) {
    const index = this.data.medicines.findIndex(m => m.id === id);
    if (index === -1) return null;
    this.data.medicines[index] = {
      ...this.data.medicines[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.medicines[index];
  }

  deleteMedicine(id) {
    const index = this.data.medicines.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.data.medicines.splice(index, 1);
    this.save();
    return true;
  }

  // Suppliers
  getSuppliers() {
    return this.data.suppliers;
  }

  getSupplierById(id) {
    return this.data.suppliers.find(s => s.id === id);
  }

  addSupplier(supplier) {
    this.data.suppliers.push(supplier);
    this.save();
    return supplier;
  }

  updateSupplier(id, updates) {
    const index = this.data.suppliers.findIndex(s => s.id === id);
    if (index === -1) return null;
    this.data.suppliers[index] = {
      ...this.data.suppliers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.suppliers[index];
  }

  deleteSupplier(id) {
    const index = this.data.suppliers.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.data.suppliers.splice(index, 1);
    this.save();
    return true;
  }

  // Sales
  getSales() {
    return this.data.sales;
  }

  getSaleById(id) {
    return this.data.sales.find(s => s.id === id || s.invoiceNumber === id);
  }

  addSale(sale) {
    this.data.sales.unshift(sale); // Latest first
    this.save();
    return sale;
  }

  // Purchases
  getPurchases() {
    return this.data.purchases;
  }

  getPurchaseById(id) {
    return this.data.purchases.find(p => p.id === id || p.poNumber === id);
  }

  addPurchase(purchase) {
    this.data.purchases.unshift(purchase); // Latest first
    this.save();
    return purchase;
  }

  // Stock Movements
  getMovements() {
    return this.data.movements;
  }

  addMovement(movement) {
    this.data.movements.unshift(movement); // Latest first
    this.save();
    return movement;
  }

  reset() {
    this.seed();
    return { success: true, message: 'Database reset to default seed state' };
  }
}

export const db = new DatabaseStore();
export default db;
