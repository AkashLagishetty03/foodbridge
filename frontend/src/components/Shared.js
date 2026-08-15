import React from 'react';

// ── Loading Spinner ─────────────────────────────────
export const Spinner = ({ size = 32 }) => (
  <div className="loading-center">
    <div className="spinner" style={{ width: size, height: size }} />
  </div>
);

// ── Alert ────────────────────────────────────────────
export const Alert = ({ type = 'error', children }) => (
  <div className={`alert alert-${type}`}>
    <span>{type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
    <span>{children}</span>
  </div>
);

// ── Badge ─────────────────────────────────────────────
export const Badge = ({ status }) => (
  <span className={`badge badge-${status}`}>
    {status === 'available' && '🟢'}
    {status === 'requested' && '🟡'}
    {status === 'completed' && '🔵'}
    {status === 'expired' && '⚫'}
    {status === 'pending' && '🟡'}
    {status === 'accepted' && '🟢'}
    {status === 'rejected' && '🔴'}
    {' '}{status}
  </span>
);

// ── Modal ─────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ── Confirm Dialog ─────────────────────────────────────
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', dangerous = false }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className={`btn ${dangerous ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </>
    }
  >
    <p style={{ color: 'var(--gray-600)', fontSize: '14px', lineHeight: '1.5' }}>{message}</p>
  </Modal>
);

// ── Empty State ────────────────────────────────────────
export const EmptyState = ({ icon = '📭', message = 'Nothing here yet.', action }) => (
  <div className="empty-state">
    <span className="empty-icon">{icon}</span>
    <p>{message}</p>
    {action && <div style={{ marginTop: '16px' }}>{action}</div>}
  </div>
);

// ── Pagination ─────────────────────────────────────────
export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages } = pagination;
  return (
    <div className="flex items-center gap-2 justify-between" style={{ marginTop: '16px' }}>
      <span className="text-sm text-gray">
        Page {page} of {pages} ({pagination.total} total)
      </span>
      <div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ← Prev
        </button>
        <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
};

// ── Role Badge ─────────────────────────────────────────
export const RoleBadge = ({ role }) => (
  <span className={`badge badge-${role}`}>{role}</span>
);

// ── Format helpers ─────────────────────────────────────
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const isExpired = (date) => date && new Date(date) < new Date();
