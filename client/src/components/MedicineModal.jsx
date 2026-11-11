import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { IconCheckCircle } from './Icons';

export const MedicineModal = ({ isOpen, onClose, medicine, suppliers = [], onSaveSuccess }) => {
  const isEdit = Boolean(medicine && medicine.id);

  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    genericName: '',
    sku: '',
    category: 'Antibiotics',
    dosageForm: 'Tablet',
    strength: '',
    batchNumber: '',
    manufacturer: '',
    supplierId: suppliers[0]?.id || '',
    supplierName: suppliers[0]?.name || '',
    expiryDate: '',
    costPrice: '',
    sellingPrice: '',
    currentStock: '0',
    minReorderLevel: '20',
    location: 'Shelf A-1',
    prescriptionRequired: false,
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (medicine && isEdit) {
      setFormData({
        name: medicine.name || '',
        brandName: medicine.brandName || medicine.name || '',
        genericName: medicine.genericName || '',
        sku: medicine.sku || '',
        category: medicine.category || 'General',
        dosageForm: medicine.dosageForm || 'Tablet',
        strength: medicine.strength || '',
        batchNumber: medicine.batchNumber || '',
        manufacturer: medicine.manufacturer || '',
        supplierId: medicine.supplierId || (suppliers[0]?.id || ''),
        supplierName: medicine.supplierName || (suppliers[0]?.name || ''),
        expiryDate: medicine.expiryDate ? medicine.expiryDate.slice(0, 10) : '',
        costPrice: medicine.costPrice !== undefined ? String(medicine.costPrice) : '',
        sellingPrice: medicine.sellingPrice !== undefined ? String(medicine.sellingPrice) : '',
        currentStock: medicine.currentStock !== undefined ? String(medicine.currentStock) : '0',
        minReorderLevel: medicine.minReorderLevel !== undefined ? String(medicine.minReorderLevel) : '20',
        location: medicine.location || 'Shelf A-1',
        prescriptionRequired: Boolean(medicine.prescriptionRequired),
        description: medicine.description || ''
      });
    } else {
      setFormData({
        name: '',
        brandName: '',
        genericName: '',
        sku: '',
        category: 'Antibiotics',
        dosageForm: 'Tablet',
        strength: '',
        batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
        manufacturer: '',
        supplierId: suppliers[0]?.id || '',
        supplierName: suppliers[0]?.name || '',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        costPrice: '',
        sellingPrice: '',
        currentStock: '50',
        minReorderLevel: '20',
        location: 'Shelf A-1',
        prescriptionRequired: false,
        description: ''
      });
    }
    setError('');
  }, [medicine, isEdit, suppliers, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'supplierId') {
      const selected = suppliers.find(s => s.id === value);
      setFormData(prev => ({
        ...prev,
        supplierId: value,
        supplierName: selected ? selected.name : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.batchNumber.trim() || !formData.expiryDate) {
      setError('Medicine name, batch number, and expiry date are required.');
      return;
    }

    if (Number(formData.sellingPrice) < Number(formData.costPrice)) {
      if (!window.confirm('Warning: Selling price is less than cost price. Do you want to proceed?')) {
        return;
      }
    }

    setLoading(true);
    try {
      await onSaveSuccess({
        ...formData,
        id: isEdit ? medicine.id : undefined,
        costPrice: parseFloat(formData.costPrice || 0),
        sellingPrice: parseFloat(formData.sellingPrice || 0),
        currentStock: parseInt(formData.currentStock || 0, 10),
        minReorderLevel: parseInt(formData.minReorderLevel || 10, 10)
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Medicine Details' : 'Add New Medicine to Catalog'}
      maxWidth="780px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Commercial Brand Name *</label>
            <input
              type="text"
              name="brandName"
              className="form-input"
              placeholder="e.g. Augmentin 625 Duo, Dolo 650"
              value={formData.brandName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Official / Chemical Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Amoxicillin & Clavulanate Potassium"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Analgesics & Antipyretics">Analgesics & Antipyretics</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Diabetes Care">Diabetes Care</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
              <option value="Respiratory">Respiratory</option>
              <option value="Allergy & Cold">Allergy & Cold</option>
              <option value="Dermatological & First Aid">Dermatological & First Aid</option>
              <option value="Vitamins & Supplements">Vitamins & Supplements</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Dosage Form</label>
            <select name="dosageForm" className="form-select" value={formData.dosageForm} onChange={handleChange}>
              <option value="Tablet">Tablet</option>
              <option value="Capsule">Capsule</option>
              <option value="Syrup">Syrup (Liquid)</option>
              <option value="Injection">Injection / Vial</option>
              <option value="Ointment">Ointment / Gel</option>
              <option value="Inhaler">Inhaler / Respules</option>
              <option value="Drops">Eye/Ear Drops</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Strength / Pack Size</label>
            <input
              type="text"
              name="strength"
              className="form-input"
              placeholder="e.g. 625 mg, 100 ml"
              value={formData.strength}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Batch Number *</label>
            <input
              type="text"
              name="batchNumber"
              className="form-input"
              placeholder="e.g. AUG-2026-X8"
              value={formData.batchNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">SKU / Item Code</label>
            <input
              type="text"
              name="sku"
              className="form-input"
              placeholder="e.g. MED-AUG-625"
              value={formData.sku}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expiry Date *</label>
            <input
              type="date"
              name="expiryDate"
              className="form-input"
              value={formData.expiryDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Cost Price (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="costPrice"
              className="form-input"
              placeholder="0.00"
              value={formData.costPrice}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Selling MRP (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="sellingPrice"
              className="form-input"
              placeholder="0.00"
              value={formData.sellingPrice}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Stock</label>
            <input
              type="number"
              min="0"
              name="currentStock"
              className="form-input"
              value={formData.currentStock}
              onChange={handleChange}
              disabled={isEdit} // Existing items should use Stock Adjustment to keep audit logs
              title={isEdit ? 'Use Adjust Stock action to modify active stock' : ''}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Min Reorder Level</label>
            <input
              type="number"
              min="1"
              name="minReorderLevel"
              className="form-input"
              value={formData.minReorderLevel}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Supplier Distributor</label>
            <select name="supplierId" className="form-select" value={formData.supplierId} onChange={handleChange}>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Shelf / Bin Location</label>
            <input
              type="text"
              name="location"
              className="form-input"
              placeholder="e.g. Shelf A-1, Cold Refrig 2"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Manufacturer</label>
            <input
              type="text"
              name="manufacturer"
              className="form-input"
              placeholder="e.g. GlaxoSmithKline"
              value={formData.manufacturer}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.65rem', margin: '0.5rem 0 1rem' }}>
          <input
            type="checkbox"
            id="rxRequired"
            name="prescriptionRequired"
            checked={formData.prescriptionRequired}
            onChange={handleChange}
            style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
          />
          <label htmlFor="rxRequired" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
            Requires Doctor's Prescription (Schedule H / Rx Drug)
          </label>
        </div>

        <div className="modal-footer" style={{ padding: '0', background: 'transparent', borderTop: 'none' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <IconCheckCircle size={16} />
            <span>{loading ? 'Saving...' : isEdit ? 'Update Medicine' : 'Save to Catalog'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MedicineModal;
