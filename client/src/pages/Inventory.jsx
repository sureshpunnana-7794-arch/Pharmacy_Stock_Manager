import React, { useState, useEffect } from 'react';
import {
  IconPlus,
  IconSearch,
  IconSliders,
  IconDownload,
  IconEdit3,
  IconTrash2,
  IconShieldAlert,
  IconCheckCircle
} from '../components/Icons';
import { formatCurrency, formatDate, getExpiryStatus, getStockStatus } from '../utils/formatters';
import { exportToCsv } from '../utils/exportToCsv';
import api from '../services/api';

export const Inventory = ({
  medicines = [],
  suppliers = [],
  loading = false,
  onOpenAddMedicine,
  onOpenEditMedicine,
  onOpenAdjustStock,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'in-stock', 'low', 'out', 'expiring', 'expired'

  const categories = [
    'All',
    'Antibiotics',
    'Analgesics & Antipyretics',
    'Cardiovascular',
    'Diabetes Care',
    'Gastrointestinal',
    'Respiratory',
    'Allergy & Cold',
    'Dermatological & First Aid',
    'Vitamins & Supplements'
  ];

  const filteredMedicines = medicines.filter((m) => {
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase().trim();
      const match =
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.brandName && m.brandName.toLowerCase().includes(q)) ||
        (m.genericName && m.genericName.toLowerCase().includes(q)) ||
        (m.sku && m.sku.toLowerCase().includes(q)) ||
        (m.batchNumber && m.batchNumber.toLowerCase().includes(q)) ||
        (m.location && m.location.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Category
    if (categoryFilter !== 'All' && m.category !== categoryFilter) {
      return false;
    }

    // Status
    if (statusFilter === 'out') {
      return m.currentStock <= 0;
    }
    if (statusFilter === 'low') {
      return m.currentStock > 0 && m.currentStock <= m.minReorderLevel;
    }
    if (statusFilter === 'expired') {
      return m.isExpired;
    }
    if (statusFilter === 'expiring') {
      return m.isExpiringSoon && !m.isExpired;
    }
    if (statusFilter === 'in-stock') {
      return m.currentStock > m.minReorderLevel && !m.isExpired;
    }

    return true;
  });

  const handleExport = () => {
    const exportData = filteredMedicines.map(m => ({
      SKU: m.sku,
      Brand_Name: m.brandName || m.name,
      Official_Name: m.name,
      Category: m.category,
      Dosage_Form: m.dosageForm,
      Strength: m.strength,
      Batch_Number: m.batchNumber,
      Expiry_Date: m.expiryDate,
      Current_Stock: m.currentStock,
      Min_Reorder_Level: m.minReorderLevel,
      Cost_Price: m.costPrice,
      Selling_Price: m.sellingPrice,
      Location: m.location,
      Prescription_Required: m.prescriptionRequired ? 'Yes' : 'No',
      Supplier: m.supplierName
    }));
    exportToCsv('pharmacy_inventory_report', exportData);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      try {
        await api.deleteMedicine(id);
        onRefresh();
      } catch (err) {
        alert(err.message || 'Failed to delete medicine');
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmacy Inventory & Catalog</h1>
          <p className="page-subtitle">
            Manage pharmaceutical stock, track expiry dates, monitor safety thresholds, and reconcile counts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <IconDownload size={16} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenAddMedicine}>
            <IconPlus size={16} />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search box */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <div style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-light)' }}>
              <IconSearch size={17} />
            </div>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search by brand, generic name, SKU, batch, or shelf..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: '200px' }}>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.25rem' }}>
            Filter by:
          </span>
          {[
            { id: 'all', label: 'All Items' },
            { id: 'in-stock', label: 'Healthy Stock' },
            { id: 'low', label: 'Low Stock' },
            { id: 'out', label: 'Out of Stock' },
            { id: 'expiring', label: 'Expiring Soon' },
            { id: 'expired', label: 'Expired' }
          ].map((pill) => (
            <button
              key={pill.id}
              className={`btn btn-sm ${statusFilter === pill.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.775rem', padding: '0.3rem 0.75rem' }}
              onClick={() => setStatusFilter(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Medicine & Brand</th>
              <th>Category & Form</th>
              <th>SKU & Batch</th>
              <th>Shelf Location</th>
              <th>Stock Status</th>
              <th>Expiry Status</th>
              <th>MRP / Rate</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No medicines match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredMedicines.map((m) => {
                const stockStat = getStockStatus(m.currentStock, m.minReorderLevel);
                const expiryStat = getExpiryStatus(m.expiryDate);

                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                          {m.brandName || m.name}
                        </span>
                        {m.prescriptionRequired && (
                          <span className="badge badge-info" style={{ fontSize: '0.65rem' }} title="Prescription Required">
                            Rx
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {m.name !== m.brandName ? m.name : m.genericName}
                      </div>
                    </td>

                    <td>
                      <div>
                        <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                          {m.category}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {m.dosageForm} {m.strength && `• ${m.strength}`}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem', fontWeight: 600 }}>
                        {m.sku}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-light)' }}>
                        Batch: {m.batchNumber}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>
                        {m.location || 'Shelf General'}
                      </span>
                    </td>

                    <td>
                      <span className={`badge badge-${stockStat.level}`}>
                        {stockStat.label}
                      </span>
                      {m.currentStock > 0 && m.currentStock <= m.minReorderLevel && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginTop: '0.2rem' }}>
                          Min Level: {m.minReorderLevel}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className={`badge badge-${expiryStat.level}`}>
                        {expiryStat.label}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                        {formatCurrency(m.sellingPrice)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>
                        Cost: {formatCurrency(m.costPrice)}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          title="Reconcile and adjust stock count"
                          onClick={() => onOpenAdjustStock(m)}
                        >
                          <IconSliders size={13} />
                          <span>Adjust</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          style={{ width: 30, height: 30 }}
                          title="Edit medicine"
                          onClick={() => onOpenEditMedicine(m)}
                        >
                          <IconEdit3 size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          style={{ width: 30, height: 30, color: 'var(--danger)' }}
                          title="Delete from catalog"
                          onClick={() => handleDelete(m.id, m.brandName || m.name)}
                        >
                          <IconTrash2 size={13} />
                        </button>
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

export default Inventory;
