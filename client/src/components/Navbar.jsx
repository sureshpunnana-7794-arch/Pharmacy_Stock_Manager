import React, { useState, useEffect } from 'react';
import {
  IconPlus,
  IconShoppingCart,
  IconShieldAlert,
  IconTruck
} from './Icons';

export const Navbar = ({
  alertCount = 0,
  onOpenNewSale,
  onOpenAddMedicine,
  onOpenNewPurchase,
  onOpenAlerts
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <header className="top-navbar no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Central Dispensary & Store
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {formattedDate} • <span style={{ fontFamily: 'var(--font-mono)' }}>{formattedTime}</span>
          </span>
        </div>

        {alertCount > 0 && (
          <button
            className="badge badge-danger cursor-pointer"
            onClick={onOpenAlerts}
            style={{ border: 'none', cursor: 'pointer', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          >
            <IconShieldAlert size={14} />
            <span>{alertCount} Critical Stock/Expiry Alerts</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenNewPurchase}
        >
          <IconTruck size={15} />
          <span>Inward Stock</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenAddMedicine}
        >
          <IconPlus size={15} />
          <span>New Medicine</span>
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={onOpenNewSale}
        >
          <IconShoppingCart size={15} />
          <span>New Sale (POS)</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
