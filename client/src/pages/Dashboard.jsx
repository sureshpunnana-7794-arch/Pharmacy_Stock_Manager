import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import StatCard from '../components/StatCard';
import {
  IconPackage,
  IconDollarSign,
  IconAlertTriangle,
  IconShieldAlert,
  IconTrendingUp,
  IconActivity,
  IconShoppingCart,
  IconPlus,
  IconTruck
} from '../components/Icons';
import { formatCurrency, formatDate } from '../utils/formatters';
import api from '../services/api';

export const Dashboard = ({
  onNavigate,
  onOpenNewSale,
  onOpenAddMedicine,
  onOpenNewPurchase
}) => {
  const [stats, setStats] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, trendRes, catRes, topRes, movRes] = await Promise.all([
        api.getDashboardStats(),
        api.getSalesTrend(),
        api.getCategoryStats(),
        api.getTopSelling(),
        api.getMovements({ limit: 6 })
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (trendRes.success) setSalesTrend(trendRes.data);
      if (catRes.success) setCategoryStats(catRes.data);
      if (topRes.success) setTopSelling(topRes.data);
      if (movRes.success) setRecentMovements(movRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Loading pharmacy stock metrics...</p>
      </div>
    );
  }

  const criticalIssuesCount = (stats?.outOfStockCount || 0) + (stats?.expiredCount || 0) + (stats?.lowStockCount || 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmacy Stock Overview</h1>
          <p className="page-subtitle">
            Real-time stock valuation, inventory movements, safety alerts, and dispensing trends.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button className="btn btn-secondary" onClick={() => loadDashboardData()}>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={onOpenNewSale}>
            <IconShoppingCart size={16} />
            <span>New Sale (POS)</span>
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {criticalIssuesCount > 0 && (
        <div
          style={{
            backgroundColor: 'var(--danger-light)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ color: 'var(--danger)', display: 'flex' }}>
              <IconShieldAlert size={26} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#9f1239' }}>
                Stock & Expiry Attention Required ({criticalIssuesCount} items)
              </h4>
              <p style={{ fontSize: '0.825rem', color: '#be123c', margin: 0 }}>
                {stats.outOfStockCount > 0 && `${stats.outOfStockCount} out of stock • `}
                {stats.lowStockCount > 0 && `${stats.lowStockCount} below reorder threshold • `}
                {stats.expiredCount > 0 && `${stats.expiredCount} expired batches pending disposal`}
              </p>
            </div>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onNavigate('alerts')}
          >
            Review & Replenish Stock &rarr;
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <StatCard
          title="Total Catalog Items"
          value={stats?.totalMedicines || 0}
          subtitle={`${stats?.totalStockUnits || 0} units physically in stock`}
          icon={IconPackage}
          color="accent"
          onClick={() => onNavigate('inventory')}
        />

        <StatCard
          title="Stock Valuation (Cost)"
          value={formatCurrency(stats?.totalCostValuation || 0)}
          subtitle={`Retail MRP: ${formatCurrency(stats?.totalRetailValuation || 0)}`}
          icon={IconDollarSign}
          color="primary"
          badge={`+${formatCurrency(stats?.potentialGrossProfit || 0)} Margin`}
          badgeType="success"
        />

        <StatCard
          title="Low & Out of Stock"
          value={(stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0)}
          subtitle={`${stats?.outOfStockCount || 0} zero-stock, ${stats?.lowStockCount || 0} low-stock`}
          icon={IconAlertTriangle}
          color="warning"
          badge={stats?.outOfStockCount > 0 ? 'Stockout Alert' : 'Reorder Needed'}
          badgeType={stats?.outOfStockCount > 0 ? 'danger' : 'warning'}
          onClick={() => onNavigate('alerts')}
        />

        <StatCard
          title="Today's Dispensing"
          value={formatCurrency(stats?.todaySalesRevenue || 0)}
          subtitle={`${stats?.todaySalesCount || 0} prescription sales completed today`}
          icon={IconTrendingUp}
          color="info"
          onClick={() => onNavigate('pos')}
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
        {/* Sales & Revenue Trend */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                7-Day Dispensing & Revenue Trend
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Daily sales transactions and collected revenue
              </p>
            </div>
            <span className="badge badge-success">Live Trend</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Volume by Category */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Inventory Units by Therapeutic Category
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Active medicine stock levels categorized
              </p>
            </div>
            <span className="badge badge-neutral">Catalog Breakdown</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={categoryStats} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="category"
                  stroke="#94a3b8"
                  fontSize={10}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(val) => [`${val} units`, 'Stock']} />
                <Bar dataKey="totalStock" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dual Section: Top Selling Medicines & Recent Stock Movements */}
      <div className="grid-cols-2">
        {/* Top Selling Medicines */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Top Moving Medicines
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Highest dispensed pharmaceutical products
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('pos')}>
              View Billing &rarr;
            </button>
          </div>

          {topSelling.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No sales recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topSelling.map((item, idx) => (
                <div
                  key={item.medicineId || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        backgroundColor: idx === 0 ? '#fef08a' : idx === 1 ? '#e2e8f0' : '#ffedd5',
                        color: '#0f172a',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <h5 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                        {item.name}
                      </h5>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.totalQuantitySold} units dispensed
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(item.totalRevenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Stock Movements / Audit */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Recent Stock Movements
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Latest inward, outward, and audit transactions
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('movements')}>
              All Movements &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentMovements.slice(0, 5).map((mov) => {
              const isStockIn = mov.type === 'STOCK_IN';
              const isStockOut = mov.type === 'STOCK_OUT';
              const isDisposal = mov.type === 'DISPOSAL';

              const badgeColor = isStockIn
                ? 'success'
                : isDisposal
                ? 'danger'
                : isStockOut
                ? 'info'
                : 'warning';

              return (
                <div
                  key={mov.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fff',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge badge-${badgeColor}`} style={{ fontSize: '0.7rem' }}>
                      {mov.type.replace('_', ' ')}
                    </span>
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                        {mov.medicineName}
                      </h5>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {mov.reason} • {formatDate(mov.date, true)}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.875rem',
                      color: isStockIn ? 'var(--primary)' : 'var(--danger)'
                    }}>
                      {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} units
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                      Bal: {mov.balanceAfter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
