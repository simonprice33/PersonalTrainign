import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { ArrowLeft, Users, Download, Mail, User, Calendar, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const CampaignLeads = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [leads, setLeads] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      const [leadsRes, campaignRes] = await Promise.all([
        axiosInstance.get(`${BACKEND_URL}/api/campaigns/admin/${slug}/leads`),
        axiosInstance.get(`${BACKEND_URL}/api/campaigns/admin/${slug}`)
      ]);
      
      if (leadsRes.data.success) {
        setLeads(leadsRes.data.leads);
      }
      if (campaignRes.data.success) {
        setCampaign(campaignRes.data.campaign);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Signed Up'];
    const rows = leads.map(lead => [
      lead.name,
      lead.email,
      new Date(lead.subscribed_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/campaigns')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Campaign Leads</h1>
            {campaign && (
              <p className="text-gray-400">{campaign.title}</p>
            )}
          </div>
        </div>
        {leads.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Download size={18} />
            Export CSV
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/20 rounded-lg">
            <Users size={24} className="text-cyan-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{leads.length}</p>
            <p className="text-gray-400">Total Leads</p>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {leads.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <Users size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400">No leads captured yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Share your campaign URL to start collecting leads
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    Name
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  <div className="flex items-center gap-2">
                    <Mail size={14} />
                    Email
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    Signed Up
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {leads.map((lead, index) => (
                <tr key={index} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 text-white">{lead.name}</td>
                  <td className="px-6 py-4">
                    <a 
                      href={`mailto:${lead.email}`}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      {lead.email}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {formatDate(lead.subscribed_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CampaignLeads;
