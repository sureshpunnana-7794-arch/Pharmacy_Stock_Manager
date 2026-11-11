import React, { useState } from 'react';
import {
  IconBuilding2,
  IconPlus,
  IconEdit3,
  IconTrash2,
  IconSearch,
  IconTruck
} from '../components/Icons';
import api from '../services/api';

export const Suppliers = ({
  suppliers = [],
  loading = false,
  onOpenAddSupplier,
  onOpenEditSupplier,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = suppliers.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.gstin && s.gstin.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      try {
        await api.deleteSupplier(id);
        onRefresh();
      } catch (err) {
        alert(err.message || 'Failed to delete supplier');
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmaceutical Distributors & Suppliers</h1>
          <p className="page-subtitle">
            Maintain authorized pharmaceutical suppliers, drug licenses, contact information, and payment terms.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddSupplier}>
          <IconPlus size={16} />
          <span>Register New Supplier</span>
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <div style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-light)' }}>
            <IconSearch size={17} />
          </div>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search suppliers by name, contact, phone, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid-cols-2" style={{ gap: '1.25rem' }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            No distributors found matching your search.
          </div>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#eef2ff',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconBuilding2 size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                        {s.name}
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Contact: <strong>{s.contactPerson || 'N/A'}</strong>
                      </span>
                    </div>
                  </div>

                  <span className="badge badge-success">{s.status || 'Active'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8rem', margin: '0.75rem 0', color: 'var(--text-main)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Phone: </span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{s.phone}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Email: </span>
                    <span>{s.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>GSTIN / DL: </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{s.gstin || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Terms: </span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{s.paymentTerms}</span>
                  </div>
                </div>

                {s.address && (
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.4rem 0 0.75rem' }}>
                    📍 {s.address}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                  {s.medicinesCount || 0} active catalog drugs
                </span>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon"
                    style={{ width: 32, height: 32 }}
                    onClick={() => onOpenEditSupplier(s)}
                    title="Edit supplier"
                  >
                    <IconEdit3 size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon"
                    style={{ width: 32, height: 32, color: 'var(--danger)' }}
                    onClick={() => handleDelete(s.id, s.name)}
                    title="Delete supplier"
                  >
                    <IconTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Suppliers;
