import React, { useState } from 'react';
import Modal from './Modal';
import { IconCheckCircle } from './Icons';

export const StockAdjustmentModal = ({ isOpen, onClose, medicine, onAdjustSuccess }) => {
  if (!medicine) return null;

  const [type, setType] = useState('SET'); // 'SET' | 'ADD' | 'DEDUCT'
  const [quantity, setQuantity] = useState(medicine.currentStock);
  const [reason, setReason] = useState('Physical Inventory Count Discrepancy');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const current = Number(medicine.currentStock) || 0;
  const qty = parseInt(quantity, 10) || 0;

  let calculatedBalance = current;
  if (type === 'SET') {
    calculatedBalance = Math.max(0, qty);
  } else if (type === 'ADD') {
    calculatedBalance = current + qty;
  } else if (type === 'DEDUCT') {
    calculatedBalance = Math.max(0, current - qty);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (type === 'DEDUCT' && qty > current) {
      setError(`Cannot deduct ${qty} units. Current stock is only ${current}.`);
      return;
    }

    setLoading(true);
    try {
      await onAdjustSuccess({
        id: medicine.id,
        type,
        quantity: qty,
        reason,
        notes,
        performedBy: 'Chief Pharmacist P. Suresh'
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reconcile & Adjust Stock" maxWidth="550px">
      <form onSubmit={handleSubmit}>
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {medicine.brandName || medicine.name}
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>SKU: <strong>{medicine.sku}</strong></span>
            <span>Batch: <strong>{medicine.batchNumber}</strong></span>
            <span>Current Stock: <strong style={{ color: current > 0 ? 'var(--primary)' : 'var(--danger)' }}>{current} units</strong></span>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Adjustment Mode</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${type === 'SET' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setType('SET'); setQuantity(current); }}
            >
              Set Exact Count
            </button>
            <button
              type="button"
              className={`btn btn-sm ${type === 'ADD' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setType('ADD'); setQuantity(10); }}
            >
              + Add Units
            </button>
            <button
              type="button"
              className={`btn btn-sm ${type === 'DEDUCT' ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => { setType('DEDUCT'); setQuantity(1); }}
            >
              - Deduct Units
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            {type === 'SET' ? 'New Verified Physical Count' : 'Quantity to Adjust'}
          </label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Audit Reason</label>
          <select
            className="form-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          >
            <option value="Physical Inventory Count Discrepancy">Physical Inventory Count Discrepancy</option>
            <option value="Damaged Packaging / Broken Ampoule">Damaged Packaging / Broken Ampoule</option>
            <option value="Expired Stock Write-off">Expired Stock Write-off (Disposal)</option>
            <option value="Customer Return (Good Condition)">Customer Return (Good Condition)</option>
            <option value="Supplier Return / Recall">Supplier Return / Recall</option>
            <option value="Theft / Lost in Transit">Theft / Unaccounted Loss</option>
            <option value="Other Manual Correction">Other Manual Correction</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Pharmacist Notes & Justification</label>
          <textarea
            className="form-textarea"
            rows="2"
            placeholder="Add relevant inspection or reason notes for audit compliance..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 600 }}>
            Audit Result Preview:
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#047857', fontFamily: 'var(--font-mono)' }}>
            {current} &rarr; {calculatedBalance} units ({calculatedBalance - current >= 0 ? `+${calculatedBalance - current}` : calculatedBalance - current})
          </span>
        </div>

        <div className="modal-footer" style={{ padding: '0', background: 'transparent', borderTop: 'none' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <IconCheckCircle size={16} />
            <span>{loading ? 'Recording...' : 'Commit Stock Audit'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StockAdjustmentModal;
