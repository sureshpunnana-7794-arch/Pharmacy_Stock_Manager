import React from 'react';
import Modal from './Modal';
import { IconPrinter, IconCheckCircle } from './Icons';
import { formatCurrency, formatDate } from '../utils/formatters';

export const ReceiptModal = ({ isOpen, onClose, sale }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tax Invoice & Sales Receipt" maxWidth="680px" isPrint={true}>
      <div className="printable-invoice" style={{ fontFamily: 'var(--font-sans)', color: '#0f172a' }}>
        {/* Pharmacy Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            PharmaStock Pro Central Dispensary
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0' }}>
            Govt. Licensed Retail & Clinical Pharmacy • DL No: 20B/21B-TS-5542
          </p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            GSTIN: 36AAACA1234F1Z8 • Phone: +91 98765 43210 • 24/7 Helpline
          </p>
        </div>

        {/* Invoice Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          <div>
            <p style={{ color: '#64748b' }}>Invoice No: <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{sale.invoiceNumber}</strong></p>
            <p style={{ color: '#64748b' }}>Date & Time: <strong style={{ color: '#0f172a' }}>{formatDate(sale.date, true)}</strong></p>
            <p style={{ color: '#64748b' }}>Payment Mode: <strong style={{ color: '#059669' }}>{sale.paymentMethod}</strong></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#64748b' }}>Patient / Customer: <strong style={{ color: '#0f172a' }}>{sale.customerName || 'Walk-in Customer'}</strong></p>
            {sale.customerPhone && <p style={{ color: '#64748b' }}>Phone: <strong style={{ color: '#0f172a' }}>{sale.customerPhone}</strong></p>}
            {sale.doctorName && <p style={{ color: '#64748b' }}>Consulting Doctor: <strong style={{ color: '#0f172a' }}>{sale.doctorName}</strong></p>}
          </div>
        </div>

        {/* Itemized Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem 0.25rem' }}>#</th>
              <th style={{ padding: '0.5rem' }}>Medicine & Generic</th>
              <th style={{ padding: '0.5rem' }}>Batch</th>
              <th style={{ padding: '0.5rem' }}>Exp</th>
              <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>MRP</th>
              <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items && sale.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.5rem 0.25rem', color: '#64748b' }}>{idx + 1}</td>
                <td style={{ padding: '0.5rem' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.medicineName}</div>
                  {item.genericName && (
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.genericName}</div>
                  )}
                </td>
                <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  {item.batchNumber || 'N/A'}
                </td>
                <td style={{ padding: '0.5rem', fontSize: '0.75rem' }}>
                  {item.expiryDate ? formatDate(item.expiryDate) : 'N/A'}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600 }}>
                  {item.quantity}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(item.unitPrice)}
                </td>
                <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <div style={{ width: '260px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#64748b' }}>
              <span>Subtotal:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(sale.subtotal)}</span>
            </div>
            {Number(sale.discountAmount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#16a34a' }}>
                <span>Discount ({sale.discountPercent}%):</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-{formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#64748b' }}>
              <span>GST / Taxes ({sale.taxPercent}%):</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>+{formatCurrency(sale.taxAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '2px solid #0f172a', marginTop: '0.25rem', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              <span>Total Paid:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#059669' }}>{formatCurrency(sale.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem', color: '#64748b' }}>
          <div>
            <p>• Goods once sold cannot be returned without original cash memo & batch verification.</p>
            <p>• Store medications in a cool, dry place away from direct sunlight.</p>
            <p>• Dispensed by: <strong>{sale.pharmacistName || 'P. Suresh (Chief Pharmacist)'}</strong></p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '120px' }}>
            <div style={{ height: '35px' }}></div>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.25rem', fontWeight: 600 }}>
              Authorized Pharmacist
            </div>
          </div>
        </div>
      </div>

      <div className="modal-footer no-print" style={{ marginTop: '1.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
        <button type="button" className="btn btn-primary" onClick={handlePrint}>
          <IconPrinter size={16} />
          <span>Print Tax Invoice</span>
        </button>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
