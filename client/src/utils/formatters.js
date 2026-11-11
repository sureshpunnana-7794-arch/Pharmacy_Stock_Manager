export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
};

export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  if (includeTime) {
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return 999;
  const expiry = new Date(expiryDate).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  const diffMs = expiry - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const getExpiryStatus = (expiryDate) => {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) {
    return { status: 'EXPIRED', label: `Expired ${Math.abs(days)}d ago`, level: 'danger' };
  }
  if (days <= 30) {
    return { status: 'CRITICAL', label: `Expires in ${days}d`, level: 'danger' };
  }
  if (days <= 90) {
    return { status: 'WARNING', label: `Expires in ${days}d`, level: 'warning' };
  }
  return { status: 'GOOD', label: `Expires ${formatDate(expiryDate)}`, level: 'success' };
};

export const getStockStatus = (currentStock, minReorderLevel) => {
  const stock = Number(currentStock) || 0;
  const min = Number(minReorderLevel) || 10;

  if (stock <= 0) {
    return { status: 'OUT_OF_STOCK', label: 'Out of Stock', level: 'danger' };
  }
  if (stock <= min) {
    return { status: 'LOW_STOCK', label: `Low Stock (${stock}/${min})`, level: 'warning' };
  }
  return { status: 'IN_STOCK', label: `${stock} in Stock`, level: 'success' };
};
