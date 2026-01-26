import React, { useState } from 'react';
import { Package, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const PackageManagement = ({ 
  packages, 
  onRefresh, 
  setAlertModal, 
  setConfirmModal 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    description: '',
    features: [''],
    is_popular: false
  });

  const resetForm = () => {
    setPackageForm({ name: '', price: '', description: '', features: [''], is_popular: false });
  };

  const handleAdd = async () => {
    try {
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
        resetForm();
        onRefresh();
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to create package', type: 'error' });
    }
  };

  const handleUpdate = async () => {
    try {
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
        resetForm();
        onRefresh();
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to update package', type: 'error' });
    }
  };

  const handleDelete = (pkg) => {
    setConfirmModal({
      show: true,
      title: 'Delete Package',
      message: `Are you sure you want to delete "${pkg.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`${BACKEND_URL}/api/admin/packages/${pkg.id}`);
          setAlertModal({ show: true, title: 'Success', message: 'Package deleted successfully', type: 'success' });
          onRefresh();
        } catch (err) {
          setAlertModal({ show: true, title: 'Error', message: 'Failed to delete package', type: 'error' });
        }
      }
    });
  };

  const handleToggleActive = async (pkg) => {
    try {
      await axiosInstance.put(`${BACKEND_URL}/api/admin/packages/${pkg.id}`, {
        ...pkg,
        active: !pkg.active
      });
      onRefresh();
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: 'Failed to update package status', type: 'error' });
    }
  };

  const openEdit = (pkg) => {
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

  const addFeature = () => {
    setPackageForm({ ...packageForm, features: [...packageForm.features, ''] });
  };

  const removeFeature = (index) => {
    setPackageForm({
      ...packageForm,
      features: packageForm.features.filter((_, i) => i !== index)
    });
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...packageForm.features];
    newFeatures[index] = value;
    setPackageForm({ ...packageForm, features: newFeatures });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package className="text-green-400" />
          Packages
        </h2>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Package
        </button>
      </div>

      {/* Package List */}
      <div className="grid gap-4">
        {packages.map((pkg) => (
          <div 
            key={pkg.id}
            className={`bg-gray-800 rounded-xl p-6 border ${pkg.active ? 'border-gray-700' : 'border-red-500/30 opacity-60'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                  {pkg.is_popular && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                      Most Popular
                    </span>
                  )}
                  {!pkg.active && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-2xl text-green-400 font-bold mt-2">£{pkg.price}/month</p>
                <p className="text-gray-400 mt-2">{pkg.description}</p>
                <ul className="mt-3 space-y-1">
                  {pkg.features?.map((feature, idx) => (
                    <li key={idx} className="text-gray-300 flex items-center gap-2">
                      <Check size={14} className="text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(pkg)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    pkg.active 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {pkg.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => openEdit(pkg)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit size={18} className="text-blue-400" />
                </button>
                <button
                  onClick={() => handleDelete(pkg)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Trash2 size={18} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {showEditModal ? 'Edit Package' : 'Add New Package'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Package Name</label>
                <input
                  type="text"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="e.g., Premium Training"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2">Price (£/month)</label>
                <input
                  type="number"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="125"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2">Description</label>
                <textarea
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 resize-none"
                  rows={3}
                  placeholder="Brief description of the package"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={packageForm.is_popular}
                    onChange={(e) => setPackageForm({ ...packageForm, is_popular: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-gray-300">Mark as "Most Popular"</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-8">Only one package can be marked as most popular</p>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2">Features</label>
                {packageForm.features.map((feature, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(idx, e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                      placeholder="Feature description"
                    />
                    {packageForm.features.length > 1 && (
                      <button
                        onClick={() => removeFeature(idx)}
                        className="p-2 hover:bg-gray-700 rounded-lg"
                      >
                        <X size={18} className="text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addFeature}
                  className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm mt-2"
                >
                  <Plus size={16} />
                  Add Feature
                </button>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingItem(null); resetForm(); }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showEditModal ? handleUpdate : handleAdd}
                className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                {showEditModal ? 'Update' : 'Create'} Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageManagement;
