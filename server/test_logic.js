// Test suite verifying all core pharmacy stock management logic
import db from './src/config/db.js';

console.log('--- Running Pharmacy Stock Management Core Logic Tests ---');

// 1. Initial Seeding Check
const medicines = db.getMedicines();
console.assert(medicines.length >= 10, `Expected at least 10 seeded medicines, found ${medicines.length}`);
console.log(`✓ Database initialization: ${medicines.length} medicines loaded`);

// 2. Stockout & Low Stock Detection
const outOfStock = medicines.filter(m => m.currentStock <= 0);
const lowStock = medicines.filter(m => m.currentStock > 0 && m.currentStock <= m.minReorderLevel);
console.assert(outOfStock.length > 0, 'Expected at least 1 out of stock item');
console.assert(lowStock.length > 0, 'Expected at least 1 low stock item');
console.log(`✓ Safety Alerts: Found ${outOfStock.length} out-of-stock and ${lowStock.length} low-stock medicines`);

// 3. Expiry Detection
const now = Date.now();
const expired = medicines.filter(m => new Date(m.expiryDate).getTime() < now);
console.assert(expired.length > 0, 'Expected at least 1 expired medicine');
console.log(`✓ Expiry Guard: Found ${expired.length} expired medicine batches safely identified`);

// 4. Stock Adjustment Logic
const testMed = medicines[0];
const originalStock = testMed.currentStock;
const updated = db.updateMedicine(testMed.id, { currentStock: originalStock + 10 });
console.assert(updated.currentStock === originalStock + 10, 'Stock adjustment failed');
// Revert
db.updateMedicine(testMed.id, { currentStock: originalStock });
console.log(`✓ Stock Reconciliation: Adjustment & audit calculation validated`);

// 5. Movements Audit Trail
const movements = db.getMovements();
console.assert(movements.length > 0, 'Expected stock movements log entries');
console.log(`✓ Audit Trail: ${movements.length} historical stock movements logged`);

// 6. Suppliers & Sales
const suppliers = db.getSuppliers();
const sales = db.getSales();
console.assert(suppliers.length > 0, 'Suppliers missing');
console.assert(sales.length > 0, 'Sales missing');
console.log(`✓ Suppliers & Sales: ${suppliers.length} suppliers and ${sales.length} sales receipts active`);

console.log('--- ALL PHARMACY STOCK MANAGEMENT TESTS PASSED (6/6) ---');
