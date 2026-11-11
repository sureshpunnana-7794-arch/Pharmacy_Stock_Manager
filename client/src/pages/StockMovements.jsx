import React, { useState, useEffect } from 'react';
import {
  IconActivity,
  IconSearch,
  IconDownload,
  IconTruck,
  IconShoppingCart,
  IconSliders,
  IconTrash2
} from '../components/Icons';
import { formatDate } from '../utils/formatters';
import { exportToCsv } from '../utils/exportToCsv';
import api from '../services/api';

export const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const [movRes, statRes] = await Promise.all([
        api.getMovements(),
        api.getMovementStats()
      ]);
      if (movRes.success) setMovements(movRes.data);
      if (statRes.success) setStats(statRes.data);
    } catch (err) {
      console.error('Failed to load stock movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = movements.filter((m) => {
    if (filterType !== 'All' && m.type !== filterType) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return (
        m.medicineName.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q) ||
        m.referenceId.toLowerCase().includes(q) ||
        (m.reason && m.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExport = () => {
    const exportData = filtered.map(m => ({
      Movement_ID: m.id,
      Date_Time: m.date,
      Medicine_Name: m.medicineName,
      SKU: m.sku,
      Batch_Number: m.batchNumber,
      Movement_Type: m.type,
      Quantity_Delta: m.quantity,
      Balance_Before: m.balanceBefore,
      Balance_After: m.balanceAfter,
      Reference_ID: m.referenceId,
      Audit_Reason: m.reason,
      Performed_By: m.performedBy,
      Notes: m.notes
    }));
    exportToCsv('pharmacy_stock_movement_audit', exportData);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Movements & Inventory Audit</h1>
          <p className="page-subtitle">
            Immutable log of all inward deliveries, prescription dispensations, inventory reconciliations, and disposal write-offs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button className="btn btn-secondary" onClick={loadMovements}>
            Refresh
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            <IconDownload size={16} />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      {/* Movement Metrics */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Inward Stock</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
            +{stats?.stockInUnits || 0} units
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            {stats?.stockInCount || 0} PO inward transactions
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #0284c7' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Dispensed (Out)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
            -{stats?.stockOutUnits || 0} units
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            {stats?.stockOutCount || 0} sales transactions
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #d97706' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Count Adjustments</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-mono)' }}>
            {stats?.adjustmentCount || 0} logs
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            Physical audits & corrections
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #e11d48' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Expired / Damage Write-offs</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e11d48', fontFamily: 'var(--font-mono)' }}>
            {stats?.disposalCount || 0} batches
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            Decommissioned & written off
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search box */}
          <div style={{ position: 'relative', minWidth: '300px', flex: 1 }}>
            <div style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-light)' }}>
              <IconSearch size={17} />
            </div>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search by drug name, SKU, batch, or invoice/PO #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['All', 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'DISPOSAL'].map((type) => (
              <button
                key={type}
                className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem' }}
                onClick={() => setFilterType(type)}
              >
                {type === 'All' ? 'All Transactions' : type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Medicine & Batch</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Balance Audit</th>
              <th>Reference ID</th>
              <th>Reason & Performed By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No stock movements match the filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const isStockIn = m.type === 'STOCK_IN';
                const isDisposal = m.type === 'DISPOSAL';
                const isStockOut = m.type === 'STOCK_OUT';

                const badgeColor = isStockIn
                  ? 'success'
                  : isDisposal
                  ? 'danger'
                  : isStockOut
                  ? 'info'
                  : 'warning';

                return (
                  <tr key={m.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {formatDate(m.date, true)}
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {m.medicineName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        SKU: {m.sku} • Batch: {m.batchNumber}
                      </div>
                    </td>

                    <td>
                      <span className={`badge badge-${badgeColor}`} style={{ fontSize: '0.72rem' }}>
                        {m.type.replace('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <span style={{
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.925rem',
                        color: m.quantity > 0 ? 'var(--primary)' : 'var(--danger)'
                      }}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {m.balanceBefore} &rarr; <strong>{m.balanceAfter}</strong>
                      </div>
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {m.referenceId}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{m.reason}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        By {m.performedBy} {m.notes && `• "${m.notes}"`}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockMovements;
