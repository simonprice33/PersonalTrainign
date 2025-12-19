import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Plus, X, Send, CheckCircle, RefreshCw, Mail, Calendar, DollarSign, Edit, ExternalLink, XCircle } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import AlertModal from '../AlertModal';

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
  const [editingClient, setEditingClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  
  // Helper function to get status badge
  const getStatusBadge = (status, subscriptionStatus) => {
    const effectiveStatus = status || subscriptionStatus || 'pending';
    
    switch (effectiveStatus) {
      case 'active':
        return (
          <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
            ✓ Subscription Active
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
            ⊗ Subscription Suspended
          </span>
        );
      case 'cancelled':
      case 'canceled':
        return (
          <span className="inline-block px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
            ✗ Subscription Cancelled
          </span>
        );
      case 'pending':
        return (
          <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
            ⏳ Subscription Pending
          </span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">
            ? Unknown Status
          </span>
        );
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telephone: '',
    price: 125,
    billingDay: 1,
    expirationDays: 7,
    prorate: true
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      navigate('/admin');
    } else {
      fetchClients();
    }
  }, [navigate]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      // Use axiosInstance without manual token - interceptor handles it
      const response = await axiosInstance.get(`${BACKEND_URL}/api/admin/clients`);

      if (response.data.success) {
        console.log(`✅ Loaded ${response.data.clients.length} clients`);
        setClients(response.data.clients);
        setError(''); // Clear any previous errors
      }
    } catch (err) {
      console.error('❌ Failed to fetch clients:', err);
      console.error('Error response:', err.response);
      
      // If authentication fails, redirect to login
      if (err.response?.status === 401) {
        console.log('Token expired, clearing and redirecting to login');
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        navigate('/admin');
      } else {
        // Show error message to user
        setError('Failed to load clients. Please try refreshing the page.');
      }
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post(
        `${BACKEND_URL}/api/admin/create-payment-link`,
        formData
      );

      if (response.data.success) {
        setSuccess(true);
        setPaymentLink(response.data.paymentLink);
        fetchClients(); // Refresh client list
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
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
      billingDay: 1,
      expirationDays: 7,
      prorate: true
    });
  };

  const handleResendLink = async (clientEmail) => {
    setResendingEmail(clientEmail);
    setError('');

    try {
      const response = await axiosInstance.post(
        `${BACKEND_URL}/api/admin/resend-payment-link`,
        { 
          email: clientEmail,
          expirationDays: 7 
        }
      );

      if (response.data.success) {
        alert(`Payment link resent successfully to ${clientEmail}!`);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        navigate('/admin');
      } else {
        alert(err.response?.data?.message || 'Failed to resend payment link');
      }
    } finally {
      setResendingEmail(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink);
    alert('Payment link copied to clipboard!');
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setEditFormData({
      name: client.name || '',
      telephone: client.telephone || '',
      price: client.price || 125,
      billingDay: client.billingDay || 1,
      prorate: client.prorate !== undefined ? client.prorate : true,
      addressLine1: client.address_line_1 || '',
      addressLine2: client.address_line_2 || '',
      city: client.city || '',
      postcode: client.postcode || '',
      country: client.country || 'GB',
      emergencyContactName: client.emergency_contact_name || '',
      emergencyContactNumber: client.emergency_contact_number || '',
      emergencyContactRelationship: client.emergency_contact_relationship || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axiosInstance.put(
        `${BACKEND_URL}/api/admin/clients/${editingClient.email}`,
        editFormData
      );

      if (response.data.success) {
        alert('Client updated successfully!');
        setShowEditModal(false);
        setEditingClient(null);
        fetchClients(); // Refresh the list
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        navigate('/admin');
      } else {
        setError(err.response?.data?.message || 'Failed to update client');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingClient(null);
    setEditFormData({});
  };

  const handleManageBilling = async (customerId) => {
    try {
      const response = await axiosInstance.post(
        `${BACKEND_URL}/api/create-portal-session`,
        { customerId }
      );

      if (response.data.success) {
        window.open(response.data.url, '_blank');
      }
    } catch (err) {
      alert('Failed to open billing portal');
    }
  };

  const handleCancelSubscription = async (customerId, clientName) => {
    if (!window.confirm(`Cancel subscription for ${clientName}? They will retain access until the end of their billing period.`)) {
      return;
    }

    try {
      const response = await axiosInstance.post(
        `${BACKEND_URL}/api/admin/client/${customerId}/cancel-subscription`,
        {}
      );

      if (response.data.success) {
        alert(`Subscription canceled. Access until: ${new Date(response.data.endsAt).toLocaleDateString()}`);
        fetchClients();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const handleSyncStatus = async (email, name) => {
    if (!window.confirm(`Sync ${name}'s status from Stripe? This will update their local status based on their current Stripe subscription.`)) {
      return;
    }

    try {
      const response = await axiosInstance.post(
        `${BACKEND_URL}/api/admin/clients/${encodeURIComponent(email)}/sync-status`
      );

      if (response.data.success) {
        alert(`Status synced! New status: ${response.data.data.status}`);
        fetchClients();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to sync status');
    }
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showCreateForm ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Client List</h2>
              <button
                onClick={fetchClients}
                disabled={loadingClients}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} className={`text-gray-400 ${loadingClients ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingClients ? (
              <div className="text-center py-16">
                <RefreshCw size={48} className="text-gray-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-400">Loading clients...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-16">
                <CreditCard size={64} className="text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No Clients Yet</h2>
                <p className="text-gray-400 mb-6">
                  Click "Create Payment Link" to send a subscription signup link to a new client.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {clients.map((client, index) => (
                  <div 
                    key={index}
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500/30 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{client.name}</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Mail size={16} className="text-green-400" />
                            <span className="text-sm">{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <DollarSign size={16} className="text-cyan-400" />
                            <span className="text-sm">£{client.price || 125}/month</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar size={16} className="text-purple-400" />
                            <span className="text-sm">
                              Billing: {client.billingDay || 1}{(client.billingDay || 1) === 1 ? 'st' : (client.billingDay || 1) === 2 ? 'nd' : (client.billingDay || 1) === 3 ? 'rd' : 'th'} of each month
                              {client.prorate !== false && ' • Prorated'}
                            </span>
                          </div>
                          {(client.stripe_customer_id || client.customer_id) && (
                            <div className="mt-2">
                              {getStatusBadge(client.status, client.subscription_status)}
                              {client.imported_at && (
                                <span className="ml-2 text-xs text-cyan-400">
                                  (Imported from Stripe)
                                </span>
                              )}
                            </div>
                          )}
                          {!(client.stripe_customer_id || client.customer_id) && (
                            <div className="mt-2">
                              <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                                ⏳ Pending Setup
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {!(client.stripe_customer_id || client.customer_id) && (
                          <button
                            onClick={() => handleResendLink(client.email)}
                            disabled={resendingEmail === client.email}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {resendingEmail === client.email ? (
                              <>
                                <RefreshCw size={16} className="animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send size={16} />
                                Resend Link
                              </>
                            )}
                          </button>
                        )}
                        
                        {(client.stripe_customer_id || client.customer_id) && (
                          <>
                            <button
                              onClick={() => handleEditClient(client)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            {client.imported_at && (
                              <button
                                onClick={() => handleSyncStatus(client.email, client.name)}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm"
                                title="Sync status from Stripe"
                              >
                                <RefreshCw size={16} />
                                Sync
                              </button>
                            )}
                            <button
                              onClick={() => handleManageBilling(client.stripe_customer_id)}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm"
                            >
                              <ExternalLink size={16} />
                              Billing
                            </button>
                            {client.subscription_status === 'active' && !client.cancel_at_period_end && (
                              <button
                                onClick={() => handleCancelSubscription(client.stripe_customer_id, client.name)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                              >
                                <XCircle size={16} />
                                Cancel
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              <p className="text-xs text-gray-500 mt-2">This link expires in {formData.expirationDays} day{formData.expirationDays > 1 ? 's' : ''}</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <h3 className="text-white font-medium mb-2">Subscription Details:</h3>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Client: {formData.name}</li>
                <li>• Monthly Price: £{formData.price}</li>
                <li>• Billing Day: {formData.billingDay}{formData.billingDay === 1 ? 'st' : formData.billingDay === 2 ? 'nd' : formData.billingDay === 3 ? 'rd' : 'th'} of each month</li>
                <li>• Proration: {formData.prorate ? 'Enabled (prorated first charge)' : 'Disabled (full charge immediately)'}</li>
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

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Link Expiration (Days) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="30"
                    value={formData.expirationDays}
                    onChange={(e) => setFormData({ ...formData, expirationDays: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 7 days (Max: 30 days)</p>
                </div>
              </div>

              {/* Proration Toggle */}
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.prorate}
                    onChange={(e) => setFormData({ ...formData, prorate: e.target.checked })}
                    className="mt-1 w-5 h-5 bg-gray-800 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="text-gray-200 font-medium">Enable Proration</div>
                    <p className="text-xs text-gray-400 mt-1">
                      When enabled, the first charge will be prorated based on when the client signs up during the billing cycle. 
                      If disabled, they'll be charged the full monthly amount immediately.
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>Note:</strong> The client will receive an email with a secure payment link. 
                  They'll need to complete their details and set up their payment method. 
                  The link expires in {formData.expirationDays} day{formData.expirationDays > 1 ? 's' : ''}.
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

        {/* Edit Client Modal */}
        {showEditModal && editingClient && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Client</h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Telephone</label>
                      <input
                        type="tel"
                        value={editFormData.telephone}
                        onChange={(e) => setEditFormData({ ...editFormData, telephone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Subscription</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Monthly Price (£)</label>
                      <input
                        type="number"
                        min="1"
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({ ...editFormData, price: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Billing Day</label>
                      <select
                        value={editFormData.billingDay}
                        onChange={(e) => setEditFormData({ ...editFormData, billingDay: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>
                            {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Address</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      value={editFormData.addressLine1}
                      onChange={(e) => setEditFormData({ ...editFormData, addressLine1: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      value={editFormData.addressLine2}
                      onChange={(e) => setEditFormData({ ...editFormData, addressLine2: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="City"
                        value={editFormData.city}
                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      />
                      <input
                        type="text"
                        placeholder="Postcode"
                        value={editFormData.postcode}
                        onChange={(e) => setEditFormData({ ...editFormData, postcode: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={editFormData.emergencyContactName}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={editFormData.emergencyContactNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={editFormData.emergencyContactRelationship}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContactRelationship: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white mt-4"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientManagement;
