import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConfirmModal = ({ show, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
  if (!show) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          border: 'border-red-500/30',
          confirmBtn: 'bg-red-500 hover:bg-red-600'
        };
      case 'warning':
        return {
          border: 'border-yellow-500/30',
          confirmBtn: 'bg-yellow-500 hover:bg-yellow-600'
        };
      default:
        return {
          border: 'border-cyan-500/30',
          confirmBtn: 'bg-cyan-500 hover:bg-cyan-600'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-800 rounded-2xl border ${colors.border} w-full max-w-md shadow-2xl`}>
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <AlertCircle size={48} className="text-yellow-400" />
            </div>
            {title && (
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            )}
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-3 px-6 ${colors.confirmBtn} text-white font-semibold rounded-lg transition-colors`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
