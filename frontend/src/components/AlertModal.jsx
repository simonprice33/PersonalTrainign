import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const AlertModal = ({ show, onClose, title, message, type = 'info' }) => {
  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={48} className="text-green-400" />;
      case 'error':
        return <XCircle size={48} className="text-red-400" />;
      case 'warning':
        return <AlertCircle size={48} className="text-yellow-400" />;
      default:
        return <Info size={48} className="text-cyan-400" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-500/30';
      case 'error':
        return 'border-red-500/30';
      case 'warning':
        return 'border-yellow-500/30';
      default:
        return 'border-cyan-500/30';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-cyan-500 hover:bg-cyan-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-800 rounded-2xl border ${getBorderColor()} w-full max-w-md shadow-2xl`}>
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              {getIcon()}
            </div>
            {title && (
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            )}
            <p className="text-gray-300 mb-6">{message}</p>
            <button
              onClick={onClose}
              className={`w-full py-3 px-6 ${getButtonColor()} text-white font-semibold rounded-lg transition-colors`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
