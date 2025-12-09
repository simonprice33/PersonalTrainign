import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { Download, Filter, ArrowLeft, Mail, CheckCircle, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const EmailManagement = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    source: 'all',
    opted_in: 'all'
  });

  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [emails, filters]);

  const fetchEmails = async () => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await axiosInstance.get(`${BACKEND_URL}/api/admin/emails`);

      if (response.data.success) {
        setEmails(response.data.emails);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        navigate('/admin');
      } else {
        setError('Failed to fetch emails');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...emails];

    if (filters.source !== 'all') {
      filtered = filtered.filter(e => e.source === filters.source);
    }

    if (filters.opted_in !== 'all') {
      const optedIn = filters.opted_in === 'true';
      filtered = filtered.filter(e => e.opted_in === optedIn);
    }

    setFilteredEmails(filtered);
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await axiosInstance.get(`${BACKEND_URL}/api/admin/emails/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `emails-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export emails');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceBadge = (source) => {
    const badges = {
      'contact_form': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'tdee_calculator': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'client_inquiry': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    };
    return badges[source] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getSourceLabel = (source) => {
    const labels = {
      'contact_form': 'Contact Form',
      'tdee_calculator': 'TDEE Calculator',
      'client_inquiry': 'Client Inquiry'
    };
    return labels[source] || source;
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
      <div className="bg-gray-800 border-b border-cyan-500/20">
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
                  <Mail size={28} />
                  Email Management
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-cyan-500" />
            <h2 className="text-lg font-semibold text-white">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Source</label>
              <select
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Sources</option>
                <option value="contact_form">Contact Form</option>
                <option value="tdee_calculator">TDEE Calculator</option>
                <option value="client_inquiry">Client Inquiry</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Opt-in Status</label>
              <select
                value={filters.opted_in}
                onChange={(e) => setFilters({ ...filters, opted_in: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Statuses</option>
                <option value="true">Opted In</option>
                <option value="false">Opted Out</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Emails Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredEmails.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                      No emails found
                    </td>
                  </tr>
                ) : (
                  filteredEmails.map((email, index) => (
                    <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{email.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{email.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getSourceBadge(email.source)}`}>
                          {getSourceLabel(email.source)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {email.opted_in ? (
                            <>
                              <CheckCircle size={16} className="text-green-400" />
                              <span className="text-sm text-green-400">Opted In</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={16} className="text-red-400" />
                              <span className="text-sm text-red-400">Opted Out</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{email.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatDate(email.last_updated)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailManagement;