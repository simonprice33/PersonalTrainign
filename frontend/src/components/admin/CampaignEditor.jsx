import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { 
  ArrowLeft, Save, Eye, Upload, Trash2, GripVertical,
  Image, Video, Plus, Loader2, ExternalLink
} from 'lucide-react';
import AlertModal from '../AlertModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const FRONTEND_URL = window.location.origin;

// Helper to get full media URL
const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
  return url;
};

const CampaignEditor = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const isEditing = Boolean(slug);
  const fileInputRef = useRef(null);

  const [campaign, setCampaign] = useState({
    title: '',
    slug: '',
    header: '',
    description: '',
    media: [],
    submitButtonText: 'Sign Up',
    afterSubmit: { type: 'message', message: 'Thank you for signing up!' },
    status: 'inactive'
  });

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchCampaign();
    }
  }, [slug]);

  const fetchCampaign = async () => {
    try {
      const response = await axiosInstance.get(`${BACKEND_URL}/api/campaigns/admin/${slug}`);
      if (response.data.success) {
        setCampaign(response.data.campaign);
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
      setAlertModal({
        show: true,
        title: 'Error',
        message: 'Failed to load campaign',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!campaign.title || !campaign.slug) {
      setAlertModal({
        show: true,
        title: 'Validation Error',
        message: 'Title and URL slug are required',
        type: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await axiosInstance.put(`${BACKEND_URL}/api/campaigns/admin/${slug}`, {
          ...campaign,
          new_slug: campaign.slug !== slug ? campaign.slug : undefined
        });
      } else {
        await axiosInstance.post(`${BACKEND_URL}/api/campaigns/admin`, campaign);
      }
      
      setAlertModal({
        show: true,
        title: 'Success',
        message: `Campaign ${isEditing ? 'updated' : 'created'} successfully`,
        type: 'success'
      });
      
      setTimeout(() => navigate('/admin/campaigns'), 1500);
    } catch (error) {
      setAlertModal({
        show: true,
        title: 'Error',
        message: error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} campaign`,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('media', file);

        const response = await axiosInstance.post(
          `${BACKEND_URL}/api/campaigns/admin/upload`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (response.data.success) {
          setCampaign(prev => ({
            ...prev,
            media: [...prev.media, response.data.media]
          }));
        }
      } catch (error) {
        console.error('Upload failed:', error);
        setAlertModal({
          show: true,
          title: 'Upload Error',
          message: `Failed to upload ${file.name}`,
          type: 'error'
        });
      }
    }
    
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index) => {
    setCampaign(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newMedia = [...campaign.media];
    const draggedItem = newMedia[draggedIndex];
    newMedia.splice(draggedIndex, 1);
    newMedia.splice(index, 0, draggedItem);
    
    setCampaign(prev => ({ ...prev, media: newMedia }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
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
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Campaign' : 'New Campaign'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && campaign.status === 'active' && (
            <a
              href={`/c/${campaign.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              <ExternalLink size={18} />
              Preview
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-700 text-white rounded-lg"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Campaign'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Campaign Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Name (Internal) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={campaign.title}
                  onChange={(e) => {
                    setCampaign({ 
                      ...campaign, 
                      title: e.target.value,
                      slug: !isEditing && !campaign.slug ? generateSlug(e.target.value) : campaign.slug
                    });
                  }}
                  placeholder="e.g., Nutrition Seminar Jan 2025"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL Slug <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{FRONTEND_URL}/c/</span>
                  <input
                    type="text"
                    value={campaign.slug}
                    onChange={(e) => setCampaign({ ...campaign, slug: generateSlug(e.target.value) })}
                    placeholder="nutrition-seminar"
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Landing Page Header
                </label>
                <input
                  type="text"
                  value={campaign.header}
                  onChange={(e) => setCampaign({ ...campaign, header: e.target.value })}
                  placeholder="e.g., Free Nutrition Workshop"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={campaign.description}
                  onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                  placeholder="Tell visitors what they'll get by signing up..."
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Media</h2>
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition-colors">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {uploading ? 'Uploading...' : 'Upload Media'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {campaign.media.length === 0 ? (
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <div className="flex justify-center gap-4 mb-4">
                  <Image size={32} className="text-gray-500" />
                  <Video size={32} className="text-gray-500" />
                </div>
                <p className="text-gray-400 mb-2">No media added yet</p>
                <p className="text-gray-500 text-sm">Upload images and videos to display on your landing page</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {campaign.media.map((item, index) => (
                  <div
                    key={item.id || index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`relative group rounded-lg overflow-hidden border-2 ${
                      draggedIndex === index ? 'border-cyan-500' : 'border-gray-700'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <video
                        src={getMediaUrl(item.url)}
                        className="w-full h-32 object-cover"
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={getMediaUrl(item.url)}
                        alt={`Media ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <div className="p-2 bg-gray-800 rounded cursor-grab">
                        <GripVertical size={16} className="text-white" />
                      </div>
                      <button
                        onClick={() => removeMedia(index)}
                        className="p-2 bg-red-500 hover:bg-red-600 rounded transition-colors"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>

                    {/* Type Badge */}
                    <div className="absolute top-2 left-2">
                      {item.type === 'video' ? (
                        <Video size={16} className="text-white drop-shadow" />
                      ) : (
                        <Image size={16} className="text-white drop-shadow" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Status</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setCampaign({ ...campaign, status: 'active' })}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  campaign.status === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setCampaign({ ...campaign, status: 'inactive' })}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  campaign.status === 'inactive'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Form Settings */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Form Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Submit Button Text
                </label>
                <input
                  type="text"
                  value={campaign.submitButtonText}
                  onChange={(e) => setCampaign({ ...campaign, submitButtonText: e.target.value })}
                  placeholder="Sign Up"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* After Submit */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">After Submission</h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setCampaign({ 
                    ...campaign, 
                    afterSubmit: { ...campaign.afterSubmit, type: 'message' } 
                  })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    campaign.afterSubmit?.type === 'message'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  Show Message
                </button>
                <button
                  onClick={() => setCampaign({ 
                    ...campaign, 
                    afterSubmit: { ...campaign.afterSubmit, type: 'redirect' } 
                  })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    campaign.afterSubmit?.type === 'redirect'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  Redirect
                </button>
              </div>

              {campaign.afterSubmit?.type === 'message' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Thank You Message
                  </label>
                  <textarea
                    value={campaign.afterSubmit?.message || ''}
                    onChange={(e) => setCampaign({ 
                      ...campaign, 
                      afterSubmit: { ...campaign.afterSubmit, message: e.target.value } 
                    })}
                    placeholder="Thank you for signing up!"
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Redirect URL
                  </label>
                  <input
                    type="url"
                    value={campaign.afterSubmit?.redirectUrl || ''}
                    onChange={(e) => setCampaign({ 
                      ...campaign, 
                      afterSubmit: { ...campaign.afterSubmit, redirectUrl: e.target.value } 
                    })}
                    placeholder="https://example.com/thank-you"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Users will be redirected after a brief thank you message
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default CampaignEditor;
