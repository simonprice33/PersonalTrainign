import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, RefreshCw, Mail, Shield, Ban, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ClientUserManagement = () => {
  const navigate = useNavigate();
  const [clientUsers, setClientUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [resendingEmail, setResendingEmail] = useState(null);
  const [showResendModal, setShowResendModal] = useState(false);
  const [pendingResendEmail, setPendingResendEmail] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      navigate('/admin');
    } else {
      fetchClientUsers();
    }
  }, [navigate]);

  const fetchClientUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await axiosInstance.get(
        `${BACKEND_URL}/api/admin/client-users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Force a new array reference to trigger re-render
        setClientUsers([...response.data.clientUsers]);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/admin');
      } else {
        setError('Failed to fetch client users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChangeRequest = (email, newStatus, currentStatus) => {
    // Store the pending change and show modal
    setPendingStatusChange({ email, newStatus, currentStatus });
    setShowConfirmModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    const { email, newStatus } = pendingStatusChange;
    
    setShowConfirmModal(false);
    setUpdatingEmail(email);
    setError('');
    
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await axiosInstance.put(
        `${BACKEND_URL}/api/admin/client-users/${email}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Refresh to show updated data
        await fetchClientUsers();
      } else {
        // Show backend error message
        setError(response.data.message || 'Failed to update status');
        fetchClientUsers();
      }
    } catch (err) {
      // Show detailed error message
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update status';
      setError(`Error updating status for ${email}: ${errorMessage}`);
      console.error('Status update error:', err);
      
      // Refresh to show correct current state
      fetchClientUsers();
    } finally {
      setUpdatingEmail(null);
      setPendingStatusChange(null);
    }
  };

  const handleCancelStatusChange = () => {
    setShowConfirmModal(false);
    setPendingStatusChange(null);
    // Refresh to reset dropdown to current value
    fetchClientUsers();
  };

  const handleResendPasswordEmailRequest = (email, clientName) => {
    setPendingResendEmail({ email, clientName });
    setShowResendModal(true);
  };

  const handleConfirmResendEmail = async () => {
    if (!pendingResendEmail) return;

    const { email, clientName } = pendingResendEmail;
    
    setShowResendModal(false);
    setResendingEmail(email);
    setError('');

    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await axiosInstance.post(
        `${BACKEND_URL}/api/admin/client-users/${email}/resend-password-email`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage(`Password setup email sent successfully to ${email}`);
        setShowSuccessModal(true);
      } else {
        setError(response.data.message || 'Failed to send password email');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send password email';
      setError(`Error sending email to ${email}: ${errorMessage}`);
      console.error('Resend email error:', err);
    } finally {
      setResendingEmail(null);
      setPendingResendEmail(null);
    }
  };

  const handleCancelResendEmail = () => {
    setShowResendModal(false);
    setPendingResendEmail(null);
  };

  const handleViewProfile = async (email) => {
    setLoadingProfile(true);
    setShowProfileModal(true);
    setSelectedProfile(null);

    try {
      const response = await axiosInstance.get(`${BACKEND_URL}/api/admin/clients/${encodeURIComponent(email)}`);
      
      if (response.data.success) {
        setSelectedProfile(response.data.client);
      }
    } catch (err) {
      setError('Failed to load client profile');
      setShowProfileModal(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const getStatusBadge = (status) => {
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
            <Shield size={14} />
            Pending
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
            <Ban size={14} />
            Suspended
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
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/dashboard"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Client Users</h1>
                <p className="text-gray-400">Manage client login accounts</p>
              </div>
            </div>
            <button
              onClick={fetchClientUsers}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <RefreshCw size={48} className="text-gray-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading client users...</p>
          </div>
        ) : clientUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users size={64} className="text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Client Users Yet</h2>
            <p className="text-gray-400">Client users will appear here after onboarding</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Password Set</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {clientUsers.map((user, index) => (
                    <tr key={`${user.email}-${user.status}-${index}`} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          <span className="text-white">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4">
                        {user.password ? (
                          <span className="text-green-400">✓ Yes</span>
                        ) : (
                          <span className="text-gray-500">✗ No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={user.status || 'pending'}
                            onChange={(e) => handleStatusChangeRequest(user.email, e.target.value, user.status)}
                            disabled={updatingEmail === user.email}
                            className="px-3 py-2 bg-gray-900 border-2 border-gray-700 rounded-lg text-white text-sm font-medium cursor-pointer hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgb(156, 163, 175)%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.2em] bg-[right_0.5rem_center] bg-no-repeat pr-8 min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              WebkitAppearance: 'none',
                              MozAppearance: 'none'
                            }}
                          >
                            <option value="pending" className="bg-gray-800 text-yellow-400">⏳ Pending</option>
                            <option value="active" className="bg-gray-800 text-green-400">✓ Active</option>
                            <option value="suspended" className="bg-gray-800 text-orange-400">⊗ Suspended</option>
                            <option value="cancelled" className="bg-gray-800 text-red-400">✗ Cancelled</option>
                          </select>
                          
                          <button
                            onClick={() => handleViewProfile(user.email)}
                            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                            title="View Profile"
                          >
                            👤 View
                          </button>

                          {(!user.password || user.status === 'pending') && (
                            <button
                              onClick={() => handleResendPasswordEmailRequest(user.email, user.name || user.email)}
                              disabled={resendingEmail === user.email}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Resend Password Setup Email"
                            >
                              {resendingEmail === user.email ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <Mail size={16} />
                              )}
                            </button>
                          )}
                        </div>
                        
                        {updatingEmail === user.email && (
                          <span className="ml-2 text-cyan-400 text-xs">Updating...</span>
                        )}
                        {resendingEmail === user.email && (
                          <span className="ml-2 text-blue-400 text-xs">Sending...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingStatusChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Status Change</h3>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to change the status for:
              </p>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-1">Email</p>
                <p className="text-white font-medium">{pendingStatusChange.email}</p>
              </div>

              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-2">Current Status</p>
                  <div className="bg-gray-900 rounded-lg p-3 text-center">
                    {getStatusBadge(pendingStatusChange.currentStatus)}
                  </div>
                </div>
                
                <div className="text-gray-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-2">New Status</p>
                  <div className="bg-gray-900 rounded-lg p-3 text-center">
                    {getStatusBadge(pendingStatusChange.newStatus)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelStatusChange}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className="px-4 py-2 bg-gradient-to-r from-[#d3ff62] to-[#a8d946] text-[#1a1a2e] rounded-lg font-semibold hover:shadow-lg hover:shadow-[#d3ff62]/20 transition-all"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend Email Confirmation Modal */}
      {showResendModal && pendingResendEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="text-blue-400" size={24} />
              Resend Password Email
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Send a password setup reminder email to:
              </p>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="mb-2">
                  <p className="text-sm text-gray-400">Client Name</p>
                  <p className="text-white font-medium">{pendingResendEmail.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Email Address</p>
                  <p className="text-white font-medium">{pendingResendEmail.email}</p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-400 text-sm flex items-start gap-2">
                  <Mail size={16} className="mt-0.5" />
                  <span>
                    This will send a new 7-day password setup link. The client can use this to create their portal password and access their account.
                  </span>
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelResendEmail}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResendEmail}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <Mail size={16} />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-400" size={24} />
              Email Sent Successfully
            </h3>
            
            <div className="mb-6">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-green-400 text-sm flex items-start gap-2">
                  <CheckCircle size={16} className="mt-0.5" />
                  <span>{successMessage}</span>
                </p>
              </div>
              
              <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-400 text-sm flex items-start gap-2">
                  <Mail size={16} className="mt-0.5" />
                  <span>
                    The client will receive a password setup link that expires in 7 days. They can use this link to create their portal password and access their account.
                  </span>
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientUserManagement;
