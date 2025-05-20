import React from 'react';
import './CalendarModal.css';

function CalendarModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal" onClick={e => e.stopPropagation()}>
        <button className="calendar-modal-close" onClick={onClose} aria-label="Close calendar">
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export default CalendarModal; 