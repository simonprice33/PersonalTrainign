import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, RefreshCw, CheckCircle, XCircle, AlertCircle, Edit2, Save, X, Mail } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ImportCustomers = () => {
  const navigate = useNavigate();
  const [customerIds, setCustomerIds] = useState('');
  const [fetchedCustomers, setFetchedCustomers] = useState([]);
  const [fetchErrors, setFetchErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleFetchCustomers = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFetchedCustomers([]);
    setFetchErrors([]);
    setLoading(true);

    try {
      const token = localStorage.getItem('adminAccessToken');
      
      // Parse customer IDs (support comma, space, or newline separated)
      const ids = customerIds
        .split(/[\s,\n]+/)
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (ids.length === 0) {
        setError('Please enter at least one Stripe Customer ID');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/admin/import-customers/fetch`,
        { customerIds: ids },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setFetchedCustomers(response.data.customers || []);
        setFetchErrors(response.data.errors || []);
        
        if (response.data.customers.length === 0) {
          setError('No valid customers found. Please check the Customer IDs.');
        } else {
          setSuccess(`Found ${response.data.customers.length} customer(s) ready for import`);
        }
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/admin');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch customers from Stripe');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomers = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const token = localStorage.getItem('adminAccessToken');
      
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/import-customers/save`,
        { customers: fetchedCustomers },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        
        if (response.data.errors && response.data.errors.length > 0) {
          setFetchErrors(response.data.errors);
        }

        // Clear form after successful import
        setTimeout(() => {
          setCustomerIds('');
          setFetchedCustomers([]);
          setFetchErrors([]);
        }, 3000);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/admin');
      } else {
        setError(err.response?.data?.message || 'Failed to save customers');
      }
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (index, customer) => {
    setEditingIndex(index);
    setEditFormData({ ...customer });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditFormData({});
  };

  const saveEdit = (index) => {
    const updatedCustomers = [...fetchedCustomers];
    updatedCustomers[index] = editFormData;
    setFetchedCustomers(updatedCustomers);
    setEditingIndex(null);
    setEditFormData({});
  };

  const handleEditChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested address fields
      const [parent, child] = field.split('.');
      setEditFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const removeCustomer = (index) => {
    const updatedCustomers = fetchedCustomers.filter((_, i) => i !== index);
    setFetchedCustomers(updatedCustomers);
  };

  const getStatusBadge = (status, hasPaymentMethod) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
            <CheckCircle size={14} />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
            <AlertCircle size={14} />
            Pending {!hasPaymentMethod && '(No Card)'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
            <XCircle size={14} />
            Cancelled
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f23] text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Import Customers from Stripe
          </h1>
          <p className="text-gray-400">
            Import existing Stripe customers and create client portal accounts
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <XCircle className="text-red-400 mt-0.5" size={20} />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
            <CheckCircle className="text-green-400 mt-0.5" size={20} />
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Fetch Customers Form */}
        <div className="bg-[#1a1a2e] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Step 1: Enter Stripe Customer IDs</h2>
          <form onSubmit={handleFetchCustomers}>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2">
                Stripe Customer IDs (one per line or comma-separated)
              </label>
              <textarea
                value={customerIds}
                onChange={(e) => setCustomerIds(e.target.value)}
                placeholder="cus_xxxxxxxxxxxxx&#10;cus_yyyyyyyyyyyyy&#10;cus_zzzzzzzzzzzzz"
                className="w-full px-4 py-3 bg-[#0f0f23] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d3ff62] focus:border-transparent"
                rows="6"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter Stripe Customer IDs (starting with "cus_"). You can paste multiple IDs separated by commas, spaces, or new lines.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !customerIds.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#d3ff62] to-[#a8d946] text-[#1a1a2e] rounded-lg font-semibold hover:shadow-lg hover:shadow-[#d3ff62]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Fetch Customer Data
                </>
              )}
            </button>
          </form>
        </div>

        {/* Fetch Errors */}
        {fetchErrors.length > 0 && (
          <div className="bg-[#1a1a2e] rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-red-400 flex items-center gap-2">
              <AlertCircle size={20} />
              Errors ({fetchErrors.length})
            </h3>
            <div className="space-y-2">
              {fetchErrors.map((err, index) => (
                <div key={index} className="bg-red-500/10 border border-red-500/20 rounded p-3">
                  <p className="text-red-400 text-sm">
                    <strong>{err.customerId || err.email}:</strong> {err.error}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fetched Customers Table */}
        {fetchedCustomers.length > 0 && (
          <div className="bg-[#1a1a2e] rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Step 2: Review & Edit Customer Data ({fetchedCustomers.length})
              </h2>
              <button
                onClick={handleSaveCustomers}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#d3ff62] to-[#a8d946] text-[#1a1a2e] rounded-lg font-semibold hover:shadow-lg hover:shadow-[#d3ff62]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save & Send Emails
                  </>
                )}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Phone</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Emails</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fetchedCustomers.map((customer, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-[#0f0f23]">
                      {editingIndex === index ? (
                        <>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) => handleEditChange('name', e.target.value)}
                              className="w-full px-2 py-1 bg-[#0f0f23] border border-gray-700 rounded text-white text-sm"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="email"
                              value={editFormData.email}
                              onChange={(e) => handleEditChange('email', e.target.value)}
                              className="w-full px-2 py-1 bg-[#0f0f23] border border-gray-700 rounded text-white text-sm"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editFormData.telephone}
                              onChange={(e) => handleEditChange('telephone', e.target.value)}
                              className="w-full px-2 py-1 bg-[#0f0f23] border border-gray-700 rounded text-white text-sm"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={editFormData.status}
                              onChange={(e) => handleEditChange('status', e.target.value)}
                              className="w-full px-2 py-1 bg-[#0f0f23] border border-gray-700 rounded text-white text-sm"
                            >
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1 text-xs">
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Password</span>
                              {editFormData.status === 'pending' && !editFormData.hasPaymentMethod && (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">Card</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => saveEdit(index)}
                                className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                                title="Save"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-2 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              {customer.address && (customer.address.line1 || customer.address.city) && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {[customer.address.line1, customer.address.city, customer.address.postcode]
                                    .filter(Boolean)
                                    .join(', ')}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{customer.email}</td>
                          <td className="py-3 px-4 text-gray-300">{customer.telephone || '-'}</td>
                          <td className="py-3 px-4">{getStatusBadge(customer.status, customer.hasPaymentMethod)}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1 text-xs">
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded flex items-center gap-1">
                                <Mail size={12} />
                                Password
                              </span>
                              {customer.status === 'pending' && !customer.hasPaymentMethod && (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded flex items-center gap-1">
                                  <Mail size={12} />
                                  Card
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => startEditing(index, customer)}
                                className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => removeCustomer(index)}
                                className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                title="Remove"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5" />
                <span>
                  <strong>What happens next:</strong> Clicking "Save & Send Emails" will:
                  <br />• Create client accounts in the database
                  <br />• Send password creation emails to all customers
                  <br />• Send payment card request emails to customers with "Pending (No Card)" status
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportCustomers;
