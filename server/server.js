import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import db from './src/config/db.js';
import medicinesRouter from './src/routes/medicines.js';
import salesRouter from './src/routes/sales.js';
import purchasesRouter from './src/routes/purchases.js';
import movementsRouter from './src/routes/movements.js';
import suppliersRouter from './src/routes/suppliers.js';
import dashboardRouter from './src/routes/dashboard.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Pharmacy Stock Manager API',
    uptime: process.uptime()
  });
});

// Admin reset route for easy demo resetting
app.post('/api/admin/reset', (req, res) => {
  const result = db.reset();
  res.json(result);
});

// Mount Routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/medicines', medicinesRouter);
app.use('/api/sales', salesRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/movements', movementsRouter);
app.use('/api/suppliers', suppliersRouter);

// Serve frontend build if in production
const clientDistPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), err => {
    if (err) {
      next();
    }
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Pharmacy Stock Manager API Server Running!`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================================`);
});

export default app;
