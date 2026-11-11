import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { IconCheckCircle } from './Icons';

export const SupplierModal = ({ isOpen, onClose, supplier, onSaveSuccess }) => {
  const isEdit = Boolean(supplier && supplier.id);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    paymentTerms: 'Net 30 Days'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (supplier && isEdit) {
      setFormData({
        name: supplier.name || '',
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        gstin: supplier.gstin || '',
        paymentTerms: supplier.paymentTerms || 'Net 30 Days'
      });
    } else {
      setFormData({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        gstin: '',
        paymentTerms: 'Net 30 Days'
      });
    }
    setError('');
  }, [supplier, isEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Supplier name and contact phone are required.');
      return;
    }

    setLoading(true);
    try {
      await onSaveSuccess({
        ...formData,
        id: isEdit ? supplier.id : undefined
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Supplier Details' : 'Register New Pharmaceutical Distributor'}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Distributor / Supplier Company Name *</label>
          <input
            type="text"
            name="name"
            className="form-input"
            placeholder="e.g. Apex Pharma Distributors"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Primary Contact Person</label>
            <input
              type="text"
              name="contactPerson"
              className="form-input"
              placeholder="e.g. Dr. Rajesh Sharma"
              value={formData.contactPerson}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="e.g. orders@apexpharma.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">GSTIN / Drug License No</label>
            <input
              type="text"
              name="gstin"
              className="form-input"
              placeholder="e.g. 36AAACA1234F1Z8"
              value={formData.gstin}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Warehouse / Office Address</label>
          <input
            type="text"
            name="address"
            className="form-input"
            placeholder="e.g. Plot 45, Industrial Estate, Sector 18"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Payment Terms</label>
          <select name="paymentTerms" className="form-select" value={formData.paymentTerms} onChange={handleChange}>
            <option value="Immediate / Cash">Immediate / Cash</option>
            <option value="Net 15 Days">Net 15 Days</option>
            <option value="Net 30 Days">Net 30 Days</option>
            <option value="Net 45 Days">Net 45 Days</option>
            <option value="Net 60 Days">Net 60 Days</option>
          </select>
        </div>

        <div className="modal-footer" style={{ padding: '0', background: 'transparent', borderTop: 'none' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <IconCheckCircle size={16} />
            <span>{loading ? 'Saving...' : isEdit ? 'Update Supplier' : 'Register Supplier'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SupplierModal;
