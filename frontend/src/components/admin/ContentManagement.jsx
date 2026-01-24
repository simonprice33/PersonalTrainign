import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ClipboardList, 
  Heart, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ArrowLeft,
  Check,
  AlertCircle,
  GripVertical,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import AlertModal from '../AlertModal';
import ConfirmModal from '../ConfirmModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ContentManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('packages');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [packages, setPackages] = useState([]);
  const [parqQuestions, setParqQuestions] = useState([]);
  const [healthQuestions, setHealthQuestions] = useState([]);
  const [policySections, setPolicySections] = useState([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
  
  // Form states
  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    description: '',
    features: [''],
    is_popular: false
  });
  
  const [parqForm, setParqForm] = useState({
    question: '',
    order: 1,
    requires_doctor_approval: false,
    applicable_packages: [],
    category: 'general'
  });
  
  const [healthForm, setHealthForm] = useState({
    question: '',
    type: 'text',
    order: 1,
    options: [''],
    applicable_packages: [],
    category: 'general'
  });

  const [policyForm, setPolicyForm] = useState({
    sectionTitle: '',
    itemText: ''
  });
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchAllData();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [packagesRes, parqRes, healthRes, policyRes] = await Promise.all([
        axiosInstance.get(`${BACKEND_URL}/api/admin/packages`),
        axiosInstance.get(`${BACKEND_URL}/api/admin/parq-questions`),
        axiosInstance.get(`${BACKEND_URL}/api/admin/health-questions`),
        axiosInstance.get(`${BACKEND_URL}/api/admin/cancellation-policy`)
      ]);
      
      setPackages(packagesRes.data.packages || []);
      setParqQuestions(parqRes.data.questions || []);
      setHealthQuestions(healthRes.data.questions || []);
      setPolicySections(policyRes.data.sections || []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/admin');
      } else {
        setError('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Package handlers
  const handleAddPackage = async () => {
    try {
      // If this package is marked as popular, clear others first
      if (packageForm.is_popular) {
        await axiosInstance.post(`${BACKEND_URL}/api/admin/packages/clear-popular`);
      }
      
      const response = await axiosInstance.post(`${BACKEND_URL}/api/admin/packages`, {
        name: packageForm.name,
        price: parseFloat(packageForm.price),
        description: packageForm.description,
        features: packageForm.features.filter(f => f.trim()),
        is_popular: packageForm.is_popular
      });
      
      if (response.data.success) {
        setAlertModal({ show: true, title: 'Success', message: 'Package created successfully', type: 'success' });
        setShowAddModal(false);
        resetPackageForm();
        fetchAllData();
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to create package', type: 'error' });
    }
  };

  const handleUpdatePackage = async () => {
    try {
      // If this package is marked as popular, clear others first
      if (packageForm.is_popular) {
        await axiosInstance.post(`${BACKEND_URL}/api/admin/packages/clear-popular`);
      }
      
      const response = await axiosInstance.put(`${BACKEND_URL}/api/admin/packages/${editingItem.id}`, {
        name: packageForm.name,
        price: parseFloat(packageForm.price),
        description: packageForm.description,
        features: packageForm.features.filter(f => f.trim()),
        is_popular: packageForm.is_popular,
        active: editingItem.active
      });
      
      if (response.data.success) {
        setAlertModal({ show: true, title: 'Success', message: 'Package updated successfully', type: 'success' });
        setShowEditModal(false);
        setEditingItem(null);
        resetPackageForm();
        fetchAllData();
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to update package', type: 'error' });
    }
  };

  const handleDeletePackage = (pkg) => {
    setConfirmModal({
      show: true,
      title: 'Delete Package',
      message: `Are you sure you want to delete "${pkg.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`${BACKEND_URL}/api/admin/packages/${pkg.id}`);
          setAlertModal({ show: true, title: 'Success', message: 'Package deleted successfully', type: 'success' });
          fetchAllData();
        } catch (err) {
          setAlertModal({ show: true, title: 'Error', message: 'Failed to delete package', type: 'error' });
        }
      }
    });
  };

  const handleTogglePackageActive = async (pkg) => {
    try {
      await axiosInstance.put(`${BACKEND_URL}/api/admin/packages/${pkg.id}`, {
        ...pkg,
        active: !pkg.active
      });
      fetchAllData();
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: 'Failed to update package status', type: 'error' });
    }
  };

  // PARQ handlers
  const handleAddParq = async () => {
    try {
      const response = await axiosInstance.post(`${BACKEND_URL}/api/admin/parq-questions`, {
        question: parqForm.question,
        order: parseInt(parqForm.order),
        requires_doctor_approval: parqForm.requires_doctor_approval,
        applicable_packages: parqForm.applicable_packages,
        category: parqForm.category
      });
      
      if (response.data.success) {
        setAlertModal({ show: true, title: 'Success', message: 'PARQ question created successfully', type: 'success' });
        setShowAddModal(false);
        resetParqForm();
        fetchAllData();
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to create question', type: 'error' });
    }
  };

  const handleUpdateParq = async () => {
    try {
      const response = await axiosInstance.put(`${BACKEND_URL}/api/admin/parq-questions/${editingItem.id}`, {
        question: parqForm.question,
        order: parseInt(parqForm.order),
        requires_doctor_approval: parqForm.requires_doctor_approval,
        applicable_packages: parqForm.applicable_packages,
        category: parqForm.category,
        active: editingItem.active
      });
      
      if (response.data.success) {
        setAlertModal({ show: true, title: 'Success', message: 'PARQ question updated successfully', type: 'success' });
        setShowEditModal(false);
        setEditingItem(null);
        resetParqForm();
        fetchAllData();
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to update question', type: 'error' });
    }
  };

  const handleDeleteParq = (question) => {
    setConfirmModal({
      show: true,
      title: 'Delete PARQ Question',
      message: `Are you sure you want to delete this question? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`${BACKEND_URL}/api/admin/parq-questions/${question.id}`);
          setAlertModal({ show: true, title: 'Success', message: 'Question deleted successfully', type: 'success' });
          fetchAllData();
        } catch (err) {
          setAlertModal({ show: true, title: 'Error', message: 'Failed to delete question', type: 'error' });
        }
      }
    });
  };

  // Health Question handlers
  const handleAddHealth = async () => {
    try {
      const response = await axiosInstance.post(`${BACKEND_URL}/api/admin/health-questions`, {
        question: healthForm.question,
        type: healthForm.type,
        order: parseInt(healthForm.order),
        options: healthForm.type === 'multiple-choice' ? healthForm.options.filter(o => o.trim()) : [],
        applicable_packages: healthForm.applicable_packages,
        category: healthForm.category
      });
      
      if (response.data.success) {
        setAlertModal({ show: true, title: 'Success', message: 'Health question created successfully', type: 'success' });
        setShowAddModal(false);
        resetHealthForm();
        fetchAllData();
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to create question', type: 'error' });
    }
  };

  const handleUpdateHealth = async () => {
    try {
      const response = await axiosInstance.put(`${BACKEND_URL}/api/admin/health-questions/${editingItem.id}`, {
        question: healthForm.question,
        type: healthForm.type,
        order: parseInt(healthForm.order),
        options: healthForm.type === 'multiple-choice' ? healthForm.options.filter(o => o.trim()) : [],
        applicable_packages: healthForm.applicable_packages,
        category: healthForm.category,
        active: editingItem.active
      });
      
      if (response.data.success) {
        setAlertModal({ show: true, title: 'Success', message: 'Health question updated successfully', type: 'success' });
        setShowEditModal(false);
        setEditingItem(null);
        resetHealthForm();
        fetchAllData();
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to update question', type: 'error' });
    }
  };

  const handleDeleteHealth = (question) => {
    setConfirmModal({
      show: true,
      title: 'Delete Health Question',
      message: `Are you sure you want to delete this question? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`${BACKEND_URL}/api/admin/health-questions/${question.id}`);
          setAlertModal({ show: true, title: 'Success', message: 'Question deleted successfully', type: 'success' });
          fetchAllData();
        } catch (err) {
          setAlertModal({ show: true, title: 'Error', message: 'Failed to delete question', type: 'error' });
        }
      }
    });
  };

  // Form reset functions
  const resetPackageForm = () => {
    setPackageForm({ name: '', price: '', description: '', features: [''], is_popular: false });
  };

  const resetParqForm = () => {
    setParqForm({ question: '', order: parqQuestions.length + 1, requires_doctor_approval: false, applicable_packages: [], category: 'general' });
  };

  const resetHealthForm = () => {
    setHealthForm({ question: '', type: 'text', order: healthQuestions.length + 1, options: [''], applicable_packages: [], category: 'general' });
  };

  // Cancellation Policy handlers
  const handleAddSection = async () => {
    if (!policyForm.sectionTitle.trim()) {
      setAlertModal({ show: true, title: 'Error', message: 'Section title is required', type: 'error' });
      return;
    }
    try {
      const response = await axiosInstance.post(`${BACKEND_URL}/api/admin/cancellation-policy/sections`, {
        title: policyForm.sectionTitle
      });
      if (response.data.success) {
        setPolicySections([...policySections, response.data.section]);
        setPolicyForm({ ...policyForm, sectionTitle: '' });
        setAlertModal({ show: true, title: 'Success', message: 'Section added successfully', type: 'success' });
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to add section', type: 'error' });
    }
  };

  const handleUpdateSection = async (sectionId, newTitle) => {
    try {
      await axiosInstance.put(`${BACKEND_URL}/api/admin/cancellation-policy/sections/${sectionId}`, {
        title: newTitle
      });
      setPolicySections(policySections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s));
      setEditingSectionId(null);
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: 'Failed to update section', type: 'error' });
    }
  };

  const handleDeleteSection = (section) => {
    setConfirmModal({
      show: true,
      title: 'Delete Section',
      message: `Are you sure you want to delete "${section.title}" and all its items?`,
      onConfirm: async () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
        try {
          await axiosInstance.delete(`${BACKEND_URL}/api/admin/cancellation-policy/sections/${section.id}`);
          setPolicySections(policySections.filter(s => s.id !== section.id));
          setAlertModal({ show: true, title: 'Success', message: 'Section deleted', type: 'success' });
        } catch (err) {
          setAlertModal({ show: true, title: 'Error', message: 'Failed to delete section', type: 'error' });
        }
      }
    });
  };

  const handleMoveSectionUp = async (index) => {
    if (index === 0) return;
    const newSections = [...policySections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    setPolicySections(newSections);
    try {
      await axiosInstance.put(`${BACKEND_URL}/api/admin/cancellation-policy/sections/reorder`, {
        sectionIds: newSections.map(s => s.id)
      });
    } catch (err) {
      fetchAllData(); // Revert on error
    }
  };

  const handleMoveSectionDown = async (index) => {
    if (index === policySections.length - 1) return;
    const newSections = [...policySections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    setPolicySections(newSections);
    try {
      await axiosInstance.put(`${BACKEND_URL}/api/admin/cancellation-policy/sections/reorder`, {
        sectionIds: newSections.map(s => s.id)
      });
    } catch (err) {
      fetchAllData(); // Revert on error
    }
  };

  const handleAddItem = async (sectionId) => {
    if (!policyForm.itemText.trim()) {
      setAlertModal({ show: true, title: 'Error', message: 'Item text is required', type: 'error' });
      return;
    }
    try {
      const response = await axiosInstance.post(`${BACKEND_URL}/api/admin/cancellation-policy/sections/${sectionId}/items`, {
        text: policyForm.itemText
      });
      if (response.data.success) {
        setPolicySections(policySections.map(s => 
          s.id === sectionId ? { ...s, items: [...(s.items || []), response.data.item] } : s
        ));
        setPolicyForm({ ...policyForm, itemText: '' });
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: 'Failed to add item', type: 'error' });
    }
  };

  const handleUpdateItem = async (sectionId, itemId, newText) => {
    try {
      await axiosInstance.put(`${BACKEND_URL}/api/admin/cancellation-policy/sections/${sectionId}/items/${itemId}`, {
        text: newText
      });
      setPolicySections(policySections.map(s => 
        s.id === sectionId ? {
          ...s,
          items: s.items.map(i => i.id === itemId ? { ...i, text: newText } : i)
        } : s
      ));
      setEditingItemId(null);
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: 'Failed to update item', type: 'error' });
    }
  };

  const handleDeleteItem = async (sectionId, itemId) => {
    try {
      await axiosInstance.delete(`${BACKEND_URL}/api/admin/cancellation-policy/sections/${sectionId}/items/${itemId}`);
      setPolicySections(policySections.map(s => 
        s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
      ));
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: 'Failed to delete item', type: 'error' });
    }
  };

  const handleMoveItemUp = async (sectionId, itemIndex) => {
    const section = policySections.find(s => s.id === sectionId);
    if (!section || itemIndex === 0) return;
    
    const newItems = [...section.items];
    [newItems[itemIndex - 1], newItems[itemIndex]] = [newItems[itemIndex], newItems[itemIndex - 1]];
    
    setPolicySections(policySections.map(s => 
      s.id === sectionId ? { ...s, items: newItems } : s
    ));
    
    try {
      await axiosInstance.put(`${BACKEND_URL}/api/admin/cancellation-policy/sections/${sectionId}/items/reorder`, {
        itemIds: newItems.map(i => i.id)
      });
    } catch (err) {
      fetchAllData();
    }
  };

  const handleMoveItemDown = async (sectionId, itemIndex) => {
    const section = policySections.find(s => s.id === sectionId);
    if (!section || itemIndex === section.items.length - 1) return;
    
    const newItems = [...section.items];
    [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
    
    setPolicySections(policySections.map(s => 
      s.id === sectionId ? { ...s, items: newItems } : s
    ));
    
    try {
      await axiosInstance.put(`${BACKEND_URL}/api/admin/cancellation-policy/sections/${sectionId}/items/reorder`, {
        itemIds: newItems.map(i => i.id)
      });
    } catch (err) {
      fetchAllData();
    }
  };

  // Edit handlers
  const openEditPackage = (pkg) => {
    setEditingItem(pkg);
    setPackageForm({
      name: pkg.name,
      price: pkg.price.toString(),
      description: pkg.description || '',
      features: pkg.features?.length ? pkg.features : [''],
      is_popular: pkg.is_popular || false
    });
    setShowEditModal(true);
  };

  const openEditParq = (question) => {
    setEditingItem(question);
    setParqForm({
      question: question.question,
      order: question.order,
      requires_doctor_approval: question.requires_doctor_approval || false,
      applicable_packages: question.applicable_packages || [],
      category: question.category || 'general'
    });
    setShowEditModal(true);
  };

  const openEditHealth = (question) => {
    setEditingItem(question);
    setHealthForm({
      question: question.question,
      type: question.type || 'text',
      order: question.order,
      options: question.options?.length ? question.options : [''],
      applicable_packages: question.applicable_packages || [],
      category: question.category || 'general'
    });
    setShowEditModal(true);
  };

  // Package selection handler for questions
  const togglePackageSelection = (packageId, formType) => {
    if (formType === 'parq') {
      const current = parqForm.applicable_packages || [];
      const updated = current.includes(packageId)
        ? current.filter(p => p !== packageId)
        : [...current, packageId];
      setParqForm({ ...parqForm, applicable_packages: updated });
    } else {
      const current = healthForm.applicable_packages || [];
      const updated = current.includes(packageId)
        ? current.filter(p => p !== packageId)
        : [...current, packageId];
      setHealthForm({ ...healthForm, applicable_packages: updated });
    }
  };

  // Feature/Option array handlers
  const addFeature = () => setPackageForm({ ...packageForm, features: [...packageForm.features, ''] });
  const removeFeature = (index) => setPackageForm({ ...packageForm, features: packageForm.features.filter((_, i) => i !== index) });
  const updateFeature = (index, value) => {
    const newFeatures = [...packageForm.features];
    newFeatures[index] = value;
    setPackageForm({ ...packageForm, features: newFeatures });
  };

  const addOption = () => setHealthForm({ ...healthForm, options: [...healthForm.options, ''] });
  const removeOption = (index) => setHealthForm({ ...healthForm, options: healthForm.options.filter((_, i) => i !== index) });
  const updateOption = (index, value) => {
    const newOptions = [...healthForm.options];
    newOptions[index] = value;
    setHealthForm({ ...healthForm, options: newOptions });
  };

  const openAddModal = () => {
    if (activeTab === 'packages') resetPackageForm();
    else if (activeTab === 'parq') resetParqForm();
    else resetHealthForm();
    setShowAddModal(true);
  };

  const tabs = [
    { id: 'packages', label: 'Packages', icon: Package, color: 'cyan' },
    { id: 'parq', label: 'PARQ Questions', icon: ClipboardList, color: 'purple' },
    { id: 'health', label: 'Health Questions', icon: Heart, color: 'pink' }
  ];

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
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="text-white" size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Content Management</h1>
                <p className="text-gray-400 text-sm mt-1">Manage packages, PARQ and health questions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const response = await axiosInstance.post(`${BACKEND_URL}/api/admin/migrate-parq-to-pt-only`);
                    if (response.data.success) {
                      setAlertModal({
                        show: true,
                        title: 'Migration Complete',
                        message: response.data.message,
                        type: 'success'
                      });
                      fetchAllData();
                    }
                  } catch (err) {
                    setAlertModal({
                      show: true,
                      title: 'Error',
                      message: 'Migration failed',
                      type: 'error'
                    });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg transition-colors text-sm"
                title="Set all PARQ questions to only show for PT with Nutrition package"
              >
                Migrate PARQ to PT Only
              </button>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <Plus size={18} />
                Add New
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'packages' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Package size={18} />
            Packages
          </button>
          <button
            onClick={() => setActiveTab('parq')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'parq' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <ClipboardList size={18} />
            PARQ Questions
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'health' 
                ? 'bg-pink-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Heart size={18} />
            Health Questions
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'policy' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <FileText size={18} />
            Cancellation Policy
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="grid gap-4">
            {packages.map(pkg => (
              <div 
                key={pkg.id}
                className={`bg-gray-800 rounded-xl p-6 border ${pkg.active ? 'border-cyan-500/30' : 'border-gray-700 opacity-60'} ${pkg.is_popular ? 'ring-2 ring-yellow-500' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${pkg.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
                        {pkg.active ? 'Active' : 'Inactive'}
                      </span>
                      {pkg.is_popular && (
                        <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 font-bold">
                          Most Popular
                        </span>
                      )}
                    </div>
                    <p className="text-cyan-400 text-2xl font-bold mb-2">£{pkg.price}/month</p>
                    <p className="text-gray-400 text-sm mb-3">{pkg.description}</p>
                    {pkg.features?.length > 0 && (
                      <ul className="space-y-1">
                        {pkg.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                            <Check size={14} className="text-cyan-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTogglePackageActive(pkg)}
                      className={`p-2 rounded-lg transition-colors ${pkg.active ? 'bg-gray-700 hover:bg-gray-600' : 'bg-green-500/20 hover:bg-green-500/30'}`}
                      title={pkg.active ? 'Deactivate' : 'Activate'}
                    >
                      {pkg.active ? <X size={18} className="text-gray-400" /> : <Check size={18} className="text-green-400" />}
                    </button>
                    <button
                      onClick={() => openEditPackage(pkg)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                    >
                      <Edit size={18} className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {packages.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No packages found. Click "Add New" to create one.
              </div>
            )}
          </div>
        )}

        {/* PARQ Questions Tab */}
        {activeTab === 'parq' && (
          <div className="space-y-4">
            {parqQuestions.sort((a, b) => a.order - b.order).map(q => (
              <div 
                key={q.id}
                className={`bg-gray-800 rounded-xl p-6 border ${q.active ? 'border-purple-500/30' : 'border-gray-700 opacity-60'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 rounded-lg text-purple-400 font-bold">
                      {q.order}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{q.question}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {q.requires_doctor_approval && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                            Requires Doctor Approval
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${q.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
                          {q.active ? 'Active' : 'Inactive'}
                        </span>
                        {q.applicable_packages?.length > 0 ? (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                            {q.applicable_packages.map(pkgId => packages.find(p => p.id === pkgId)?.name || pkgId).join(', ')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs">
                            All Packages
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditParq(q)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                    >
                      <Edit size={18} className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteParq(q)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {parqQuestions.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No PARQ questions found. Click "Add New" to create one.
              </div>
            )}
          </div>
        )}

        {/* Health Questions Tab */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            {healthQuestions.sort((a, b) => a.order - b.order).map(q => (
              <div 
                key={q.id}
                className={`bg-gray-800 rounded-xl p-6 border ${q.active ? 'border-pink-500/30' : 'border-gray-700 opacity-60'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-pink-500/20 rounded-lg text-pink-400 font-bold">
                      {q.order}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{q.question}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs capitalize">
                          Type: {q.type}
                        </span>
                        {q.type === 'multiple-choice' && q.options?.length > 0 && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                            Options: {q.options.join(', ')}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${q.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
                          {q.active ? 'Active' : 'Inactive'}
                        </span>
                        {q.applicable_packages?.length > 0 ? (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                            {q.applicable_packages.map(pkgId => packages.find(p => p.id === pkgId)?.name || pkgId).join(', ')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs">
                            All Packages
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditHealth(q)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                    >
                      <Edit size={18} className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteHealth(q)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {healthQuestions.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No health questions found. Click "Add New" to create one.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                Add New {activeTab === 'packages' ? 'Package' : activeTab === 'parq' ? 'PARQ Question' : 'Health Question'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {activeTab === 'packages' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Package Name</label>
                  <input
                    type="text"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="e.g., Nutrition Only"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Monthly Price (£)</label>
                  <input
                    type="number"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="e.g., 75"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Description</label>
                  <textarea
                    value={packageForm.description}
                    onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    rows={3}
                    placeholder="Describe the package..."
                  />
                </div>
                <div className="flex items-center gap-3 py-3 px-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="isPopularAdd"
                    checked={packageForm.is_popular}
                    onChange={(e) => setPackageForm({ ...packageForm, is_popular: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-700 text-yellow-500 focus:ring-yellow-500"
                  />
                  <label htmlFor="isPopularAdd" className="text-yellow-400 text-sm font-medium cursor-pointer">
                    Mark as "Most Popular" (displays a banner on the package)
                  </label>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Features</label>
                  {packageForm.features.map((feature, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                        placeholder="Feature..."
                      />
                      {packageForm.features.length > 1 && (
                        <button onClick={() => removeFeature(index)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addFeature} className="text-cyan-400 text-sm hover:text-cyan-300">
                    + Add Feature
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'parq' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Question</label>
                  <textarea
                    value={parqForm.question}
                    onChange={(e) => setParqForm({ ...parqForm, question: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    rows={3}
                    placeholder="Enter the PARQ question..."
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Order</label>
                  <input
                    type="number"
                    value={parqForm.order}
                    onChange={(e) => setParqForm({ ...parqForm, order: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    min="1"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="requiresApproval"
                    checked={parqForm.requires_doctor_approval}
                    onChange={(e) => setParqForm({ ...parqForm, requires_doctor_approval: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500"
                  />
                  <label htmlFor="requiresApproval" className="text-gray-300 text-sm">
                    "Yes" answer requires doctor approval
                  </label>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Applies to Packages</label>
                  <p className="text-gray-500 text-xs mb-2">Leave empty to show for all packages</p>
                  <div className="space-y-2">
                    {packages.map(pkg => (
                      <label key={pkg.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={parqForm.applicable_packages?.includes(pkg.id)}
                          onChange={() => togglePackageSelection(pkg.id, 'parq')}
                          className="w-4 h-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500"
                        />
                        <span className="text-gray-300 text-sm">{pkg.name} (£{pkg.price})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'health' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Question</label>
                  <textarea
                    value={healthForm.question}
                    onChange={(e) => setHealthForm({ ...healthForm, question: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    rows={3}
                    placeholder="Enter the health question..."
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Question Type</label>
                  <select
                    value={healthForm.type}
                    onChange={(e) => setHealthForm({ ...healthForm, type: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="text">Text Input</option>
                    <option value="yesno">Yes/No</option>
                    <option value="multiple-choice">Multiple Choice</option>
                  </select>
                </div>
                {healthForm.type === 'multiple-choice' && (
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Options</label>
                    {healthForm.options.map((option, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                          placeholder="Option..."
                        />
                        {healthForm.options.length > 1 && (
                          <button onClick={() => removeOption(index)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={addOption} className="text-pink-400 text-sm hover:text-pink-300">
                      + Add Option
                    </button>
                  </div>
                )}
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Order</label>
                  <input
                    type="number"
                    value={healthForm.order}
                    onChange={(e) => setHealthForm({ ...healthForm, order: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Applies to Packages</label>
                  <p className="text-gray-500 text-xs mb-2">Leave empty to show for all packages</p>
                  <div className="space-y-2">
                    {packages.map(pkg => (
                      <label key={pkg.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={healthForm.applicable_packages?.includes(pkg.id)}
                          onChange={() => togglePackageSelection(pkg.id, 'health')}
                          className="w-4 h-4 rounded border-gray-700 text-pink-500 focus:ring-pink-500"
                        />
                        <span className="text-gray-300 text-sm">{pkg.name} (£{pkg.price})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'packages') handleAddPackage();
                  else if (activeTab === 'parq') handleAddParq();
                  else handleAddHealth();
                }}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                Edit {activeTab === 'packages' ? 'Package' : activeTab === 'parq' ? 'PARQ Question' : 'Health Question'}
              </h2>
              <button onClick={() => { setShowEditModal(false); setEditingItem(null); }} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {activeTab === 'packages' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Package Name</label>
                  <input
                    type="text"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Monthly Price (£)</label>
                  <input
                    type="number"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Description</label>
                  <textarea
                    value={packageForm.description}
                    onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-3 py-3 px-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="isPopularEdit"
                    checked={packageForm.is_popular}
                    onChange={(e) => setPackageForm({ ...packageForm, is_popular: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-700 text-yellow-500 focus:ring-yellow-500"
                  />
                  <label htmlFor="isPopularEdit" className="text-yellow-400 text-sm font-medium cursor-pointer">
                    Mark as "Most Popular" (displays a banner on the package)
                  </label>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Features</label>
                  {packageForm.features.map((feature, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      />
                      {packageForm.features.length > 1 && (
                        <button onClick={() => removeFeature(index)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addFeature} className="text-cyan-400 text-sm hover:text-cyan-300">
                    + Add Feature
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'parq' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Question</label>
                  <textarea
                    value={parqForm.question}
                    onChange={(e) => setParqForm({ ...parqForm, question: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Order</label>
                  <input
                    type="number"
                    value={parqForm.order}
                    onChange={(e) => setParqForm({ ...parqForm, order: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    min="1"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="editRequiresApproval"
                    checked={parqForm.requires_doctor_approval}
                    onChange={(e) => setParqForm({ ...parqForm, requires_doctor_approval: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500"
                  />
                  <label htmlFor="editRequiresApproval" className="text-gray-300 text-sm">
                    "Yes" answer requires doctor approval
                  </label>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Applies to Packages</label>
                  <p className="text-gray-500 text-xs mb-2">Leave empty to show for all packages</p>
                  <div className="space-y-2">
                    {packages.map(pkg => (
                      <label key={pkg.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={parqForm.applicable_packages?.includes(pkg.id)}
                          onChange={() => togglePackageSelection(pkg.id, 'parq')}
                          className="w-4 h-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500"
                        />
                        <span className="text-gray-300 text-sm">{pkg.name} (£{pkg.price})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'health' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Question</label>
                  <textarea
                    value={healthForm.question}
                    onChange={(e) => setHealthForm({ ...healthForm, question: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Question Type</label>
                  <select
                    value={healthForm.type}
                    onChange={(e) => setHealthForm({ ...healthForm, type: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="text">Text Input</option>
                    <option value="yesno">Yes/No</option>
                    <option value="multiple-choice">Multiple Choice</option>
                  </select>
                </div>
                {healthForm.type === 'multiple-choice' && (
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Options</label>
                    {healthForm.options.map((option, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                        />
                        {healthForm.options.length > 1 && (
                          <button onClick={() => removeOption(index)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={addOption} className="text-pink-400 text-sm hover:text-pink-300">
                      + Add Option
                    </button>
                  </div>
                )}
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Order</label>
                  <input
                    type="number"
                    value={healthForm.order}
                    onChange={(e) => setHealthForm({ ...healthForm, order: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Applies to Packages</label>
                  <p className="text-gray-500 text-xs mb-2">Leave empty to show for all packages</p>
                  <div className="space-y-2">
                    {packages.map(pkg => (
                      <label key={pkg.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={healthForm.applicable_packages?.includes(pkg.id)}
                          onChange={() => togglePackageSelection(pkg.id, 'health')}
                          className="w-4 h-4 rounded border-gray-700 text-pink-500 focus:ring-pink-500"
                        />
                        <span className="text-gray-300 text-sm">{pkg.name} (£{pkg.price})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'packages') handleUpdatePackage();
                  else if (activeTab === 'parq') handleUpdateParq();
                  else handleUpdateHealth();
                }}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Update
              </button>
            </div>
          </div>
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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ ...confirmModal, show: false })}
        onConfirm={() => {
          confirmModal.onConfirm?.();
          setConfirmModal({ ...confirmModal, show: false });
        }}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};

export default ContentManagement;
