import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Save, Plus, Trash2, Edit, ChevronUp, ChevronDown, Upload, X, Image, Loader2,
  // All Lucide icons that can be selected
  Dumbbell, Apple, MessageCircle, Calendar, Video, Target, Zap, TrendingUp, 
  Smartphone, Trophy, Users, Star, Award, CheckCircle, Clock, Shield, Phone, 
  Mail, MapPin, Heart, Activity, Flame, Brain, Coffee, Compass, Crown, 
  Diamond, Gift, Globe, Headphones, Key, Layers, LifeBuoy, Lightbulb, 
  Link, Lock, Medal, Music, Palette, Percent, PieChart, Rocket, Settings,
  Sparkles, Sun, ThumbsUp, Timer, Truck, Umbrella, Wand2, Wifi, Wrench
} from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Image position options
const POSITION_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'center top', label: 'Center Top' },
  { value: 'center bottom', label: 'Center Bottom' },
  { value: 'center 20%', label: 'Upper Third' },
  { value: 'center 30%', label: 'Upper Middle' },
  { value: 'center 40%', label: 'Middle Upper' },
  { value: 'center 60%', label: 'Middle Lower' },
  { value: 'center 70%', label: 'Lower Middle' },
  { value: 'center 80%', label: 'Lower Third' }
];

// Image Uploader Component
const ImageUploader = ({ imageUrl, imagePosition, onImageChange, onPositionChange, label = 'Profile Image' }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await axiosInstance.post(`${BACKEND_URL}/api/blog/admin/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        onImageChange(response.data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input value to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      <span className="block text-gray-300 text-sm font-medium">{label}</span>
      
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 transition-colors ${
          dragOver ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {imageUrl ? (
          <div className="flex gap-4">
            {/* Preview */}
            <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-900">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                style={{ objectPosition: imagePosition || 'center' }}
              />
              <button
                type="button"
                onClick={() => onImageChange('')}
                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
            
            {/* Controls */}
            <div className="flex-1 space-y-3">
              <div>
                <span className="block text-gray-400 text-xs mb-1">Image Position</span>
                <select
                  value={imagePosition || 'center'}
                  onChange={(e) => onPositionChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                >
                  {POSITION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              {/* File input with visible wrapper */}
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm cursor-pointer transition-colors">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? 'Uploading...' : 'Replace Image'}
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                URL: <span className="text-gray-400 break-all">{imageUrl.substring(0, 50)}...</span>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="text-center py-8 cursor-pointer relative"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {uploading ? (
              <Loader2 size={32} className="mx-auto mb-2 text-cyan-500 animate-spin" />
            ) : (
              <Image size={32} className="mx-auto mb-2 text-gray-500" />
            )}
            <p className="text-gray-400 text-sm">
              {uploading ? 'Uploading...' : 'Click or drag image to upload'}
            </p>
            <p className="text-gray-500 text-xs mt-1">PNG, JPG, WEBP up to 5MB</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Available icons for dropdown selection
const AVAILABLE_ICONS = [
  'Dumbbell', 'Apple', 'MessageCircle', 'Calendar', 'Video', 'Target', 'Zap', 
  'TrendingUp', 'Smartphone', 'Trophy', 'Users', 'Star', 'Award', 'CheckCircle', 
  'Clock', 'Shield', 'Phone', 'Mail', 'MapPin', 'Heart', 'Activity', 'Flame', 
  'Brain', 'Coffee', 'Compass', 'Crown', 'Diamond', 'Gift', 'Globe', 'Headphones', 
  'Key', 'Layers', 'LifeBuoy', 'Lightbulb', 'Link', 'Lock', 'Medal', 'Music', 
  'Palette', 'Percent', 'PieChart', 'Rocket', 'Settings', 'Sparkles', 'Sun', 
  'ThumbsUp', 'Timer', 'Truck', 'Umbrella', 'Wand2', 'Wifi', 'Wrench'
];

// Icon component mapper
const IconComponents = {
  Dumbbell, Apple, MessageCircle, Calendar, Video, Target, Zap, TrendingUp, 
  Smartphone, Trophy, Users, Star, Award, CheckCircle, Clock, Shield, Phone, 
  Mail, MapPin, Heart, Activity, Flame, Brain, Coffee, Compass, Crown, 
  Diamond, Gift, Globe, Headphones, Key, Layers, LifeBuoy, Lightbulb, 
  Link, Lock, Medal, Music, Palette, Percent, PieChart, Rocket, Settings,
  Sparkles, Sun, ThumbsUp, Timer, Truck, Umbrella, Wand2, Wifi, Wrench
};

const IconDisplay = ({ iconName, size = 20, className = '' }) => {
  const IconComponent = IconComponents[iconName] || Star;
  return <IconComponent size={size} className={className} />;
};

const HomepageManagement = ({ onRefresh, setAlertModal, setConfirmModal }) => {
  const [activeSection, setActiveSection] = useState('hero');
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch homepage content on mount
  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`${BACKEND_URL}/api/admin/homepage-content`);
      if (response.data.success) {
        setContent(response.data.content);
      }
    } catch (err) {
      console.error('Failed to fetch homepage content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportDefaults = async () => {
    setConfirmModal({
      show: true,
      title: 'Import Default Content',
      message: 'This will import the default homepage content. Any existing content will be overwritten. Continue?',
      onConfirm: async () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
        try {
          const response = await axiosInstance.post(`${BACKEND_URL}/api/admin/homepage-content/import-defaults`);
          if (response.data.success) {
            setContent(response.data.content);
            setAlertModal({ show: true, title: 'Success', message: 'Default content imported successfully', type: 'success' });
          }
        } catch (err) {
          setAlertModal({ show: true, title: 'Error', message: 'Failed to import default content', type: 'error' });
        }
      }
    });
  };

  const saveSection = async (section, data) => {
    setSaving(true);
    try {
      const response = await axiosInstance.put(`${BACKEND_URL}/api/admin/homepage-content`, {
        section,
        data
      });
      if (response.data.success) {
        setAlertModal({ show: true, title: 'Success', message: `${section} section saved successfully`, type: 'success' });
        fetchContent();
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: 'Failed to save section', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section, field, value) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateArrayItem = (section, arrayField, index, field, value) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [arrayField]: prev[section][arrayField].map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const addArrayItem = (section, arrayField, newItem) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [arrayField]: [...(prev[section][arrayField] || []), newItem]
      }
    }));
  };

  const removeArrayItem = (section, arrayField, index) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [arrayField]: prev[section][arrayField].filter((_, i) => i !== index)
      }
    }));
  };

  const moveArrayItem = (section, arrayField, index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    setContent(prev => {
      const array = [...prev[section][arrayField]];
      if (newIndex < 0 || newIndex >= array.length) return prev;
      [array[index], array[newIndex]] = [array[newIndex], array[index]];
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [arrayField]: array
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const SECTIONS = [
    { id: 'hero', label: 'Hero Section', icon: Home },
    { id: 'services', label: 'Services', icon: Layers },
    { id: 'about', label: 'About', icon: Users },
    { id: 'contact', label: 'Contact', icon: Mail }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Import Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Home className="text-cyan-400" />
          Homepage Content
        </h2>
        <button
          onClick={handleImportDefaults}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <Upload size={18} />
          Import Default Content
        </button>
      </div>

      {!content ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <Home size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400 mb-4">No homepage content found. Import default content to get started.</p>
          <button
            onClick={handleImportDefaults}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
          >
            Import Default Content
          </button>
        </div>
      ) : (
        <>
          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeSection === section.id 
                      ? 'bg-cyan-500 text-white' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  {section.label}
                </button>
              );
            })}
          </div>

          {/* Hero Section Editor */}
          {activeSection === 'hero' && content.hero && (
            <HeroEditor 
              data={content.hero} 
              updateField={(field, value) => updateField('hero', field, value)}
              updateArrayItem={(arrayField, index, field, value) => updateArrayItem('hero', arrayField, index, field, value)}
              addArrayItem={(arrayField, newItem) => addArrayItem('hero', arrayField, newItem)}
              removeArrayItem={(arrayField, index) => removeArrayItem('hero', arrayField, index)}
              onSave={() => saveSection('hero', content.hero)}
              saving={saving}
            />
          )}

          {/* Services Section Editor */}
          {activeSection === 'services' && content.services && (
            <ServicesEditor 
              data={content.services}
              updateField={(field, value) => updateField('services', field, value)}
              updateArrayItem={(arrayField, index, field, value) => updateArrayItem('services', arrayField, index, field, value)}
              addArrayItem={(arrayField, newItem) => addArrayItem('services', arrayField, newItem)}
              removeArrayItem={(arrayField, index) => removeArrayItem('services', arrayField, index)}
              moveArrayItem={(arrayField, index, direction) => moveArrayItem('services', arrayField, index, direction)}
              onSave={() => saveSection('services', content.services)}
              saving={saving}
              setConfirmModal={setConfirmModal}
            />
          )}

          {/* About Section Editor */}
          {activeSection === 'about' && content.about && (
            <AboutEditor 
              data={content.about}
              updateField={(field, value) => updateField('about', field, value)}
              updateArrayItem={(arrayField, index, field, value) => updateArrayItem('about', arrayField, index, field, value)}
              addArrayItem={(arrayField, newItem) => addArrayItem('about', arrayField, newItem)}
              removeArrayItem={(arrayField, index) => removeArrayItem('about', arrayField, index)}
              onSave={() => saveSection('about', content.about)}
              saving={saving}
            />
          )}

          {/* Contact Section Editor */}
          {activeSection === 'contact' && content.contact && (
            <ContactEditor 
              data={content.contact}
              updateField={(field, value) => updateField('contact', field, value)}
              updateArrayItem={(arrayField, index, field, value) => updateArrayItem('contact', arrayField, index, field, value)}
              addArrayItem={(arrayField, newItem) => addArrayItem('contact', arrayField, newItem)}
              removeArrayItem={(arrayField, index) => removeArrayItem('contact', arrayField, index)}
              onSave={() => saveSection('contact', content.contact)}
              saving={saving}
            />
          )}
        </>
      )}
    </div>
  );
};

// Hero Section Editor Component
const HeroEditor = ({ data, updateField, updateArrayItem, addArrayItem, removeArrayItem, onSave, saving }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Main Content</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Heading (Part 1)</label>
            <input
              type="text"
              value={data.heading || ''}
              onChange={(e) => updateField('heading', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Heading Highlight (Part 2)</label>
            <input
              type="text"
              value={data.headingHighlight || ''}
              onChange={(e) => updateField('headingHighlight', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Description</label>
            <textarea
              value={data.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Stats</h3>
          <button
            onClick={() => addArrayItem('stats', { id: Date.now().toString(), icon: 'Star', title: '', subtitle: '' })}
            className="flex items-center gap-2 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm"
          >
            <Plus size={16} />
            Add Stat
          </button>
        </div>
        <div className="space-y-4">
          {(data.stats || []).map((stat, index) => (
            <div key={stat.id || index} className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Icon</label>
                  <select
                    value={stat.icon || 'Star'}
                    onChange={(e) => updateArrayItem('stats', index, 'icon', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                  >
                    {AVAILABLE_ICONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Title</label>
                  <input
                    type="text"
                    value={stat.title || ''}
                    onChange={(e) => updateArrayItem('stats', index, 'title', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={stat.subtitle || ''}
                    onChange={(e) => updateArrayItem('stats', index, 'subtitle', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => removeArrayItem('stats', index)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Buttons & Profile */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Buttons & Text</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Primary Button Text</label>
            <input
              type="text"
              value={data.ctaPrimary || ''}
              onChange={(e) => updateField('ctaPrimary', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Secondary Button Text</label>
            <input
              type="text"
              value={data.ctaSecondary || ''}
              onChange={(e) => updateField('ctaSecondary', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-gray-300 text-sm mb-2">Trust Text</label>
            <input
              type="text"
              value={data.trustText || ''}
              onChange={(e) => updateField('trustText', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Profile Image Upload */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Profile Image</h3>
        <ImageUploader
          imageUrl={data.profileImage || ''}
          imagePosition={data.profileImagePosition || 'center 30%'}
          onImageChange={(url) => updateField('profileImage', url)}
          onPositionChange={(pos) => updateField('profileImagePosition', pos)}
          label="Hero Profile Image"
        />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Profile Caption</label>
            <input
              type="text"
              value={data.profileCaption || ''}
              onChange={(e) => updateField('profileCaption', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Profile Subcaption</label>
            <input
              type="text"
              value={data.profileSubcaption || ''}
              onChange={(e) => updateField('profileSubcaption', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save size={18} />
        {saving ? 'Saving...' : 'Save Hero Section'}
      </button>
    </div>
  );
};

// Services Section Editor Component
const ServicesEditor = ({ data, updateField, updateArrayItem, addArrayItem, removeArrayItem, moveArrayItem, onSave, saving, setConfirmModal }) => {
  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleEditService = (service, index) => {
    setEditingService(index);
    setEditForm({
      ...service,
      featuresText: (service.features || []).join('\n')
    });
  };

  const handleSaveService = () => {
    const features = editForm.featuresText.split('\n').filter(f => f.trim());
    updateArrayItem('items', editingService, 'icon', editForm.icon);
    updateArrayItem('items', editingService, 'title', editForm.title);
    updateArrayItem('items', editingService, 'description', editForm.description);
    updateArrayItem('items', editingService, 'features', features);
    setEditingService(null);
  };

  const handleAddService = () => {
    addArrayItem('items', {
      id: Date.now().toString(),
      icon: 'Star',
      title: 'New Service',
      description: 'Service description',
      features: ['Feature 1'],
      order: (data.items || []).length
    });
  };

  const handleDeleteService = (index) => {
    setConfirmModal({
      show: true,
      title: 'Delete Service',
      message: 'Are you sure you want to delete this service?',
      onConfirm: () => {
        removeArrayItem('items', index);
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Section Header Content */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Section Header</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Heading</label>
            <input
              type="text"
              value={data.heading || ''}
              onChange={(e) => updateField('heading', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Description</label>
            <textarea
              value={data.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Services ({(data.items || []).length})</h3>
          <button
            onClick={handleAddService}
            className="flex items-center gap-2 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm"
          >
            <Plus size={16} />
            Add Service
          </button>
        </div>
        
        <div className="space-y-3">
          {(data.items || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map((service, index) => (
            <div key={service.id || index} className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-lg">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveArrayItem('items', index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-700 rounded disabled:opacity-30"
                >
                  <ChevronUp size={14} className="text-gray-400" />
                </button>
                <button
                  onClick={() => moveArrayItem('items', index, 'down')}
                  disabled={index === (data.items || []).length - 1}
                  className="p-1 hover:bg-gray-700 rounded disabled:opacity-30"
                >
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
              </div>
              
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <IconDisplay iconName={service.icon} size={20} className="text-cyan-400" />
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-white">{service.title}</div>
                <div className="text-sm text-gray-400 truncate max-w-lg">{service.description}</div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditService(service, index)}
                  className="p-2 hover:bg-gray-700 rounded-lg"
                >
                  <Edit size={16} className="text-blue-400" />
                </button>
                <button
                  onClick={() => handleDeleteService(index)}
                  className="p-2 hover:bg-gray-700 rounded-lg"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">CTA Box</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">CTA Heading</label>
            <input
              type="text"
              value={data.ctaHeading || ''}
              onChange={(e) => updateField('ctaHeading', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">CTA Description</label>
            <textarea
              value={data.ctaDescription || ''}
              onChange={(e) => updateField('ctaDescription', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">CTA Button Text</label>
            <input
              type="text"
              value={data.ctaButton || ''}
              onChange={(e) => updateField('ctaButton', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save size={18} />
        {saving ? 'Saving...' : 'Save Services Section'}
      </button>

      {/* Edit Service Modal */}
      {editingService !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Edit Service</h3>
              <button onClick={() => setEditingService(null)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Icon</label>
                <select
                  value={editForm.icon || 'Star'}
                  onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                >
                  {AVAILABLE_ICONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Title</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Description</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Features (one per line)</label>
                <textarea
                  value={editForm.featuresText || ''}
                  onChange={(e) => setEditForm({ ...editForm, featuresText: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm"
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingService(null)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveService}
                className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// About Section Editor Component
const AboutEditor = ({ data, updateField, updateArrayItem, addArrayItem, removeArrayItem, onSave, saving }) => {
  return (
    <div className="space-y-6">
      {/* Main Content */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Main Content</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Heading</label>
              <input
                type="text"
                value={data.heading || ''}
                onChange={(e) => updateField('heading', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">Subheading</label>
              <input
                type="text"
                value={data.subheading || ''}
                onChange={(e) => updateField('subheading', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Paragraph 1</label>
            <textarea
              value={data.paragraph1 || ''}
              onChange={(e) => updateField('paragraph1', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Paragraph 2</label>
            <textarea
              value={data.paragraph2 || ''}
              onChange={(e) => updateField('paragraph2', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Values Grid */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Values</h3>
          <button
            onClick={() => addArrayItem('values', { id: Date.now().toString(), value: '', subtitle: '' })}
            className="flex items-center gap-2 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm"
          >
            <Plus size={16} />
            Add Value
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {(data.values || []).map((item, index) => (
            <div key={item.id || index} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={item.value || ''}
                  onChange={(e) => updateArrayItem('values', index, 'value', e.target.value)}
                  className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                  placeholder="Value"
                />
                <input
                  type="text"
                  value={item.subtitle || ''}
                  onChange={(e) => updateArrayItem('values', index, 'subtitle', e.target.value)}
                  className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-gray-400 text-xs"
                  placeholder="Subtitle"
                />
              </div>
              <button onClick={() => removeArrayItem('values', index)} className="p-1 hover:bg-gray-700 rounded">
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Qualifications */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Qualifications</h3>
            <input
              type="text"
              value={data.qualificationsHeading || ''}
              onChange={(e) => updateField('qualificationsHeading', e.target.value)}
              className="mt-2 px-3 py-1 bg-gray-900 border border-gray-700 rounded text-gray-300 text-sm"
              placeholder="Section heading"
            />
          </div>
          <button
            onClick={() => addArrayItem('qualifications', { id: Date.now().toString(), text: '' })}
            className="flex items-center gap-2 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {(data.qualifications || []).map((item, index) => (
            <div key={item.id || index} className="flex items-center gap-3">
              <CheckCircle size={16} className="text-cyan-400 flex-shrink-0" />
              <input
                type="text"
                value={item.text || ''}
                onChange={(e) => updateArrayItem('qualifications', index, 'text', e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
              />
              <button onClick={() => removeArrayItem('qualifications', index)} className="p-1 hover:bg-gray-700 rounded">
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Profile Card</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Name</label>
            <input
              type="text"
              value={data.profileName || ''}
              onChange={(e) => updateField('profileName', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Title</label>
            <input
              type="text"
              value={data.profileTitle || ''}
              onChange={(e) => updateField('profileTitle', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div className="col-span-2">
            <ImageUploader
              imageUrl={data.profileImage || ''}
              imagePosition={data.profileImagePosition || 'center'}
              onImageChange={(url) => updateField('profileImage', url)}
              onPositionChange={(pos) => updateField('profileImagePosition', pos)}
              label="About Profile Image"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-gray-300 text-sm mb-2">Quote</label>
            <input
              type="text"
              value={data.profileQuote || ''}
              onChange={(e) => updateField('profileQuote', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>
        
        {/* Profile Stats */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-300 text-sm">Profile Stats</label>
            <button
              onClick={() => addArrayItem('profileStats', { id: Date.now().toString(), label: '', value: '' })}
              className="text-cyan-400 text-sm hover:text-cyan-300"
            >
              + Add Stat
            </button>
          </div>
          <div className="space-y-2">
            {(data.profileStats || []).map((stat, index) => (
              <div key={stat.id || index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={stat.label || ''}
                  onChange={(e) => updateArrayItem('profileStats', index, 'label', e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
                  placeholder="Label"
                />
                <input
                  type="text"
                  value={stat.value || ''}
                  onChange={(e) => updateArrayItem('profileStats', index, 'value', e.target.value)}
                  className="w-24 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-cyan-400 text-sm"
                  placeholder="Value"
                />
                <button onClick={() => removeArrayItem('profileStats', index)} className="p-1 hover:bg-gray-700 rounded">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save size={18} />
        {saving ? 'Saving...' : 'Save About Section'}
      </button>
    </div>
  );
};

// Contact Section Editor Component
const ContactEditor = ({ data, updateField, updateArrayItem, addArrayItem, removeArrayItem, onSave, saving }) => {
  return (
    <div className="space-y-6">
      {/* Header Content */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Section Header</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Heading</label>
            <input
              type="text"
              value={data.heading || ''}
              onChange={(e) => updateField('heading', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Description</label>
            <textarea
              value={data.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Form Content</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Form Heading</label>
            <input
              type="text"
              value={data.formHeading || ''}
              onChange={(e) => updateField('formHeading', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Form Button Text</label>
            <input
              type="text"
              value={data.formButtonText || ''}
              onChange={(e) => updateField('formButtonText', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-gray-300 text-sm mb-2">Form Description</label>
            <textarea
              value={data.formDescription || ''}
              onChange={(e) => updateField('formDescription', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Contact Heading</label>
            <input
              type="text"
              value={data.contactHeading || ''}
              onChange={(e) => updateField('contactHeading', e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Phone</label>
              <input
                type="text"
                value={data.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">Email</label>
              <input
                type="text"
                value={data.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">Location</label>
              <input
                type="text"
                value={data.location || ''}
                onChange={(e) => updateField('location', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Trust Badges</h3>
            <input
              type="text"
              value={data.trustBadgesHeading || ''}
              onChange={(e) => updateField('trustBadgesHeading', e.target.value)}
              className="mt-2 px-3 py-1 bg-gray-900 border border-gray-700 rounded text-gray-300 text-sm"
              placeholder="Section heading"
            />
          </div>
          <button
            onClick={() => addArrayItem('trustBadges', { id: Date.now().toString(), icon: 'Star', title: '', description: '' })}
            className="flex items-center gap-2 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm"
          >
            <Plus size={16} />
            Add Badge
          </button>
        </div>
        <div className="space-y-3">
          {(data.trustBadges || []).map((badge, index) => (
            <div key={badge.id || index} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
              <select
                value={badge.icon || 'Star'}
                onChange={(e) => updateArrayItem('trustBadges', index, 'icon', e.target.value)}
                className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              >
                {AVAILABLE_ICONS.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={badge.title || ''}
                  onChange={(e) => updateArrayItem('trustBadges', index, 'title', e.target.value)}
                  className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={badge.description || ''}
                  onChange={(e) => updateArrayItem('trustBadges', index, 'description', e.target.value)}
                  className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-gray-400 text-xs"
                  placeholder="Description"
                />
              </div>
              <button onClick={() => removeArrayItem('trustBadges', index)} className="p-1 hover:bg-gray-700 rounded">
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Special Offer */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Special Offer Box</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Offer Heading</label>
            <input
              type="text"
              value={data.specialOffer?.heading || ''}
              onChange={(e) => updateField('specialOffer', { ...data.specialOffer, heading: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Offer Description</label>
            <textarea
              value={data.specialOffer?.description || ''}
              onChange={(e) => updateField('specialOffer', { ...data.specialOffer, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Footnote</label>
            <input
              type="text"
              value={data.specialOffer?.footnote || ''}
              onChange={(e) => updateField('specialOffer', { ...data.specialOffer, footnote: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save size={18} />
        {saving ? 'Saving...' : 'Save Contact Section'}
      </button>
    </div>
  );
};

export default HomepageManagement;
