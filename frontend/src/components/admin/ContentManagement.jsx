import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ClipboardList, Heart, FileText, ArrowLeft, Home } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import AlertModal from '../AlertModal';
import ConfirmModal from '../ConfirmModal';
import PackageManagement from './PackageManagement';
import QuestionManagement from './QuestionManagement';
import PolicyManagement from './PolicyManagement';
import HomepageManagement from './HomepageManagement';

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
  const [genericPolicySections, setGenericPolicySections] = useState({
    terms: [],
    privacy: [],
    cookie: []
  });
  
  // Modal states
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

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
      const [packagesRes, parqRes, healthRes, policyRes, termsRes, privacyRes, cookieRes] = await Promise.all([
        axiosInstance.get(`${BACKEND_URL}/api/admin/packages`),
        axiosInstance.get(`${BACKEND_URL}/api/admin/parq-questions`),
        axiosInstance.get(`${BACKEND_URL}/api/admin/health-questions`),
        axiosInstance.get(`${BACKEND_URL}/api/admin/cancellation-policy`),
        axiosInstance.get(`${BACKEND_URL}/api/admin/policies/terms-of-service`).catch(() => ({ data: { sections: [] } })),
        axiosInstance.get(`${BACKEND_URL}/api/admin/policies/privacy-policy`).catch(() => ({ data: { sections: [] } })),
        axiosInstance.get(`${BACKEND_URL}/api/admin/policies/cookie-policy`).catch(() => ({ data: { sections: [] } }))
      ]);
      
      setPackages(packagesRes.data.packages || []);
      setParqQuestions(parqRes.data.questions || []);
      setHealthQuestions(healthRes.data.questions || []);
      setPolicySections(policyRes.data.sections || []);
      setGenericPolicySections({
        terms: termsRes.data.sections || [],
        privacy: privacyRes.data.sections || [],
        cookie: cookieRes.data.sections || []
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-400" />
            </button>
            <h1 className="text-3xl font-bold text-white">Content Management</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTab('homepage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'homepage' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Home size={18} />
            Homepage
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'packages' 
                ? 'bg-green-500 text-white' 
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
                ? 'bg-blue-500 text-white' 
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
            Legal Policies
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'homepage' && (
          <HomepageManagement
            onRefresh={fetchAllData}
            setAlertModal={setAlertModal}
            setConfirmModal={setConfirmModal}
          />
        )}

        {activeTab === 'packages' && (
          <PackageManagement
            packages={packages}
            onRefresh={fetchAllData}
            setAlertModal={setAlertModal}
            setConfirmModal={setConfirmModal}
          />
        )}

        {activeTab === 'parq' && (
          <QuestionManagement
            type="parq"
            questions={parqQuestions}
            packages={packages}
            onRefresh={fetchAllData}
            setAlertModal={setAlertModal}
            setConfirmModal={setConfirmModal}
          />
        )}

        {activeTab === 'health' && (
          <QuestionManagement
            type="health"
            questions={healthQuestions}
            packages={packages}
            onRefresh={fetchAllData}
            setAlertModal={setAlertModal}
            setConfirmModal={setConfirmModal}
          />
        )}

        {activeTab === 'policy' && (
          <PolicyManagement
            policySections={policySections}
            genericPolicySections={genericPolicySections}
            setPolicySections={setPolicySections}
            setGenericPolicySections={setGenericPolicySections}
            onRefresh={fetchAllData}
            setAlertModal={setAlertModal}
            setConfirmModal={setConfirmModal}
          />
        )}
      </div>

      {/* Alert Modal */}
      <AlertModal
        show={alertModal.show}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ show: false, title: '', message: '', type: 'info' })}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          if (confirmModal.onConfirm) confirmModal.onConfirm();
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
        }}
        onClose={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
        type="danger"
      />
    </div>
  );
};

export default ContentManagement;
