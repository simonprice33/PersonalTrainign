import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, CreditCard, MapPin, Lock, AlertTriangle, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import AlertModal from '../AlertModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ClientPortal = () => {
  const navigate = useNavigate();
  const [clientData, setClientData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Change Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Address Update State
  const [addressData, setAddressData] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    country: 'GB'
  });
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('clientAccessToken');
    if (!token) {
      navigate('/client-login');
      return;
    }

    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      const token = localStorage.getItem('clientAccessToken');
      const storedData = JSON.parse(localStorage.getItem('clientData') || '{}');
      
      // Fetch full client details
      const response = await axios.get(
        `${BACKEND_URL}/api/admin/clients`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const client = response.data.clients.find(c => c.email === storedData.email);
        if (client) {
          setClientData(client);
          setAddressData({
            addressLine1: client.address_line_1 || '',
            addressLine2: client.address_line_2 || '',
            city: client.city || '',
            postcode: client.postcode || '',
            country: client.country || 'GB'
          });
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/client-login');
      }
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clientAccessToken');
    localStorage.removeItem('clientRefreshToken');
    localStorage.removeItem('clientData');
    navigate('/client-login');
  };

  const handleManageBilling = async () => {
    try {
      const token = localStorage.getItem('clientAccessToken');
      const response = await axios.post(
        `${BACKEND_URL}/api/client/manage-billing`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Open Stripe Customer Portal in a new tab
        window.open(response.data.portal_url, '_blank');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to open billing portal');
      console.error('Billing portal error:', err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    try {
      const token = localStorage.getItem('clientAccessToken');
      const response = await axios.post(
        `${BACKEND_URL}/api/client/reset-password`,
        { password: passwordData.newPassword, token },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setPasswordSuccess(true);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    setAddressError('');
    setAddressSuccess(false);

    try {
      const token = localStorage.getItem('clientAccessToken');
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/clients/${clientData.email}`,
        addressData,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAddressSuccess(true);
        fetchClientData();
      }
    } catch (err) {
      setAddressError(err.response?.data?.message || 'Failed to update address');
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.')) {
      return;
    }

    try {
      const token = localStorage.getItem('clientAccessToken');
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/client/${clientData.stripe_customer_id}/cancel-subscription`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('Subscription canceled. You will retain access until ' + new Date(response.data.endsAt).toLocaleDateString());
        fetchClientData();
      }
    } catch (err) {
      alert('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_personal-trainer-24/artifacts/g2n7e7ey_Logo%20800x770.png" 
                alt="Simon Price PT" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">Client Portal</h1>
                <p className="text-gray-400 text-sm">Welcome, {clientData?.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'dashboard' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <User size={20} />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('address')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'address' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <MapPin size={20} />
                  Address
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'password' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Lock size={20} />
                  Password
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Subscription Status */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Subscription Status</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        {clientData?.subscription_status === 'active' ? (
                          <>
                            <CheckCircle size={20} className="text-green-400" />
                            <span className="text-white font-semibold">Active</span>
                          </>
                        ) : clientData?.subscription_status === 'canceling' ? (
                          <>
                            <AlertTriangle size={20} className="text-yellow-400" />
                            <span className="text-white font-semibold">Canceling</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={20} className="text-red-400" />
                            <span className="text-white font-semibold">Inactive</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Monthly Price</p>
                      <p className="text-white font-semibold text-xl mt-1">£{clientData?.price || 125}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Billing Day</p>
                      <p className="text-white font-semibold mt-1">
                        {clientData?.billingDay || 1}{(clientData?.billingDay || 1) === 1 ? 'st' : (clientData?.billingDay || 1) === 2 ? 'nd' : (clientData?.billingDay || 1) === 3 ? 'rd' : 'th'} of each month
                      </p>
                    </div>
                    {clientData?.subscription_ends_at && (
                      <div>
                        <p className="text-gray-400 text-sm">Access Until</p>
                        <p className="text-white font-semibold mt-1">
                          {new Date(clientData.subscription_ends_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleManageBilling}
                    className="flex flex-col items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-4 rounded-lg font-semibold transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard size={20} />
                      <span>Manage Payment Method</span>
                    </div>
                    <span className="text-xs text-cyan-100 font-normal">
                      Update card details, view invoices & billing history
                    </span>
                  </button>
                  
                  {clientData?.subscription_status === 'active' && !clientData?.cancel_at_period_end && (
                    <button
                      onClick={handleCancelSubscription}
                      className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-4 rounded-lg font-semibold transition-all"
                    >
                      <XCircle size={20} />
                      Cancel Subscription
                    </button>
                  )}
                </div>

                {/* Contact Info */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Your Information</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm">Email</p>
                      <p className="text-white">{clientData?.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Phone</p>
                      <p className="text-white">{clientData?.telephone}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Address</p>
                      <p className="text-white">
                        {clientData?.address_line_1 || 'Not set'}<br />
                        {clientData?.address_line_2 && <>{clientData.address_line_2}<br /></>}
                        {clientData?.city && <>{clientData.city}, </>}
                        {clientData?.postcode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'address' && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Update Address</h2>
                
                {addressError && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    {addressError}
                  </div>
                )}

                {addressSuccess && (
                  <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                    Address updated successfully!
                  </div>
                )}

                <form onSubmit={handleUpdateAddress} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Address Line 1</label>
                    <input
                      type="text"
                      required
                      value={addressData.addressLine1}
                      onChange={(e) => setAddressData({ ...addressData, addressLine1: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Address Line 2</label>
                    <input
                      type="text"
                      value={addressData.addressLine2}
                      onChange={(e) => setAddressData({ ...addressData, addressLine2: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">City</label>
                      <input
                        type="text"
                        required
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Postcode</label>
                      <input
                        type="text"
                        required
                        value={addressData.postcode}
                        onChange={(e) => setAddressData({ ...addressData, postcode: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 rounded-lg font-semibold transition-all"
                  >
                    Update Address
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Change Password</h2>
                
                {passwordError && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                    Password changed successfully!
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Re-enter new password"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 rounded-lg font-semibold transition-all"
                  >
                    Change Password
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
