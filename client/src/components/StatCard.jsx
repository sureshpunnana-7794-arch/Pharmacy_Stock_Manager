import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeType = 'neutral',
  color = 'primary',
  onClick
}) => {
  const colorMap = {
    primary: {
      bg: 'rgba(16, 185, 129, 0.1)',
      text: '#059669',
      border: '#10b981'
    },
    danger: {
      bg: 'rgba(225, 29, 72, 0.1)',
      text: '#e11d48',
      border: '#f43f5e'
    },
    warning: {
      bg: 'rgba(217, 119, 6, 0.1)',
      text: '#d97706',
      border: '#f59e0b'
    },
    accent: {
      bg: 'rgba(79, 70, 229, 0.1)',
      text: '#4f46e5',
      border: '#6366f1'
    },
    info: {
      bg: 'rgba(2, 132, 199, 0.1)',
      text: '#0284c7',
      border: '#38bdf8'
    }
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <div
      className={`card ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{
        borderLeft: `4px solid ${scheme.border}`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              backgroundColor: scheme.bg,
              color: scheme.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {value}
        </h3>
        {badge && (
          <span className={`badge badge-${badgeType}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
