import React, { useState, useEffect } from 'react';
import {
  IconShieldAlert,
  IconAlertTriangle,
  IconTruck,
  IconDownload,
  IconCheckCircle,
  IconTrash2,
  IconSliders
} from '../components/Icons';
import { formatCurrency, formatDate, getDaysUntilExpiry } from '../utils/formatters';
import { exportToCsv } from '../utils/exportToCsv';
import api from '../services/api';

export const AlertsReplenishment = ({
  onOpenNewPurchaseWithItem,
  onOpenAdjustStock,
  onRefresh
}) => {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts();
      if (res.success) setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisposeExpired = async (medicine) => {
    if (window.confirm(`Are you sure you want to write-off and dispose expired batch ${medicine.batchNumber} of "${medicine.brandName || medicine.name}"? This will set stock to 0 and record a DISPOSAL audit entry.`)) {
      try {
        await api.adjustStock(medicine.id, {
          type: 'SET',
          quantity: 0,
          reason: 'Expired Stock Write-off (Disposal)',
          notes: `Batch ${medicine.batchNumber} expired on ${medicine.expiryDate}. Disposed safely per biomedical waste norms.`,
          performedBy: 'Chief Pharmacist P. Suresh'
        });
        loadAlerts();
        onRefresh();
      } catch (err) {
        alert(err.message || 'Failed to dispose expired batch');
      }
    }
  };

  const handleExportReorderSheet = () => {
    if (!alerts?.reorderRecommendations?.length) {
      alert('No reorder recommendations available at this time.');
      return;
    }

    const data = alerts.reorderRecommendations.map(r => ({
      Urgency: r.urgency,
      Medicine_Name: r.name,
      SKU: r.sku,
      Batch_Number: r.batchNumber,
      Category: r.category,
      Current_Stock: r.currentStock,
      Min_Reorder_Threshold: r.minReorderLevel,
      Recommended_Order_Qty: r.suggestedOrderQty,
      Unit_Cost: r.unitCost,
      Estimated_Total_Cost: r.estimatedCost,
      Supplier_Name: r.supplierName
    }));

    exportToCsv('pharmacy_restock_requisition_sheet', data);
  };

  if (loading && !alerts) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Scanning inventory levels and batch expiry dates...</p>
      </div>
    );
  }

  const outOfStock = alerts?.outOfStock || [];
  const lowStock = alerts?.lowStock || [];
  const expired = alerts?.expired || [];
  const expiringSoon = alerts?.expiringSoon || [];
  const reorders = alerts?.reorderRecommendations || [];

  const totalEstimatedReorderCost = reorders.reduce((sum, r) => sum + r.estimatedCost, 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Stockout Prevention & Expiry Protection</h1>
          <p className="page-subtitle">
            Proactively monitor safety stock levels, eliminate stockouts, prevent dispensing expired batches, and automate replenishment orders.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button className="btn btn-secondary" onClick={loadAlerts}>
            Refresh Alerts
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExportReorderSheet}
            disabled={reorders.length === 0}
          >
            <IconDownload size={16} />
            <span>Export Restock Sheet (CSV)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #e11d48' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completely Out of Stock</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
            {outOfStock.length} Medicines
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            Critical stockout emergency
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #d97706' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Low Stock Alert</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>
            {lowStock.length} Medicines
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            At or below safety threshold
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f43f5e' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Expired Batches</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>
            {expired.length} Batches
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            Blocked from sale • Pending disposal
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #4f46e5' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estimated Restock Cost</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(totalEstimatedReorderCost)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            {reorders.length} items recommended
          </span>
        </div>
      </div>

      {/* 1. Critical Out of Stock Section */}
      {outOfStock.length > 0 && (
        <div className="card" style={{ marginBottom: '1.75rem', border: '1px solid var(--danger-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span className="badge badge-danger" style={{ fontSize: '0.8rem' }}>
                <IconShieldAlert size={14} /> Critical Stockout
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Medicines at 0 Units (Immediate Restock Required)
              </h3>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Min Safety Stock</th>
                  <th>Supplier / Distributor</th>
                  <th style={{ textAlign: 'right' }}>Replenish Action</th>
                </tr>
              </thead>
              <tbody>
                {outOfStock.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--danger)' }}>
                        {m.brandName || m.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.dosageForm} • {m.strength}</div>
                    </td>
                    <td><span className="badge badge-neutral">{m.category}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{m.sku}</td>
                    <td><strong>{m.minReorderLevel} units</strong></td>
                    <td>{m.supplierName}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onOpenNewPurchaseWithItem(m)}
                      >
                        <IconTruck size={14} />
                        <span>Create Restock PO</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Automated Reorder Recommendation Plan */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Intelligent Reorder Requisition Plan
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Calculates safety stock replenishment to prevent impending stockouts based on minimum inventory thresholds.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleExportReorderSheet}>
            <IconDownload size={14} />
            <span>Export Reorder CSV</span>
          </button>
        </div>

        {reorders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--primary)' }}>
            <IconCheckCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.8 }} />
            <p style={{ fontWeight: 700, fontSize: '1rem' }}>All Stock Levels are Healthy!</p>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>No medicines currently below safety reorder thresholds.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Urgency</th>
                  <th>Medicine</th>
                  <th>Current Stock</th>
                  <th>Min Level</th>
                  <th>Suggested Order Qty</th>
                  <th>Est. Unit Cost</th>
                  <th>Est. Total Spend</th>
                  <th>Assigned Distributor</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reorders.map((r) => (
                  <tr key={r.medicineId}>
                    <td>
                      <span className={`badge ${r.urgency === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}`}>
                        {r.urgency}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{r.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        SKU: {r.sku} • Batch: {r.batchNumber}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: r.currentStock === 0 ? 'var(--danger)' : 'var(--warning)', fontFamily: 'var(--font-mono)' }}>
                        {r.currentStock} units
                      </strong>
                    </td>
                    <td>{r.minReorderLevel}</td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      +{r.suggestedOrderQty} units
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(r.unitCost)}</td>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                      {formatCurrency(r.estimatedCost)}
                    </td>
                    <td>{r.supplierName}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onOpenNewPurchaseWithItem({
                          id: r.medicineId,
                          name: r.name,
                          costPrice: r.unitCost,
                          batchNumber: r.batchNumber
                        })}
                      >
                        <IconTruck size={13} />
                        <span>Order</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Expiry Danger Zone (Expired & Expiring Soon) */}
      <div className="grid-cols-2">
        {/* Expired Batches */}
        <div className="card" style={{ border: expired.length > 0 ? '1px solid var(--danger-border)' : '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-danger">Expired Batches</span>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>
                Patient Safety Disposal Watch ({expired.length})
              </h4>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Sale of these batches is strictly blocked in Point of Sale. Write off expired inventory to maintain compliant stock.
          </p>

          {expired.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
              ✓ No expired medicines currently in stock.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {expired.map((m) => {
                const days = Math.abs(getDaysUntilExpiry(m.expiryDate));
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--danger-light)',
                      border: '1px solid var(--danger-border)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                        {m.brandName || m.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>
                        Expired on {formatDate(m.expiryDate)} ({days} days ago) • Stock: {m.currentStock} units
                      </div>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      onClick={() => handleDisposeExpired(m)}
                    >
                      <IconTrash2 size={13} />
                      <span>Write-off (Dispose)</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expiring Soon (< 60 Days) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-warning">Expiring Soon</span>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e', margin: 0 }}>
                Upcoming Expirations (&lt; 60 Days)
              </h4>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Prioritize first-expiry-first-out (FEFO) dispensing or coordinate returns with suppliers before threshold expiration.
          </p>

          {expiringSoon.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No items expiring within the next 60 days.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {expiringSoon.map((m) => {
                const days = getDaysUntilExpiry(m.expiryDate);
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--warning-light)',
                      border: '1px solid var(--warning-border)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                        {m.brandName || m.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--warning)', fontWeight: 600 }}>
                        Expires in {days} days ({formatDate(m.expiryDate)}) • Stock: {m.currentStock} units
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      onClick={() => onOpenAdjustStock(m)}
                    >
                      <IconSliders size={13} />
                      <span>Inspect</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsReplenishment;
