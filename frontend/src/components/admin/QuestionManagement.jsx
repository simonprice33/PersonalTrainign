import React, { useState } from 'react';
import { ClipboardList, Heart, Plus, Edit, Trash2, Check, X, AlertCircle } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const QuestionManagement = ({ 
  type, // 'parq' or 'health'
  questions, 
  packages,
  onRefresh, 
  setAlertModal, 
  setConfirmModal 
}) => {
  const isParq = type === 'parq';
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const getInitialForm = () => isParq ? {
    question: '',
    order: questions.length + 1,
    requires_doctor_approval: false,
    applicable_packages: [],
    category: 'general'
  } : {
    question: '',
    type: 'text',
    order: questions.length + 1,
    options: [''],
    applicable_packages: [],
    category: 'general'
  };

  const [form, setForm] = useState(getInitialForm());

  const resetForm = () => setForm(getInitialForm());

  const handleAdd = async () => {
    try {
      const endpoint = isParq ? 'parq-questions' : 'health-questions';
      const payload = isParq ? {
        question: form.question,
        order: parseInt(form.order),
        requires_doctor_approval: form.requires_doctor_approval,
        applicable_packages: form.applicable_packages,
        category: form.category
      } : {
        question: form.question,
        type: form.type,
        order: parseInt(form.order),
        options: form.type === 'multiple-choice' ? form.options.filter(o => o.trim()) : [],
        applicable_packages: form.applicable_packages,
        category: form.category
      };

      const response = await axiosInstance.post(`${BACKEND_URL}/api/admin/${endpoint}`, payload);
      
      if (response.data.success) {
        setAlertModal({ show: true, title: 'Success', message: `${isParq ? 'PARQ' : 'Health'} question created successfully`, type: 'success' });
        setShowAddModal(false);
        resetForm();
        onRefresh();
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to create question', type: 'error' });
    }
  };

  const handleUpdate = async () => {
    try {
      const endpoint = isParq ? 'parq-questions' : 'health-questions';
      const payload = isParq ? {
        question: form.question,
        order: parseInt(form.order),
        requires_doctor_approval: form.requires_doctor_approval,
        applicable_packages: form.applicable_packages,
        category: form.category,
        active: editingItem.active
      } : {
        question: form.question,
        type: form.type,
        order: parseInt(form.order),
        options: form.type === 'multiple-choice' ? form.options.filter(o => o.trim()) : [],
        applicable_packages: form.applicable_packages,
        category: form.category,
        active: editingItem.active
      };

      const response = await axiosInstance.put(`${BACKEND_URL}/api/admin/${endpoint}/${editingItem.id}`, payload);
      
      if (response.data.success) {
        setAlertModal({ show: true, title: 'Success', message: `${isParq ? 'PARQ' : 'Health'} question updated successfully`, type: 'success' });
        setShowEditModal(false);
        setEditingItem(null);
        resetForm();
        onRefresh();
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to update question', type: 'error' });
    }
  };

  const handleDelete = (question) => {
    setConfirmModal({
      show: true,
      title: `Delete ${isParq ? 'PARQ' : 'Health'} Question`,
      message: `Are you sure you want to delete this question? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const endpoint = isParq ? 'parq-questions' : 'health-questions';
          await axiosInstance.delete(`${BACKEND_URL}/api/admin/${endpoint}/${question.id}`);
          setAlertModal({ show: true, title: 'Success', message: 'Question deleted successfully', type: 'success' });
          onRefresh();
        } catch (err) {
          setAlertModal({ show: true, title: 'Error', message: 'Failed to delete question', type: 'error' });
        }
      }
    });
  };

  const openEdit = (question) => {
    setEditingItem(question);
    if (isParq) {
      setForm({
        question: question.question,
        order: question.order,
        requires_doctor_approval: question.requires_doctor_approval || false,
        applicable_packages: question.applicable_packages || [],
        category: question.category || 'general'
      });
    } else {
      setForm({
        question: question.question,
        type: question.type || 'text',
        order: question.order,
        options: question.options?.length ? question.options : [''],
        applicable_packages: question.applicable_packages || [],
        category: question.category || 'general'
      });
    }
    setShowEditModal(true);
  };

  const togglePackage = (pkgId) => {
    const current = form.applicable_packages || [];
    const updated = current.includes(pkgId) 
      ? current.filter(id => id !== pkgId)
      : [...current, pkgId];
    setForm({ ...form, applicable_packages: updated });
  };

  const addOption = () => {
    setForm({ ...form, options: [...(form.options || []), ''] });
  };

  const removeOption = (index) => {
    setForm({ ...form, options: form.options.filter((_, i) => i !== index) });
  };

  const updateOption = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const Icon = isParq ? ClipboardList : Heart;
  const color = isParq ? 'blue' : 'pink';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Icon className={`text-${color}-400`} />
          {isParq ? 'PARQ Questions' : 'Health Questions'}
        </h2>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className={`flex items-center gap-2 px-4 py-2 bg-${color}-500 hover:bg-${color}-600 text-white rounded-lg transition-colors`}
          style={{ backgroundColor: isParq ? '#3b82f6' : '#ec4899' }}
        >
          <Plus size={18} />
          Add Question
        </button>
      </div>

      {/* Question List */}
      <div className="space-y-3">
        {questions
          .sort((a, b) => a.order - b.order)
          .map((question) => (
          <div 
            key={question.id}
            className="bg-gray-800 rounded-xl p-4 border border-gray-700"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500 text-sm">#{question.order}</span>
                  {isParq && question.requires_doctor_approval && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                      <AlertCircle size={12} />
                      Requires Doctor
                    </span>
                  )}
                  {!isParq && question.type && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                      {question.type}
                    </span>
                  )}
                </div>
                <p className="text-white">{question.question}</p>
                {question.applicable_packages?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {question.applicable_packages.map(pkgId => {
                      const pkg = packages.find(p => p.id === pkgId);
                      return pkg ? (
                        <span key={pkgId} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                          {pkg.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(question)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit size={18} className="text-blue-400" />
                </button>
                <button
                  onClick={() => handleDelete(question)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Trash2 size={18} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl border border-gray-700">
          <Icon size={48} className="mx-auto mb-4 opacity-50" />
          <p>No {isParq ? 'PARQ' : 'Health'} questions yet. Add your first question above.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {showEditModal ? 'Edit' : 'Add New'} {isParq ? 'PARQ' : 'Health'} Question
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Question</label>
                <textarea
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="Enter your question"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Display Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  min="1"
                />
              </div>

              {isParq && (
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.requires_doctor_approval}
                      onChange={(e) => setForm({ ...form, requires_doctor_approval: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-gray-300">Requires Doctor Approval if "Yes"</span>
                  </label>
                </div>
              )}

              {!isParq && (
                <>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Question Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="text">Text Input</option>
                      <option value="textarea">Long Text</option>
                      <option value="number">Number</option>
                      <option value="multiple-choice">Multiple Choice</option>
                    </select>
                  </div>

                  {form.type === 'multiple-choice' && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Options</label>
                      {form.options?.map((option, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(idx, e.target.value)}
                            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            placeholder={`Option ${idx + 1}`}
                          />
                          {form.options.length > 1 && (
                            <button
                              onClick={() => removeOption(idx)}
                              className="p-2 hover:bg-gray-700 rounded-lg"
                            >
                              <Trash2 size={18} className="text-red-400" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addOption}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-2"
                      >
                        <Plus size={16} />
                        Add Option
                      </button>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-gray-300 text-sm mb-2">Applicable Packages</label>
                <p className="text-xs text-gray-500 mb-2">Leave empty to show for all packages</p>
                <div className="space-y-2">
                  {packages.map(pkg => (
                    <label key={pkg.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.applicable_packages?.includes(pkg.id)}
                        onChange={() => togglePackage(pkg.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-500"
                      />
                      <span className="text-gray-300">{pkg.name}</span>
                    </label>
                  ))}
                </div>
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
                className="flex-1 px-4 py-3 text-white rounded-lg transition-colors"
                style={{ backgroundColor: isParq ? '#3b82f6' : '#ec4899' }}
              >
                {showEditModal ? 'Update' : 'Create'} Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
