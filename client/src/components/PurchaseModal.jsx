import React, { useState } from 'react';
import Modal from './Modal';
import { IconPlus, IconTrash2, IconCheckCircle } from './Icons';
import { formatCurrency } from '../utils/formatters';

export const PurchaseModal = ({ isOpen, onClose, medicines = [], suppliers = [], onSaveSuccess }) => {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [invoiceReference, setInvoiceReference] = useState(`INV-SUP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [items, setItems] = useState([
    {
      medicineId: medicines[0]?.id || '',
      quantity: 50,
      costPrice: medicines[0]?.costPrice || 50,
      sellingPrice: medicines[0]?.sellingPrice || 75,
      batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    }
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'medicineId') {
      const selectedMed = medicines.find(m => m.id === value);
      if (selectedMed) {
        updated[index].costPrice = selectedMed.costPrice;
        updated[index].sellingPrice = selectedMed.sellingPrice;
        updated[index].batchNumber = selectedMed.batchNumber;
        updated[index].expiryDate = selectedMed.expiryDate ? selectedMed.expiryDate.slice(0, 10) : '';
      }
    }
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        medicineId: medicines[0]?.id || '',
        quantity: 25,
        costPrice: medicines[0]?.costPrice || 50,
        sellingPrice: medicines[0]?.sellingPrice || 75,
        batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.costPrice) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Please add at least one line item');
      return;
    }

    setLoading(true);
    try {
      const selectedSupplier = suppliers.find(s => s.id === supplierId);
      await onSaveSuccess({
        supplierId,
        supplierName: selectedSupplier ? selectedSupplier.name : 'Pharma Distributor',
        invoiceReference,
        items,
        notes,
        receivedBy: 'Chief Pharmacist P. Suresh'
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record inward stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Inward Goods Receipt (Purchase Order)"
      maxWidth="850px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Pharma Distributor / Supplier *</label>
            <select
              className="form-select"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.contactPerson})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Vendor Invoice / DC Number *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. INV-APEX-8901"
              value={invoiceReference}
              onChange={(e) => setInvoiceReference(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Inward Medicine Items
            </h4>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
              <IconPlus size={14} />
              <span>Add Another Item</span>
            </button>
          </div>

          <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <table className="data-table" style={{ fontSize: '0.825rem' }}>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th style={{ width: 110 }}>Batch No</th>
                  <th style={{ width: 130 }}>Expiry</th>
                  <th style={{ width: 80 }}>Qty</th>
                  <th style={{ width: 90 }}>Cost (₹)</th>
                  <th style={{ width: 90 }}>Total</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.costPrice) || 0);
                  return (
                    <tr key={index}>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          value={item.medicineId}
                          onChange={(e) => handleItemChange(index, 'medicineId', e.target.value)}
                          required
                        >
                          {medicines.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.brandName || m.name} (Stock: {m.currentStock})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          value={item.batchNumber}
                          onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="form-input"
                          style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          value={item.expiryDate}
                          onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input"
                          style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          value={item.costPrice}
                          onChange={(e) => handleItemChange(index, 'costPrice', e.target.value)}
                          required
                        />
                      </td>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(lineTotal)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          style={{ width: 28, height: 28, padding: 0 }}
                          onClick={() => handleRemoveItem(index)}
                          disabled={items.length === 1}
                        >
                          <IconTrash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Items: </span>
            <strong style={{ color: 'var(--text-main)' }}>{items.length} line items</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.75rem' }}>Total Purchase Cost:</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(grandTotal)}
            </strong>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Inward Inspection Notes</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Cartons undamaged, cold chain temp verified 4°C"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ padding: '0', background: 'transparent', borderTop: 'none' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <IconCheckCircle size={16} />
            <span>{loading ? 'Receiving Goods...' : 'Confirm Inward Stock Entry'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PurchaseModal;
