import React from 'react';
import {
  IconLayoutDashboard,
  IconPackage,
  IconShoppingCart,
  IconActivity,
  IconTruck,
  IconBuilding2,
  IconShieldAlert,
  IconRefreshCw,
  IconPill
} from './Icons';

export const Sidebar = ({ activeTab, setActiveTab, alertCount = 0, onResetDb }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
    { id: 'inventory', label: 'Inventory & Stock', icon: IconPackage },
    { id: 'pos', label: 'Point of Sale (POS)', icon: IconShoppingCart },
    { id: 'movements', label: 'Stock Movements', icon: IconActivity },
    { id: 'purchases', label: 'Stock Inward (PO)', icon: IconTruck },
    { id: 'suppliers', label: 'Suppliers Directory', icon: IconBuilding2 },
    {
      id: 'alerts',
      label: 'Stockout & Expiry Alerts',
      icon: IconShieldAlert,
      badge: alertCount > 0 ? alertCount : null,
      badgeType: 'danger'
    }
  ];

  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">
        <div className="sidebar-brand-icon">
          <IconPill size={22} />
        </div>
        <div className="sidebar-brand-text">
          <h1>PharmaStock Pro</h1>
          <p>Pharmacy Inventory ERP</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`nav-badge ${item.badgeType || ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          className="btn btn-secondary btn-sm"
          style={{
            width: '100%',
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            borderColor: '#334155'
          }}
          onClick={onResetDb}
          title="Reset sample pharmacy stock data"
        >
          <IconRefreshCw size={14} />
          <span>Reset Sample Data</span>
        </button>

        <div className="pharmacist-badge">
          <div className="pharmacist-avatar">PS</div>
          <div className="pharmacist-details" style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.825rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap' }}>
              P. Suresh
            </p>
            <p style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>
              Head Pharmacist (Admin)
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
