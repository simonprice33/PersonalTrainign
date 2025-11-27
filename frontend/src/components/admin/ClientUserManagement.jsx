import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, RefreshCw, Mail, Shield, Ban, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ClientUserManagement = () => {
  const navigate = useNavigate();
  const [clientUsers, setClientUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      const response = await axios.get(
        `${BACKEND_URL}/api/admin/client-users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setClientUsers(response.data.clientUsers);
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

  const updateStatus = async (email, newStatus) => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/client-users/${email}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        fetchClientUsers();
      }
    } catch (err) {
      alert('Failed to update status');
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
                    <tr key={index} className="hover:bg-gray-750 transition-colors">
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
                        <select
                          value={user.status || 'pending'}
                          onChange={(e) => updateStatus(user.email, e.target.value)}
                          className="px-4 py-2 bg-gray-900 border-2 border-gray-700 rounded-lg text-white text-sm font-medium cursor-pointer hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgb(156, 163, 175)%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.2em] bg-[right_0.5rem_center] bg-no-repeat pr-10 min-w-[140px]"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientUserManagement;
