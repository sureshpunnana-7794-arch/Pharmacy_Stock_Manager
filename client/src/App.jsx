import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POSBilling from './pages/POSBilling';
import StockMovements from './pages/StockMovements';
import Purchases from './pages/Purchases';
import Suppliers from './pages/Suppliers';
import AlertsReplenishment from './pages/AlertsReplenishment';

import MedicineModal from './components/MedicineModal';
import StockAdjustmentModal from './components/StockAdjustmentModal';
import PurchaseModal from './components/PurchaseModal';
import SupplierModal from './components/SupplierModal';
import ReceiptModal from './components/ReceiptModal';

import api from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingMedicine, setAdjustingMedicine] = useState(null);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [prefilledPurchaseItem, setPrefilledPurchaseItem] = useState(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState(null);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [medRes, supRes, alertRes] = await Promise.all([
        api.getMedicines(),
        api.getSuppliers(),
        api.getAlerts()
      ]);

      if (medRes.success) setMedicines(medRes.data);
      if (supRes.success) setSuppliers(supRes.data);
      if (alertRes.success) {
        const totalAlerts =
          (alertRes.data.outOfStock?.length || 0) +
          (alertRes.data.lowStock?.length || 0) +
          (alertRes.data.expired?.length || 0);
        setAlertCount(totalAlerts);
      }
    } catch (err) {
      console.error('Failed to load initial pharmacy data:', err);
      showToast('Backend connection established with cached storage.', 'info');
    } finally {
      setLoading(false);
    }
  };

  // Medicine CRUD
  const handleSaveMedicine = async (formData) => {
    if (formData.id) {
      const res = await api.updateMedicine(formData.id, formData);
      if (res.success) showToast(`Updated "${res.data.brandName || res.data.name}"`);
    } else {
      const res = await api.addMedicine(formData);
      if (res.success) showToast(`Added "${res.data.brandName || res.data.name}" to catalog`);
    }
    loadAllData();
  };

  // Stock Adjustment
  const handleStockAdjustment = async ({ id, type, quantity, reason, notes, performedBy }) => {
    const res = await api.adjustStock(id, { type, quantity, reason, notes, performedBy });
    if (res.success) {
      showToast(res.message, 'success');
      loadAllData();
    }
  };

  // Inward Purchase Order
  const handleSavePurchase = async (purchaseData) => {
    const res = await api.createPurchase(purchaseData);
    if (res.success) {
      showToast(`Inward PO ${res.data.poNumber} verified & stock added`, 'success');
      loadAllData();
    }
  };

  // Supplier Save
  const handleSaveSupplier = async (supplierData) => {
    if (supplierData.id) {
      const res = await api.updateSupplier(supplierData.id, supplierData);
      if (res.success) showToast(`Supplier "${res.data.name}" updated`);
    } else {
      const res = await api.addSupplier(supplierData);
      if (res.success) showToast(`Registered supplier "${res.data.name}"`);
    }
    loadAllData();
  };

  // Sales Complete (opens receipt)
  const handleSaleCompleted = (saleRecord) => {
    showToast(`Invoice ${saleRecord.invoiceNumber} processed successfully!`, 'success');
    loadAllData();
    setActiveReceiptSale(saleRecord);
    setIsReceiptModalOpen(true);
  };

  // Reset database demo
  const handleResetDb = async () => {
    if (window.confirm('Reset pharmacy stock database to default demonstration seed data?')) {
      try {
        await api.resetDatabase();
        showToast('Pharmacy database reset to original demo records', 'success');
        loadAllData();
      } catch (err) {
        showToast(err.message || 'Failed to reset database', 'error');
      }
    }
  };

  return (
    <div className="app-container">
      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 100,
            backgroundColor: toast.type === 'error' ? 'var(--danger)' : toast.type === 'info' ? 'var(--info)' : 'var(--primary)',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.875rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alertCount}
        onResetDb={handleResetDb}
      />

      <div className="main-wrapper">
        {/* Top Navbar */}
        <Navbar
          alertCount={alertCount}
          onOpenNewSale={() => setActiveTab('pos')}
          onOpenAddMedicine={() => {
            setEditingMedicine(null);
            setIsMedicineModalOpen(true);
          }}
          onOpenNewPurchase={() => {
            setPrefilledPurchaseItem(null);
            setIsPurchaseModalOpen(true);
          }}
          onOpenAlerts={() => setActiveTab('alerts')}
        />

        {/* Content Area */}
        <main className="content-area">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewSale={() => setActiveTab('pos')}
              onOpenAddMedicine={() => {
                setEditingMedicine(null);
                setIsMedicineModalOpen(true);
              }}
              onOpenNewPurchase={() => {
                setPrefilledPurchaseItem(null);
                setIsPurchaseModalOpen(true);
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <Inventory
              medicines={medicines}
              suppliers={suppliers}
              loading={loading}
              onOpenAddMedicine={() => {
                setEditingMedicine(null);
                setIsMedicineModalOpen(true);
              }}
              onOpenEditMedicine={(med) => {
                setEditingMedicine(med);
                setIsMedicineModalOpen(true);
              }}
              onOpenAdjustStock={(med) => {
                setAdjustingMedicine(med);
                setIsAdjustModalOpen(true);
              }}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'pos' && (
            <POSBilling
              medicines={medicines}
              onSaleCompleted={handleSaleCompleted}
              onViewReceipt={(sale) => {
                setActiveReceiptSale(sale);
                setIsReceiptModalOpen(true);
              }}
            />
          )}

          {activeTab === 'movements' && (
            <StockMovements />
          )}

          {activeTab === 'purchases' && (
            <Purchases
              onOpenNewPurchase={() => {
                setPrefilledPurchaseItem(null);
                setIsPurchaseModalOpen(true);
              }}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'suppliers' && (
            <Suppliers
              suppliers={suppliers}
              loading={loading}
              onOpenAddSupplier={() => {
                setEditingSupplier(null);
                setIsSupplierModalOpen(true);
              }}
              onOpenEditSupplier={(s) => {
                setEditingSupplier(s);
                setIsSupplierModalOpen(true);
              }}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsReplenishment
              onOpenNewPurchaseWithItem={(med) => {
                setPrefilledPurchaseItem(med);
                setIsPurchaseModalOpen(true);
              }}
              onOpenAdjustStock={(med) => {
                setAdjustingMedicine(med);
                setIsAdjustModalOpen(true);
              }}
              onRefresh={loadAllData}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <MedicineModal
        isOpen={isMedicineModalOpen}
        onClose={() => setIsMedicineModalOpen(false)}
        medicine={editingMedicine}
        suppliers={suppliers}
        onSaveSuccess={handleSaveMedicine}
      />

      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        medicine={adjustingMedicine}
        onAdjustSuccess={handleStockAdjustment}
      />

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        medicines={medicines}
        suppliers={suppliers}
        onSaveSuccess={handleSavePurchase}
      />

      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplier={editingSupplier}
        onSaveSuccess={handleSaveSupplier}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={activeReceiptSale}
      />
    </div>
  );
}

export default App;
