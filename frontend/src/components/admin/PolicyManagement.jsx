import React, { useState } from 'react';
import { FileText, Shield, Cookie, Scale, Plus, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const POLICY_TYPES = [
  { id: 'cancellation', label: 'Cancellation Policy', icon: Scale, endpoint: 'cancellation-policy' },
  { id: 'terms', label: 'Terms of Service', icon: FileText, endpoint: 'terms-of-service' },
  { id: 'privacy', label: 'Privacy Policy', icon: Shield, endpoint: 'privacy-policy' },
  { id: 'cookie', label: 'Cookie Policy', icon: Cookie, endpoint: 'cookie-policy' }
];

const PolicyManagement = ({ 
  policySections,
  genericPolicySections,
  setPolicySections,
  setGenericPolicySections,
  onRefresh,
  setAlertModal, 
  setConfirmModal 
}) => {
  const [activePolicyType, setActivePolicyType] = useState('cancellation');
  const [policyForm, setPolicyForm] = useState({ sectionTitle: '', itemText: '' });
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  // Helper functions
  const getPolicyEndpoint = () => {
    if (activePolicyType === 'cancellation') {
      return `${BACKEND_URL}/api/admin/cancellation-policy`;
    }
    const policyConfig = POLICY_TYPES.find(p => p.id === activePolicyType);
    return `${BACKEND_URL}/api/admin/policies/${policyConfig?.endpoint}`;
  };

  const getCurrentPolicySections = () => {
    if (activePolicyType === 'cancellation') {
      return policySections;
    }
    return genericPolicySections[activePolicyType] || [];
  };

  const setCurrentPolicySections = (sections) => {
    if (activePolicyType === 'cancellation') {
      setPolicySections(sections);
    } else {
      setGenericPolicySections({
        ...genericPolicySections,
        [activePolicyType]: sections
      });
    }
  };

  // Section handlers
  const handleAddSection = async () => {
    if (!policyForm.sectionTitle.trim()) {
      setAlertModal({ show: true, title: 'Error', message: 'Section title is required', type: 'error' });
      return;
    }
    try {
      const response = await axiosInstance.post(`${getPolicyEndpoint()}/sections`, {
        title: policyForm.sectionTitle
      });
      if (response.data.success) {
        setCurrentPolicySections([...getCurrentPolicySections(), response.data.section]);
        setPolicyForm({ ...policyForm, sectionTitle: '' });
        setAlertModal({ show: true, title: 'Success', message: 'Section added successfully', type: 'success' });
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: err.response?.data?.message || 'Failed to add section', type: 'error' });
    }
  };

  const handleUpdateSection = async (sectionId, newTitle) => {
    try {
      await axiosInstance.put(`${getPolicyEndpoint()}/sections/${sectionId}`, { title: newTitle });
      const currentSections = getCurrentPolicySections();
      setCurrentPolicySections(currentSections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s));
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
          await axiosInstance.delete(`${getPolicyEndpoint()}/sections/${section.id}`);
          const currentSections = getCurrentPolicySections();
          setCurrentPolicySections(currentSections.filter(s => s.id !== section.id));
          setAlertModal({ show: true, title: 'Success', message: 'Section deleted', type: 'success' });
        } catch (err) {
          setAlertModal({ show: true, title: 'Error', message: 'Failed to delete section', type: 'error' });
        }
      }
    });
  };

  const handleMoveSectionUp = async (index) => {
    if (index === 0) return;
    const currentSections = getCurrentPolicySections();
    const newSections = [...currentSections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    setCurrentPolicySections(newSections);
    try {
      await axiosInstance.put(`${getPolicyEndpoint()}/sections/reorder`, {
        sectionIds: newSections.map(s => s.id)
      });
    } catch (err) {
      onRefresh();
    }
  };

  const handleMoveSectionDown = async (index) => {
    const currentSections = getCurrentPolicySections();
    if (index === currentSections.length - 1) return;
    const newSections = [...currentSections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    setCurrentPolicySections(newSections);
    try {
      await axiosInstance.put(`${getPolicyEndpoint()}/sections/reorder`, {
        sectionIds: newSections.map(s => s.id)
      });
    } catch (err) {
      onRefresh();
    }
  };

  // Item handlers
  const handleAddItem = async (sectionId, itemText) => {
    if (!itemText?.trim()) {
      setAlertModal({ show: true, title: 'Error', message: 'Item text is required', type: 'error' });
      return;
    }
    try {
      const response = await axiosInstance.post(`${getPolicyEndpoint()}/sections/${sectionId}/items`, {
        text: itemText.trim()
      });
      if (response.data.success) {
        const currentSections = getCurrentPolicySections();
        setCurrentPolicySections(currentSections.map(s => 
          s.id === sectionId ? { ...s, items: [...(s.items || []), response.data.item], _newItemText: '' } : s
        ));
      }
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: 'Failed to add item', type: 'error' });
    }
  };

  const handleUpdateItem = async (sectionId, itemId, newText) => {
    try {
      await axiosInstance.put(`${getPolicyEndpoint()}/sections/${sectionId}/items/${itemId}`, { text: newText });
      const currentSections = getCurrentPolicySections();
      setCurrentPolicySections(currentSections.map(s => 
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
      await axiosInstance.delete(`${getPolicyEndpoint()}/sections/${sectionId}/items/${itemId}`);
      const currentSections = getCurrentPolicySections();
      setCurrentPolicySections(currentSections.map(s => 
        s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
      ));
    } catch (err) {
      setAlertModal({ show: true, title: 'Error', message: 'Failed to delete item', type: 'error' });
    }
  };

  const handleMoveItemUp = async (sectionId, itemIndex) => {
    const currentSections = getCurrentPolicySections();
    const section = currentSections.find(s => s.id === sectionId);
    if (!section || itemIndex === 0) return;
    
    const newItems = [...section.items];
    [newItems[itemIndex - 1], newItems[itemIndex]] = [newItems[itemIndex], newItems[itemIndex - 1]];
    
    setCurrentPolicySections(currentSections.map(s => 
      s.id === sectionId ? { ...s, items: newItems } : s
    ));
    
    try {
      await axiosInstance.put(`${getPolicyEndpoint()}/sections/${sectionId}/items/reorder`, {
        itemIds: newItems.map(i => i.id)
      });
    } catch (err) {
      onRefresh();
    }
  };

  const handleMoveItemDown = async (sectionId, itemIndex) => {
    const currentSections = getCurrentPolicySections();
    const section = currentSections.find(s => s.id === sectionId);
    if (!section || itemIndex === section.items.length - 1) return;
    
    const newItems = [...section.items];
    [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
    
    setCurrentPolicySections(currentSections.map(s => 
      s.id === sectionId ? { ...s, items: newItems } : s
    ));
    
    try {
      await axiosInstance.put(`${getPolicyEndpoint()}/sections/${sectionId}/items/reorder`, {
        itemIds: newItems.map(i => i.id)
      });
    } catch (err) {
      onRefresh();
    }
  };

  const updateSectionNewItemText = (sectionId, text) => {
    const currentSections = getCurrentPolicySections();
    setCurrentPolicySections(currentSections.map(s => 
      s.id === sectionId ? { ...s, _newItemText: text } : s
    ));
  };

  return (
    <div className="space-y-6">
      {/* Policy Type Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {POLICY_TYPES.map(pType => {
          const IconComp = pType.icon;
          return (
            <button
              key={pType.id}
              onClick={() => setActivePolicyType(pType.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activePolicyType === pType.id 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <IconComp size={16} />
              {pType.label}
            </button>
          );
        })}
      </div>

      {/* Add New Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">
          Add New Section to {POLICY_TYPES.find(p => p.id === activePolicyType)?.label}
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={policyForm.sectionTitle}
            onChange={(e) => setPolicyForm({ ...policyForm, sectionTitle: e.target.value })}
            placeholder="Section title (e.g., 'Notice Period')"
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={handleAddSection}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Add Section
          </button>
        </div>
      </div>

      {/* Policy Sections */}
      {getCurrentPolicySections().map((section, sectionIndex) => (
        <div key={section.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* Section Header */}
          <div className="flex items-center justify-between p-4 bg-gray-900/50 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMoveSectionUp(sectionIndex)}
                  disabled={sectionIndex === 0}
                  className="p-0.5 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp size={14} className="text-gray-500" />
                </button>
                <button
                  onClick={() => handleMoveSectionDown(sectionIndex)}
                  disabled={sectionIndex === getCurrentPolicySections().length - 1}
                  className="p-0.5 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown size={14} className="text-gray-500" />
                </button>
              </div>
              
              {editingSectionId === section.id ? (
                <input
                  type="text"
                  defaultValue={section.title}
                  onBlur={(e) => handleUpdateSection(section.id, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateSection(section.id, e.target.value)}
                  className="px-3 py-1 bg-gray-800 border border-orange-500 rounded text-white focus:outline-none"
                  autoFocus
                />
              ) : (
                <h4 className="text-lg font-semibold text-white">{section.title}</h4>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingSectionId(editingSectionId === section.id ? null : section.id)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <Edit size={16} className="text-blue-400" />
              </button>
              <button
                onClick={() => handleDeleteSection(section)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          </div>

          {/* Section Content - Items */}
          <div className="p-4 space-y-3">
            {(section.items || []).map((item, itemIndex) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg group">
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    onClick={() => handleMoveItemUp(section.id, itemIndex)}
                    disabled={itemIndex === 0}
                    className="p-0.5 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp size={14} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleMoveItemDown(section.id, itemIndex)}
                    disabled={itemIndex === section.items.length - 1}
                    className="p-0.5 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>
                </div>
                
                {editingItemId === item.id ? (
                  <textarea
                    defaultValue={item.text}
                    onBlur={(e) => handleUpdateItem(section.id, item.id, e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-orange-500 rounded text-white text-sm focus:outline-none resize-y min-h-[100px] font-mono"
                    autoFocus
                    placeholder={`Main point text\n\n- Sub point 1\n  - Further sub point\n- Sub point 2`}
                  />
                ) : (
                  <div className="flex-1 text-gray-300 text-sm whitespace-pre-wrap">{item.text}</div>
                )}
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingItemId(editingItemId === item.id ? null : item.id)}
                    className="p-1.5 hover:bg-gray-700 rounded"
                  >
                    <Edit size={14} className="text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(section.id, item.id)}
                    className="p-1.5 hover:bg-gray-700 rounded"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Item Input */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <label className="block text-sm text-gray-400 mb-2">Add new item:</label>
              <textarea
                value={section._newItemText || ''}
                onChange={(e) => updateSectionNewItemText(section.id, e.target.value)}
                placeholder={`Type your text here...\n\nTo add sub-points, leave a blank line then:\n- First sub-point\n  - Further sub-point\n- Second sub-point\n\nUse **bold** for emphasis`}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500 resize-y min-h-[140px] font-mono"
                rows={7}
              />
              <div className="flex justify-between items-start mt-2">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Press <span className="text-orange-400">Enter</span> for new lines</p>
                  <p>• Add <span className="text-orange-400">blank line</span> before bullet list</p>
                  <p>• Use <span className="text-orange-400">2 spaces</span> + dash for nested bullets</p>
                </div>
                <button
                  onClick={() => {
                    if (section._newItemText?.trim()) {
                      handleAddItem(section.id, section._newItemText);
                    }
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {getCurrentPolicySections().length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl border border-gray-700">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No sections in {POLICY_TYPES.find(p => p.id === activePolicyType)?.label} yet. Add your first section above.</p>
        </div>
      )}
    </div>
  );
};

export default PolicyManagement;
