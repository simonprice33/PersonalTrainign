import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowLeft, ArrowRight, Check, Loader, CheckCircle } from 'lucide-react';
import AlertModal from '../components/AlertModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const countries = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'IE', name: 'Ireland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' }
];

const PurchaseFlowContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get('package');
  const stripe = useStripe();
  const elements = useElements();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [parqQuestions, setParqQuestions] = useState([]);
  const [healthQuestions, setHealthQuestions] = useState([]);
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });

  // Form data
  const [clientInfo, setClientInfo] = useState({
    name: '',
    age: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    country: 'GB',
    goal1: '',
    goal2: '',
    goal3: ''
  });

  const [parqResponses, setParqResponses] = useState({});
  const [needsDoctorApproval, setNeedsDoctorApproval] = useState(false);
  const [hasDoctorApproval, setHasDoctorApproval] = useState(false);

  const [healthResponses, setHealthResponses] = useState({});
  const [paymentMethodId, setPaymentMethodId] = useState(null);

  useEffect(() => {
    if (packageId) {
      fetchData();
    } else {
      navigate('/join-now');
    }
  }, [packageId]);

  const fetchData = async () => {
    try {
      const [pkgRes, parqRes, healthRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/public/packages`),
        axios.get(`${BACKEND_URL}/api/public/parq-questions?packageId=${packageId}`),
        axios.get(`${BACKEND_URL}/api/public/health-questions?packageId=${packageId}`)
      ]);

      const pkg = pkgRes.data.packages?.find(p => p.id === packageId);
      if (!pkg) {
        navigate('/join-now');
        return;
      }

      setSelectedPackage(pkg);
      setParqQuestions(parqRes.data.questions || []);
      setHealthQuestions(healthRes.data.questions || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      navigate('/join-now');
    } finally {
      setLoading(false);
    }
  };

  const handleClientInfoChange = (field, value) => {
    setClientInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleParqChange = (questionId, value) => {
    setParqResponses(prev => ({ ...prev, [questionId]: value }));
    
    // Check if any answer is "yes"
    const responses = { ...parqResponses, [questionId]: value };
    const hasYes = Object.values(responses).some(v => v === 'yes');
    setNeedsDoctorApproval(hasYes);
  };

  const handleHealthChange = (questionId, value) => {
    setHealthResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const validateStep1 = () => {
    const required = ['name', 'age', 'email', 'phone', 'addressLine1', 'city', 'postcode', 'goal1'];
    for (const field of required) {
      if (!clientInfo[field]) {
        setAlertModal({
          show: true,
          title: 'Missing Information',
          message: 'Please fill in all required fields',
          type: 'warning'
        });
        return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    if (parqQuestions.length !== Object.keys(parqResponses).length) {
      setAlertModal({
        show: true,
        title: 'Incomplete PARQ',
        message: 'Please answer all PARQ questions',
        type: 'warning'
      });
      return false;
    }

    if (needsDoctorApproval && !hasDoctorApproval) {
      setAlertModal({
        show: true,
        title: 'Doctor Approval Required',
        message: 'You must confirm you have doctor approval to proceed',
        type: 'warning'
      });
      return false;
    }

    return true;
  };

  const calculateProRata = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - today.getDate() + 1;
    const proRataAmount = (selectedPackage.price / daysInMonth) * daysRemaining;
    return {
      proRata: Math.round(proRataAmount * 100) / 100,
      daysRemaining,
      daysInMonth
    };
  };

  const handlePayment = async () => {
    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);

    try {
      // Create setup intent
      const setupResponse = await axios.post(`${BACKEND_URL}/api/client/create-setup-intent`, {
        email: clientInfo.email
      });

      const { clientSecret } = setupResponse.data;

      // Confirm card setup
      const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: clientInfo.name,
            email: clientInfo.email,
            phone: clientInfo.phone,
            address: {
              line1: clientInfo.addressLine1,
              line2: clientInfo.addressLine2,
              city: clientInfo.city,
              postal_code: clientInfo.postcode,
              country: clientInfo.country
            }
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Store the payment method ID for final submission
      setPaymentMethodId(setupIntent.payment_method);

      // Move to health questions
      setCurrentStep(4);

    } catch (error) {
      setAlertModal({
        show: true,
        title: 'Payment Error',
        message: error.message || 'Failed to process payment',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/public/purchase`, {
        packageId,
        paymentMethodId,
        clientInfo: {
          ...clientInfo,
          goals: [clientInfo.goal1, clientInfo.goal2, clientInfo.goal3].filter(Boolean)
        },
        parqResponses: Object.entries(parqResponses).map(([questionId, answer]) => ({
          questionId,
          question: parqQuestions.find(q => q.id === questionId)?.question,
          answer,
          needsApproval: needsDoctorApproval
        })),
        healthResponses: Object.entries(healthResponses).map(([questionId, answer]) => ({
          questionId,
          question: healthQuestions.find(q => q.id === questionId)?.question,
          answer
        })),
        hasDoctorApproval: needsDoctorApproval ? hasDoctorApproval : null
      });

      if (response.data.success) {
        setCurrentStep(5);
      }

    } catch (error) {
      setAlertModal({
        show: true,
        title: 'Submission Error',
        message: error.response?.data?.message || 'Failed to complete purchase',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3) {
      handlePayment();
      return;
    }
    if (currentStep === 4) {
      handleFinalSubmit();
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Loader className="text-cyan-400 animate-spin" size={48} />
      </div>
    );
  }

  const billing = calculateProRata();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/20 backdrop-blur-sm bg-gray-900/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Simon Price PT" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Simon Price PT
            </span>
          </div>
          <button
            onClick={() => navigate('/join-now')}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Packages
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Selected Package Summary */}
          <div className="bg-gray-800 rounded-2xl border border-cyan-500/30 p-6 mb-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">
              {selectedPackage?.name}
            </h2>
            <div className="text-3xl font-bold mb-2">
              £{selectedPackage?.price}
              <span className="text-sm text-gray-400">/month</span>
            </div>
            {currentStep >= 3 && (
              <p className="text-gray-300 text-sm">
                First payment: £{billing.proRata} (pro-rated for {billing.daysRemaining} days)<br />
                Then £{selectedPackage?.price} on the 1st of each month
              </p>
            )}
          </div>

          {/* Progress Steps */}
          {currentStep < 5 && (
            <div className="flex items-center justify-between mb-12 overflow-x-auto">
              {['Client Info', 'PARQ', 'Payment', 'Health Questions'].map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index + 1 === currentStep 
                      ? 'border-cyan-400 bg-cyan-400 text-gray-900' 
                      : index + 1 < currentStep 
                      ? 'border-green-400 bg-green-400 text-gray-900'
                      : 'border-gray-600 text-gray-400'
                  } font-bold text-sm flex-shrink-0`}>
                    {index + 1 < currentStep ? <Check size={20} /> : index + 1}
                  </div>
                  <span className={`ml-2 text-xs ${index + 1 === currentStep ? 'text-cyan-400' : index + 1 < currentStep ? 'text-green-400' : 'text-gray-400'} hidden sm:block`}>
                    {step}
                  </span>
                  {index < 3 && (
                    <div className={`h-1 w-8 sm:w-16 mx-2 ${
                      index + 1 < currentStep ? 'bg-green-400' : 'bg-gray-600'
                    } flex-shrink-0`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step Content */}
          <div className="bg-gray-800 rounded-2xl border border-cyan-500/30 p-8">
            {currentStep === 1 && (
              <Step1ClientInfo 
                clientInfo={clientInfo}
                onChange={handleClientInfoChange}
                countries={countries}
              />
            )}

            {currentStep === 2 && (
              <Step2PARQ
                questions={parqQuestions}
                responses={parqResponses}
                onChange={handleParqChange}
                needsDoctorApproval={needsDoctorApproval}
                hasDoctorApproval={hasDoctorApproval}
                setHasDoctorApproval={setHasDoctorApproval}
              />
            )}

            {currentStep === 3 && (
              <Step3Payment
                packageInfo={selectedPackage}
                billing={billing}
              />
            )}

            {currentStep === 4 && (
              <Step4Health
                questions={healthQuestions}
                responses={healthResponses}
                onChange={handleHealthChange}
              />
            )}

            {currentStep === 5 && (
              <Step5Success
                clientEmail={clientInfo.email}
              />
            )}

            {/* Navigation Buttons */}
            {currentStep < 5 && (
              <div className="flex gap-4 mt-8">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    <ArrowLeft size={20} />
                    Back
                  </button>
                )}
                <button
                  onClick={nextStep}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      {currentStep === 4 ? 'Complete Purchase' : 'Continue'}
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertModal
        show={alertModal.show}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ show: false, title: '', message: '', type: 'info' })}
      />
    </div>
  );
};

// Step 1: Client Information
const Step1ClientInfo = ({ clientInfo, onChange, countries }) => (
  <div className="space-y-6">
    <h3 className="text-2xl font-bold text-cyan-400 mb-6">Your Information</h3>
    
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
        <input
          type="text"
          value={clientInfo.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Age *</label>
        <input
          type="number"
          value={clientInfo.age}
          onChange={(e) => onChange('age', e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          placeholder="25"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
        <input
          type="email"
          value={clientInfo.email}
          onChange={(e) => onChange('email', e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
        <input
          type="tel"
          value={clientInfo.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          placeholder="+44 7123 456789"
        />
      </div>
    </div>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Address Line 1 *</label>
        <input
          type="text"
          value={clientInfo.addressLine1}
          onChange={(e) => onChange('addressLine1', e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          placeholder="123 Main Street"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Address Line 2</label>
        <input
          type="text"
          value={clientInfo.addressLine2}
          onChange={(e) => onChange('addressLine2', e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          placeholder="Apartment, suite, etc."
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
          <input
            type="text"
            value={clientInfo.city}
            onChange={(e) => onChange('city', e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            placeholder="London"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Postcode *</label>
          <input
            type="text"
            value={clientInfo.postcode}
            onChange={(e) => onChange('postcode', e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            placeholder="SW1A 1AA"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Country *</label>
          <select
            value={clientInfo.country}
            onChange={(e) => onChange('country', e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            {countries.map(country => (
              <option key={country.code} value={country.code}>{country.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>

    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-cyan-400 mt-6">Your Fitness Goals</h4>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Goal 1 *</label>
        <input
          type="text"
          value={clientInfo.goal1}
          onChange={(e) => onChange('goal1', e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          placeholder="e.g., Lose 20 pounds"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Goal 2</label>
        <input
          type="text"
          value={clientInfo.goal2}
          onChange={(e) => onChange('goal2', e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          placeholder="e.g., Build muscle"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Goal 3</label>
        <input
          type="text"
          value={clientInfo.goal3}
          onChange={(e) => onChange('goal3', e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          placeholder="e.g., Improve overall health"
        />
      </div>
    </div>
  </div>
);

// Step 2: PARQ
const Step2PARQ = ({ questions, responses, onChange, needsDoctorApproval, hasDoctorApproval, setHasDoctorApproval }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-2xl font-bold text-cyan-400 mb-2">Physical Activity Readiness (PARQ)</h3>
      <p className="text-gray-400 mb-6">Please answer the following questions honestly</p>
    </div>

    {questions.map((q, index) => (
      <div key={q.id} className="border-b border-gray-700 pb-4">
        <p className="text-white mb-3">{index + 1}. {q.question}</p>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={q.id}
              value="yes"
              checked={responses[q.id] === 'yes'}
              onChange={(e) => onChange(q.id, e.target.value)}
              className="w-4 h-4 text-cyan-500"
            />
            <span className="text-gray-300">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={q.id}
              value="no"
              checked={responses[q.id] === 'no'}
              onChange={(e) => onChange(q.id, e.target.value)}
              className="w-4 h-4 text-cyan-500"
            />
            <span className="text-gray-300">No</span>
          </label>
        </div>
      </div>
    ))}

    {needsDoctorApproval && (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-6">
        <p className="text-yellow-400 mb-3">
          Based on your responses, you must have doctor approval before starting a training program.
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasDoctorApproval}
            onChange={(e) => setHasDoctorApproval(e.target.checked)}
            className="w-5 h-5 mt-1 text-cyan-500"
          />
          <span className="text-white">
            I confirm that I have received approval from my doctor to participate in physical activity and training.
          </span>
        </label>
      </div>
    )}
  </div>
);

// Step 3: Payment
const Step3Payment = ({ packageInfo, billing }) => (
  <div className="space-y-6">
    <h3 className="text-2xl font-bold text-cyan-400 mb-6">Payment Details</h3>
    
    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-6">
      <h4 className="font-semibold text-cyan-400 mb-2">Billing Information</h4>
      <p className="text-gray-300 text-sm mb-1">
        First payment (pro-rated): <strong>£{billing.proRata}</strong> for {billing.daysRemaining} days
      </p>
      <p className="text-gray-300 text-sm">
        Subsequent billing: <strong>£{packageInfo.price}</strong> on the 1st of each month
      </p>
    </div>

    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <CardElement
        options={{
          hidePostalCode: true, // We collect postcode from address form
          style: {
            base: {
              fontSize: '16px',
              color: '#fff',
              '::placeholder': {
                color: '#9ca3af',
              },
            },
            invalid: {
              color: '#ef4444',
            },
          },
        }}
      />
    </div>

    <p className="text-gray-400 text-sm">
      Your payment information is secure and encrypted. You'll be charged immediately and then monthly on the 1st.
    </p>
  </div>
);

// Step 4: Health Questions
const Step4Health = ({ questions, responses, onChange }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-2xl font-bold text-cyan-400 mb-2">Health & Fitness Questions</h3>
      <p className="text-gray-400 mb-6">Help us personalize your experience</p>
    </div>

    {questions.map((q, index) => (
      <div key={q.id} className="space-y-2">
        <label className="block text-white font-medium">
          {index + 1}. {q.question}
        </label>
        
        {q.type === 'text' && (
          <textarea
            value={responses[q.id] || ''}
            onChange={(e) => onChange(q.id, e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            rows="3"
            placeholder="Your answer..."
          />
        )}

        {q.type === 'multiple_choice' && (
          <div className="space-y-2">
            {q.options.map(option => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={q.id}
                  value={option}
                  checked={responses[q.id] === option}
                  onChange={(e) => onChange(q.id, e.target.value)}
                  className="w-4 h-4 text-cyan-500"
                />
                <span className="text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        )}

        {q.type === 'yes_no' && (
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={q.id}
                value="yes"
                checked={responses[q.id] === 'yes'}
                onChange={(e) => onChange(q.id, e.target.value)}
                className="w-4 h-4 text-cyan-500"
              />
              <span className="text-gray-300">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={q.id}
                value="no"
                checked={responses[q.id] === 'no'}
                onChange={(e) => onChange(q.id, e.target.value)}
                className="w-4 h-4 text-cyan-500"
              />
              <span className="text-gray-300">No</span>
            </label>
          </div>
        )}
      </div>
    ))}
  </div>
);

// Step 5: Success
const Step5Success = ({ clientEmail }) => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12">
      <CheckCircle className="text-green-400 mx-auto mb-6" size={80} />
      <h3 className="text-3xl font-bold text-green-400 mb-4">Welcome Aboard!</h3>
      <p className="text-gray-300 mb-6">
        Your purchase is complete. We've sent a password setup email to:
      </p>
      <p className="text-cyan-400 font-semibold text-lg mb-8">{clientEmail}</p>
      <p className="text-gray-400 mb-8">
        Check your email and follow the link to set your password and access your client portal.
      </p>
      <button
        onClick={() => navigate('/client-login')}
        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all"
      >
        Go to Login
      </button>
    </div>
  );
};

const PurchaseFlow = () => (
  <Elements stripe={stripePromise}>
    <PurchaseFlowContent />
  </Elements>
);

export default PurchaseFlow;
