import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Plus, X, Send, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ClientManagement = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telephone: '',
    price: 125,
    billingDay: 1,
    expirationDays: 7
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('adminAccessToken');
      
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/create-payment-link`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setPaymentLink(response.data.paymentLink);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/admin');
      } else {
        setError(err.response?.data?.message || 'Failed to create payment link');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShowCreateForm(false);
    setSuccess(false);
    setError('');
    setPaymentLink('');
    setFormData({
      name: '',
      email: '',
      telephone: '',
      price: 125,
      billingDay: 1
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink);
    alert('Payment link copied to clipboard!');
  };

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
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Plus size={18} />
                Create Payment Link
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showCreateForm ? (
          <div className="text-center py-16">
            <CreditCard size={64} className="text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Payment Links Created Yet</h2>
            <p className="text-gray-400 mb-6">
              Click "Create Payment Link" to send a subscription signup link to a new client.
            </p>
          </div>
        ) : success ? (
          <div className="bg-gray-800 rounded-xl p-8 border border-green-500/20">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-green-500/20">
                <CheckCircle size={48} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Link Sent!</h2>
              <p className="text-gray-300">
                An email has been sent to <strong className="text-green-400">{formData.email}</strong> with the payment link.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-2">Payment Link:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={paymentLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded transition-colors text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">This link expires in 24 hours</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <h3 className="text-white font-medium mb-2">Subscription Details:</h3>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Client: {formData.name}</li>
                <li>• Monthly Price: £{formData.price}</li>
                <li>• Billing Day: {formData.billingDay}{formData.billingDay === 1 ? 'st' : formData.billingDay === 2 ? 'nd' : formData.billingDay === 3 ? 'rd' : 'th'} of each month</li>
              </ul>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              Create Another Payment Link
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Create Payment Link</h2>
              <button
                onClick={handleReset}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="07123456789"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Monthly Price (£) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: £125/month</p>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Billing Day of Month *
                  </label>
                  <select
                    value={formData.billingDay}
                    onChange={(e) => setFormData({ ...formData, billingDay: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>
                        {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of the month
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Default: 1st of each month</p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>Note:</strong> The client will receive an email with a secure payment link. 
                  They'll need to complete their details and set up their payment method. 
                  The link expires in 24 hours.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Payment Link
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientManagement;
