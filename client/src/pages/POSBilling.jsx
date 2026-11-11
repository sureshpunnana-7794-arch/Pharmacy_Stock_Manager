import React, { useState, useEffect } from 'react';
import {
  IconSearch,
  IconShoppingCart,
  IconTrash2,
  IconPrinter,
  IconPlus,
  IconCheckCircle,
  IconShieldAlert,
  IconDollarSign
} from '../components/Icons';
import { formatCurrency, formatDate, getExpiryStatus } from '../utils/formatters';
import api from '../services/api';

export const POSBilling = ({
  medicines = [],
  onSaleCompleted,
  onViewReceipt
}) => {
  const [activeSubTab, setActiveSubTab] = useState('new-sale'); // 'new-sale' | 'past-sales'
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [taxPercent, setTaxPercent] = useState('5');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Past sales list
  const [pastSales, setPastSales] = useState([]);
  const [pastSalesSearch, setPastSalesSearch] = useState('');

  useEffect(() => {
    if (activeSubTab === 'past-sales') {
      loadPastSales();
    }
  }, [activeSubTab]);

  const loadPastSales = async () => {
    try {
      const res = await api.getSales();
      if (res.success) setPastSales(res.data);
    } catch (err) {
      console.error('Failed to load sales history:', err);
    }
  };

  // Add medicine to cart
  const addToCart = (med) => {
    setError('');

    // Safety check 1: Expiry
    if (med.isExpired) {
      setError(`PATIENT SAFETY ALERT: Batch "${med.batchNumber}" of "${med.brandName || med.name}" has expired! Cannot be added to bill.`);
      return;
    }

    // Safety check 2: Zero stock
    if (med.currentStock <= 0) {
      setError(`"${med.brandName || med.name}" is completely out of stock.`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.medicineId === med.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > med.currentStock) {
        setError(`Cannot add more. Only ${med.currentStock} units available in stock.`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          medicineId: med.id,
          name: med.brandName || med.name,
          genericName: med.genericName,
          sku: med.sku,
          batchNumber: med.batchNumber,
          expiryDate: med.expiryDate,
          unitPrice: med.sellingPrice,
          availableStock: med.currentStock,
          quantity: 1
        }
      ]);
    }
  };

  const updateQuantity = (index, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(index);
      return;
    }
    const item = cart[index];
    if (qty > item.availableStock) {
      setError(`Maximum stock available for ${item.name} is ${item.availableStock} units.`);
      return;
    }
    setError('');
    const updated = [...cart];
    updated[index].quantity = qty;
    setCart(updated);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discPct = Math.max(0, Math.min(100, parseFloat(discountPercent) || 0));
  const discountAmount = (subtotal * discPct) / 100;
  const taxable = subtotal - discountAmount;
  const txPct = Math.max(0, parseFloat(taxPercent) || 0);
  const taxAmount = (taxable * txPct) / 100;
  const totalAmount = taxable + taxAmount;

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');

    if (cart.length === 0) {
      setError('Cart is empty. Add medicines from the left panel to proceed.');
      return;
    }

    setLoading(true);
    try {
      const salePayload = {
        customerName: customerName.trim() || 'Walk-in Patient',
        customerPhone: customerPhone.trim(),
        doctorName: doctorName.trim(),
        items: cart.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        discountPercent: discPct,
        taxPercent: txPct,
        paymentMethod,
        notes,
        pharmacistName: 'P. Suresh (Chief Pharmacist)'
      };

      const res = await api.createSale(salePayload);
      if (res.success) {
        // Reset cart
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setDoctorName('');
        setNotes('');
        setDiscountPercent('0');

        onSaleCompleted(res.data);
      }
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.brandName && m.brandName.toLowerCase().includes(q)) ||
      (m.genericName && m.genericName.toLowerCase().includes(q)) ||
      (m.sku && m.sku.toLowerCase().includes(q)) ||
      (m.batchNumber && m.batchNumber.toLowerCase().includes(q))
    );
  });

  const filteredPastSales = pastSales.filter(s => {
    if (!pastSalesSearch) return true;
    const q = pastSalesSearch.toLowerCase().trim();
    return (
      s.invoiceNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.customerPhone && s.customerPhone.includes(q)) ||
      (s.doctorName && s.doctorName.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Point of Sale (POS) & Billing</h1>
          <p className="page-subtitle">
            Dispense prescriptions, verify batch safety, auto-deduct live inventory, and generate tax receipts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${activeSubTab === 'new-sale' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('new-sale')}
          >
            <IconShoppingCart size={16} />
            <span>Active Billing Terminal</span>
          </button>
          <button
            className={`btn ${activeSubTab === 'past-sales' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('past-sales')}
          >
            <IconPrinter size={16} />
            <span>Past Invoices Archive</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'new-sale' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Medicine Catalog */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              Select Medicine / Prescription Drugs
            </h3>

            {/* Search Box */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <div style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-light)' }}>
                <IconSearch size={17} />
              </div>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="Search drug by brand, generic, or SKU barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Medicine List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '560px', overflowY: 'auto' }}>
              {filteredMedicines.map((med) => {
                const expiryStat = getExpiryStatus(med.expiryDate);
                const isOutOfStock = med.currentStock <= 0;
                const isBlocked = med.isExpired || isOutOfStock;

                return (
                  <div
                    key={med.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: med.isExpired ? '#fff1f2' : isOutOfStock ? '#f8fafc' : '#ffffff',
                      border: `1px solid ${med.isExpired ? 'var(--danger-border)' : 'var(--border-color)'}`,
                      opacity: isOutOfStock ? 0.65 : 1
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {med.brandName || med.name}
                        </span>
                        {med.prescriptionRequired && (
                          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Rx</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {med.dosageForm} • {med.strength} • Batch: {med.batchNumber}
                      </div>
                      <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.2rem', fontSize: '0.72rem' }}>
                        <span style={{ color: isOutOfStock ? 'var(--danger)' : 'var(--primary)', fontWeight: 600 }}>
                          Stock: {med.currentStock} units
                        </span>
                        <span className={`badge badge-${expiryStat.level}`} style={{ fontSize: '0.65rem' }}>
                          {expiryStat.label}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {formatCurrency(med.sellingPrice)}
                      </span>
                      <button
                        type="button"
                        className={`btn btn-sm ${isBlocked ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ fontSize: '0.775rem', padding: '0.3rem 0.75rem' }}
                        disabled={isBlocked}
                        onClick={() => addToCart(med)}
                        title={med.isExpired ? 'Batch expired! Cannot dispense.' : isOutOfStock ? 'Out of stock' : 'Add to bill'}
                      >
                        <IconPlus size={13} />
                        <span>{med.isExpired ? 'Expired' : isOutOfStock ? 'Sold Out' : 'Add to Bill'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Billing Terminal */}
          <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Invoice Checkout</span>
              <span className="badge badge-primary">{cart.length} items</span>
            </h3>

            {error && (
              <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Cart Items Table */}
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <IconShoppingCart size={32} className="mx-auto text-light" style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>Cart is Empty</p>
                <p style={{ fontSize: '0.8rem' }}>Click "+ Add to Bill" on any medicine to begin invoice.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', maxHeight: '240px', overflowY: 'auto' }}>
                {cart.map((item, idx) => (
                  <div
                    key={item.medicineId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Batch: {item.batchNumber} • {formatCurrency(item.unitPrice)}/ea
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: '0 0.75rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        style={{ width: 24, height: 24, fontSize: '0.8rem', padding: 0 }}
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', minWidth: 24, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        style={{ width: 24, height: 24, fontSize: '0.8rem', padding: 0 }}
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '70px' }}>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      style={{ width: 26, height: 26, marginLeft: '0.4rem', color: 'var(--danger)' }}
                      onClick={() => removeFromCart(idx)}
                      title="Remove"
                    >
                      <IconTrash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleCheckout}>
              {/* Customer and Doctor Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.775rem' }}>Customer / Patient Name</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.825rem' }}
                    placeholder="e.g. Ramesh Gupta"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.775rem' }}>Customer Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.825rem' }}
                    placeholder="e.g. +91 98711 22334"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.775rem' }}>Prescribing Doctor (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.825rem' }}
                    placeholder="e.g. Dr. K. Srinivas"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.775rem' }}>Payment Method</label>
                  <select
                    className="form-select"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.825rem' }}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>
              </div>

              {/* Tax & Discount Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.775rem' }}>Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.825rem' }}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.775rem' }}>GST / Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.825rem' }}
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                  />
                </div>
              </div>

              {/* Pricing Totals Box */}
              <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: 'var(--success)' }}>
                    <span>Discount ({discPct}%):</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  <span>Taxes ({txPct}%):</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>+{formatCurrency(taxAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '2px solid var(--border-color)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  <span>Total Due:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
                disabled={loading || cart.length === 0}
              >
                <IconCheckCircle size={18} />
                <span>{loading ? 'Processing Dispensation...' : 'Complete Sale & Print Receipt'}</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Past Sales Archive Tab */
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Completed Dispensing & Sales Receipts ({pastSales.length})
            </h3>

            <div style={{ width: '300px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search invoice number, patient, phone..."
                value={pastSalesSearch}
                onChange={(e) => setPastSalesSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date & Time</th>
                  <th>Customer / Patient</th>
                  <th>Doctor</th>
                  <th>Payment</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPastSales.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      No sales records found.
                    </td>
                  </tr>
                ) : (
                  filteredPastSales.map((sale) => (
                    <tr key={sale.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                        {sale.invoiceNumber}
                      </td>
                      <td>{formatDate(sale.date, true)}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{sale.customerName}</div>
                        {sale.customerPhone && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sale.customerPhone}</div>
                        )}
                      </td>
                      <td>{sale.doctorName || 'Walk-in'}</td>
                      <td>
                        <span className="badge badge-neutral">{sale.paymentMethod}</span>
                      </td>
                      <td>{sale.items ? sale.items.length : 0} drugs</td>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onViewReceipt(sale)}
                        >
                          <IconPrinter size={13} />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSBilling;
