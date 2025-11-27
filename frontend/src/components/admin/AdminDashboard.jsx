import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Users, LogOut, Key, CreditCard, Upload } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminAccessToken');
    const userData = localStorage.getItem('adminUser');
    
    if (!token || !userData) {
      navigate('/admin');
      return;
    }

    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gray-800 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Welcome back, {user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Email Management Card */}
          <Link
            to="/admin/emails"
            className="bg-gray-800 rounded-xl p-8 border border-cyan-500/20 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/20 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                <Mail className="text-cyan-500" size={32} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Email Management</h2>
            <p className="text-gray-400 text-sm">
              View and manage all collected emails from contact forms, TDEE calculator, and client inquiries.
            </p>
            <div className="mt-6 flex items-center text-cyan-500 text-sm font-medium">
              View Emails
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* User Management Card */}
          <Link
            to="/admin/users"
            className="bg-gray-800 rounded-xl p-8 border border-purple-500/20 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <Users className="text-purple-500" size={32} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">User Management</h2>
            <p className="text-gray-400 text-sm">
              Manage admin users, create new admins, and reset passwords.
            </p>
            <div className="mt-6 flex items-center text-purple-500 text-sm font-medium">
              Manage Users
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Client Users Management Card */}
          <Link
            to="/admin/client-users"
            className="bg-gray-800 rounded-xl p-8 border border-blue-500/20 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Users className="text-blue-500" size={32} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Client Users</h2>
            <p className="text-gray-400 text-sm">
              Manage client login accounts and user status (pending, active, suspended, cancelled).
            </p>
            <div className="mt-6 flex items-center text-blue-500 text-sm font-medium">
              Manage Client Users
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Client Management Card */}
          <Link
            to="/admin/clients"
            className="bg-gray-800 rounded-xl p-8 border border-green-500/20 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/20 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <CreditCard className="text-green-500" size={32} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Client Management</h2>
            <p className="text-gray-400 text-sm">
              Create payment links, manage subscriptions, and view client details.
            </p>
            <div className="mt-6 flex items-center text-green-500 text-sm font-medium">
              Manage Clients
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Change Password Card */}
          <Link
            to="/admin/change-password"
            className="bg-gray-800 rounded-xl p-8 border border-blue-500/20 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Key className="text-blue-500" size={32} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Change Password</h2>
            <p className="text-gray-400 text-sm">
              Update your account password for security.
            </p>
            <div className="mt-6 flex items-center text-blue-500 text-sm font-medium">
              Change Password
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;