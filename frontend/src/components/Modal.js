import React from 'react';

export default function Modal({ title, onClose, children, large }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal${large ? ' modal-lg' : ''}`}>
        <button className="modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
        {title && <div className="modal-title">{title}</div>}
        {children}
      </div>
    </div>
  );
}
