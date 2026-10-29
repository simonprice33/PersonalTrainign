import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { 
  Plus, Edit, Trash2, Eye, EyeOff, Search, Users, ExternalLink, 
  ArrowLeft, ToggleLeft, ToggleRight, Copy, Check
} from 'lucide-react';
import AlertModal from '../AlertModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const FRONTEND_URL = window.location.origin;

const CampaignManagement = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, slug: '', title: '' });
  const [copiedSlug, setCopiedSlug] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`${BACKEND_URL}/api/campaigns/admin/list`);
      if (response.data.success) {
        setCampaigns(response.data.campaigns);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      setAlertModal({
        show: true,
        title: 'Error',
        message: 'Failed to load campaigns',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (slug, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await axiosInstance.put(`${BACKEND_URL}/api/campaigns/admin/${slug}`, { status: newStatus });
      setCampaigns(campaigns.map(c => 
        c.slug === slug ? { ...c, status: newStatus } : c
      ));
      setAlertModal({
        show: true,
        title: 'Success',
        message: `Campaign ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
        type: 'success'
      });
    } catch (error) {
      setAlertModal({
        show: true,
        title: 'Error',
        message: 'Failed to update campaign status',
        type: 'error'
      });
    }
  };

  const deleteCampaign = async (slug) => {
    try {
      await axiosInstance.delete(`${BACKEND_URL}/api/campaigns/admin/${slug}`);
      setCampaigns(campaigns.filter(c => c.slug !== slug));
      setDeleteConfirm({ show: false, slug: '', title: '' });
      setAlertModal({
        show: true,
        title: 'Success',
        message: 'Campaign deleted successfully',
        type: 'success'
      });
    } catch (error) {
      setAlertModal({
        show: true,
        title: 'Error',
        message: 'Failed to delete campaign',
        type: 'error'
      });
    }
  };

  const copyUrl = (slug) => {
    const url = `${FRONTEND_URL}/c/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-white">Campaign Landing Pages</h1>
        </div>
        <Link
          to="/admin/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          New Campaign
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <Users size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400 mb-4">
            {searchTerm ? 'No campaigns match your search' : 'No campaigns created yet'}
          </p>
          {!searchTerm && (
            <Link
              to="/admin/campaigns/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
            >
              <Plus size={18} />
              Create Your First Campaign
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Campaign</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">URL</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-400">Leads</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Created</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.slug} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <h3 className="font-medium text-white">{campaign.title}</h3>
                    {campaign.header && (
                      <p className="text-sm text-gray-400 truncate max-w-xs">{campaign.header}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 text-sm">/c/{campaign.slug}</span>
                      <button
                        onClick={() => copyUrl(campaign.slug)}
                        className="p-1 hover:bg-gray-600 rounded transition-colors"
                        title="Copy URL"
                      >
                        {copiedSlug === campaign.slug ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} className="text-gray-400" />
                        )}
                      </button>
                      {campaign.status === 'active' && (
                        <a
                          href={`/c/${campaign.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-gray-600 rounded transition-colors"
                          title="View live page"
                        >
                          <ExternalLink size={14} className="text-gray-400" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      to={`/admin/campaigns/${campaign.slug}/leads`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                    >
                      <Users size={14} />
                      {campaign.lead_count || 0}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleStatus(campaign.slug, campaign.status)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        campaign.status === 'active'
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-600/50 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {campaign.status === 'active' ? (
                        <>
                          <ToggleRight size={16} />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={16} />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {formatDate(campaign.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/campaigns/${campaign.slug}/edit`}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Edit campaign"
                      >
                        <Edit size={16} className="text-cyan-400" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm({ show: true, slug: campaign.slug, title: campaign.title })}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Delete campaign"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-2">Delete Campaign?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
              <br /><br />
              <span className="text-yellow-400 text-sm">Note: This will not delete the leads already captured.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({ show: false, slug: '', title: '' })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCampaign(deleteConfirm.slug)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManagement;
