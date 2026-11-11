import React, { useState, useEffect } from 'react';
import {
  IconTruck,
  IconPlus,
  IconSearch,
  IconDownload,
  IconCheckCircle
} from '../components/Icons';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToCsv } from '../utils/exportToCsv';
import api from '../services/api';

export const Purchases = ({
  onOpenNewPurchase,
  onRefresh
}) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchases();
      if (res.success) setPurchases(res.data);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = purchases.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.poNumber.toLowerCase().includes(q) ||
      p.supplierName.toLowerCase().includes(q) ||
      (p.invoiceReference && p.invoiceReference.toLowerCase().includes(q))
    );
  });

  const totalSpend = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);

  const handleExport = () => {
    const exportData = filtered.map(p => ({
      PO_Number: p.poNumber,
      Date: p.date,
      Supplier: p.supplierName,
      Vendor_Invoice: p.invoiceReference,
      Items_Count: p.items ? p.items.length : 0,
      Total_Cost: p.totalCost,
      Status: p.status,
      Received_By: p.receivedBy,
      Notes: p.notes
    }));
    exportToCsv('pharmacy_purchases_orders', exportData);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Inward & Purchase Orders</h1>
          <p className="page-subtitle">
            Log vendor shipments from pharmaceutical distributors, restock batches, and record purchase bills.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <IconDownload size={16} />
            <span>Export Purchases (CSV)</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenNewPurchase}>
            <IconPlus size={16} />
            <span>Record Inward Stock</span>
          </button>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Purchase Spend</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(totalSpend)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            Cumulative procurement volume
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #4f46e5' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Purchase Shipments</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            {purchases.length} PO Orders
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            100% Received & Verified
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <div style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-light)' }}>
            <IconSearch size={17} />
          </div>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search by PO number, distributor, or invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>PO Order No</th>
              <th>Date Received</th>
              <th>Distributor / Supplier</th>
              <th>Vendor Invoice Ref</th>
              <th>Drugs Received</th>
              <th>Total Cost</th>
              <th>Status</th>
              <th>Received By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No inward stock orders recorded yet. Click "Record Inward Stock" above.
                </td>
              </tr>
            ) : (
              filtered.map((po) => (
                <tr key={po.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                    {po.poNumber}
                  </td>

                  <td>{formatDate(po.date, true)}</td>

                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{po.supplierName}</div>
                  </td>

                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {po.invoiceReference || 'N/A'}
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {po.items ? po.items.length : 0} line items
                    </div>
                    {po.items && po.items.length > 0 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {po.items.map(i => `${i.medicineName} (${i.quantity})`).slice(0, 2).join(', ')}
                        {po.items.length > 2 ? '...' : ''}
                      </div>
                    )}
                  </td>

                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '0.95rem' }}>
                    {formatCurrency(po.totalCost)}
                  </td>

                  <td>
                    <span className="badge badge-success">
                      {po.status || 'Received'}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.825rem' }}>{po.receivedBy}</div>
                    {po.notes && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{po.notes}</div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Purchases;
