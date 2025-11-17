import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Plus } from 'lucide-react';

const ClientManagement = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gray-800 border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/dashboard"
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="text-white" size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <CreditCard size={28} />
                  Client Management
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Create payment links and manage client subscriptions
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Create Payment Link
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <CreditCard size={64} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Client Management Coming Soon</h2>
          <p className="text-gray-400 mb-6">
            The complete Stripe integration is being implemented. <br/>
            This will include creating payment links, managing subscriptions, and viewing clients.
          </p>
          <p className="text-cyan-500 text-sm">
            Implementation in progress...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;
