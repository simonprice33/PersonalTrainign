import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Check, Loader } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const PurchaseFlow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get('package');

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    if (packageId) {
      fetchPackage();
    } else {
      navigate('/join-now');
    }
  }, [packageId]);

  const fetchPackage = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/public/packages`);
      if (response.data.success) {
        const pkg = response.data.packages.find(p => p.id === packageId);
        if (pkg) {
          setSelectedPackage(pkg);
        } else {
          navigate('/join-now');
        }
      }
    } catch (error) {
      console.error('Failed to fetch package:', error);
      navigate('/join-now');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Loader className="text-cyan-400 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/20 backdrop-blur-sm bg-gray-900/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/join-now')}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Packages
          </button>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Simon Price PT" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Simon Price PT
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Selected Package Summary */}
          <div className="bg-gray-800 rounded-2xl border border-cyan-500/30 p-6 mb-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">
              {selectedPackage?.name}
            </h2>
            <div className="text-3xl font-bold">
              £{selectedPackage?.price}
              <span className="text-sm text-gray-400">/month</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-12">
            {['Client Info', 'PARQ', 'Payment', 'Health Questions'].map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index + 1 === currentStep 
                    ? 'border-cyan-400 bg-cyan-400 text-gray-900' 
                    : index + 1 < currentStep 
                    ? 'border-green-400 bg-green-400 text-gray-900'
                    : 'border-gray-600 text-gray-400'
                } font-bold`}>
                  {index + 1 < currentStep ? <Check size={20} /> : index + 1}
                </div>
                {index < 3 && (
                  <div className={`h-1 w-16 ${
                    index + 1 < currentStep ? 'bg-green-400' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Coming Soon Message */}
          <div className="bg-gray-800 rounded-2xl border border-cyan-500/30 p-12 text-center">
            <h3 className="text-3xl font-bold mb-4 text-cyan-400">
              Purchase Flow Coming Soon
            </h3>
            <p className="text-gray-300 mb-6">
              The multi-step purchase process is currently under development.
            </p>
            <p className="text-gray-400 mb-8">
              This will include: Client Information, PARQ Questionnaire, Payment Processing, and Health Questions.
            </p>
            <button
              onClick={() => navigate('/join-now')}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all"
            >
              Back to Packages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseFlow;
