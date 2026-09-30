import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString, pattern = 'MMM dd, yyyy') {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(date) ? format(date, pattern) : '-';
  } catch {
    return '-';
  }
}

export function formatDateTime(dateString) {
  return formatDate(dateString, 'MMM dd, yyyy HH:mm');
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('en-US').format(num);
}

export function getStatusColor(status) {
  const colors = {
    // Purchase statuses
    PENDING: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'danger',

    // Transfer statuses
    REQUESTED: 'warning',
    APPROVED: 'info',
    IN_TRANSIT: 'info',
    RECEIVED: 'success',

    // Assignment statuses
    ACTIVE: 'info',
    RETURNED: 'success',
    OVERDUE: 'danger',
    LOST: 'danger',

    // Asset statuses
    AVAILABLE: 'success',
    ASSIGNED: 'info',
    MAINTENANCE: 'warning',
    EXPENDED: 'danger',
    DISPOSED: 'danger',

    // Personnel/User statuses
    ACTIVE: 'success',
    INACTIVE: 'gray',
  };

  return colors[status] || 'gray';
}

export function getRoleLabel(role) {
  const labels = {
    ADMIN: 'Administrator',
    BASE_COMMANDER: 'Base Commander',
    LOGISTICS_OFFICER: 'Logistics Officer',
  };
  return labels[role] || role;
}

export function getReasonLabel(reason) {
  const labels = {
    TRAINING: 'Training',
    OPERATIONS: 'Operations',
    TESTING: 'Testing',
    DISPOSAL: 'Disposal',
    DAMAGED: 'Damaged',
    EXPIRED: 'Expired',
    OTHER: 'Other',
  };
  return labels[reason] || reason;
}

export function getCategoryLabel(category) {
  const labels = {
    WEAPON: 'Weapon',
    VEHICLE: 'Vehicle',
    AMMUNITION: 'Ammunition',
    COMMUNICATION: 'Communication',
    ENGINEERING: 'Engineering',
    MEDICAL: 'Medical',
    OTHER: 'Other',
  };
  return labels[category] || category;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15);
}