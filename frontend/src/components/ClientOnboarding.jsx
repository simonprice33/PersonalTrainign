import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const STRIPE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

// Validate Stripe key exists
if (!STRIPE_KEY) {
  console.error('⚠️ STRIPE PUBLISHABLE KEY NOT FOUND IN ENVIRONMENT!');
  console.error('Please add REACT_APP_STRIPE_PUBLISHABLE_KEY to /app/frontend/.env');
}

const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#9ca3af'
      }
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444'
    }
  }
};

const OnboardingForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [prefilledData, setPrefilledData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const [formData, setFormData] = useState({
    dateOfBirth: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    country: 'GB',
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactRelationship: ''
  });

  // Complete list of countries with ISO codes
  const countries = [
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BR', name: 'Brazil' },
    { code: 'BN', name: 'Brunei' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' },
    { code: 'CV', name: 'Cape Verde' },
    { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'KM', name: 'Comoros' },
    { code: 'CG', name: 'Congo' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CU', name: 'Cuba' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'DK', name: 'Denmark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'EE', name: 'Estonia' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GR', name: 'Greece' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kyrgyzstan' },
    { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libya' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MK', name: 'North Macedonia' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malta' },
    { code: 'MH', name: 'Marshall Islands' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'MX', name: 'Mexico' },
    { code: 'FM', name: 'Micronesia' },
    { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolia' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'KP', name: 'North Korea' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palau' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papua New Guinea' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'LC', name: 'Saint Lucia' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', name: 'Samoa' },
    { code: 'SM', name: 'San Marino' },
    { code: 'ST', name: 'Sao Tome and Principe' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KR', name: 'South Korea' },
    { code: 'SS', name: 'South Sudan' },
    { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SY', name: 'Syria' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TJ', name: 'Tajikistan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' },
    { code: 'TG', name: 'Togo' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vatican City' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Yemen' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' }
  ];

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid payment link. Please request a new link.');
      setLoading(false);
      return;
    }

    setToken(tokenParam);
    validateToken(tokenParam);
    initializeStripe();
  }, [searchParams]);

  const validateToken = async (tokenValue) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/client/validate-token`, {
        token: tokenValue
      });

      if (response.data.success) {
        setPrefilledData(response.data.data);
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired link');
      setLoading(false);
    }
  };

  const initializeStripe = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/client/create-setup-intent`);
      if (response.data.success) {
        setClientSecret(response.data.clientSecret);
      }
    } catch (err) {
      console.error('Failed to initialize Stripe:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Create payment method
      const cardElement = elements.getElement(CardElement);
      // Build address object - only include postal_code if it exists and is not empty
      const billingAddress = {
        line1: formData.addressLine1,
        city: formData.city,
        country: formData.country
      };
      
      // Add optional fields only if they exist
      if (formData.addressLine2) {
        billingAddress.line2 = formData.addressLine2;
      }
      
      // Only include postal_code if it's not empty (to avoid Stripe validation issues)
      if (formData.postcode && formData.postcode.trim()) {
        billingAddress.postal_code = formData.postcode.trim();
      }

      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: prefilledData.name,
              email: prefilledData.email,
              phone: prefilledData.telephone,
              address: billingAddress
            }
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setSubmitting(false);
        return;
      }

      // Complete onboarding with backend
      const response = await axios.post(`${BACKEND_URL}/api/client/complete-onboarding`, {
        token,
        paymentMethodId: setupIntent.payment_method,
        ...formData
      });

      if (response.data.success) {
        setSuccess(true);
        // Redirect to success page after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete registration. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-cyan-500 mx-auto mb-4" size={48} />
          <p className="text-white text-lg">Loading registration form...</p>
        </div>
      </div>
    );
  }

  if (error && !prefilledData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 border border-red-500/20">
          <div className="text-center">
            <XCircle size={64} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Invalid Link</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <p className="text-gray-400 text-sm">
              Please contact Simon Price PT to request a new payment link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 border border-green-500/20">
          <div className="text-center">
            <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Registration Complete!</h2>
            <p className="text-gray-300 mb-6">
              Your subscription has been set up successfully. Simon will be in touch shortly!
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-300 text-sm">
                A confirmation email has been sent to {prefilledData.email}
              </p>
            </div>
            <p className="text-gray-400 text-sm">
              Redirecting to homepage in 5 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_personal-trainer-24/artifacts/g2n7e7ey_Logo%20800x770.png" 
            alt="Simon Price PT" 
            className="h-20 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Registration</h1>
          <p className="text-gray-400">
            Just a few more details to get started with your personal training journey
          </p>
        </div>

        {/* Pre-filled Info */}
        <div className="bg-gray-800 rounded-xl p-6 border border-cyan-500/20 mb-6">
          <h3 className="text-white font-semibold mb-4">Your Details:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Name</p>
              <p className="text-white font-medium">{prefilledData?.name}</p>
            </div>
            <div>
              <p className="text-gray-400">Email</p>
              <p className="text-white font-medium">{prefilledData?.email}</p>
            </div>
            <div>
              <p className="text-gray-400">Phone</p>
              <p className="text-white font-medium">{prefilledData?.telephone}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Monthly Price</p>
                <p className="text-green-400 font-bold text-lg">£{prefilledData?.price}</p>
              </div>
              <div>
                <p className="text-gray-400">Billing Date</p>
                <p className="text-white font-medium">
                  {prefilledData?.billingDay}{prefilledData?.billingDay === 1 ? 'st' : prefilledData?.billingDay === 2 ? 'nd' : prefilledData?.billingDay === 3 ? 'rd' : 'th'} of each month
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Personal Details */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Personal Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  name="dateOfBirth"
                  id="dateOfBirth"
                  autoComplete="bday"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  style={{ colorScheme: 'dark' }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select your date of birth
                </p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  name="addressLine1"
                  autoComplete="address-line1"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  autoComplete="address-line2"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    name="city"
                    autoComplete="address-level2"
                    data-lpignore="true"
                    data-form-type="other"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Bognor Regis"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Postcode / Zip Code *
                  </label>
                  <input
                    type="text"
                    required
                    name="postcode"
                    autoComplete="postal-code"
                    data-lpignore="true"
                    data-form-type="other"
                    value={formData.postcode}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Enter your postcode or zip code"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Country *
                </label>
                <select
                  required
                  name="country"
                  autoComplete="country"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Emergency Contact</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  name="emergencyContactName"
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Jane Smith"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    name="emergencyContactNumber"
                    autoComplete="tel"
                    data-lpignore="true"
                    data-form-type="other"
                    value={formData.emergencyContactNumber}
                    onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="07123456789"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Relationship *
                  </label>
                  <input
                    type="text"
                    required
                    name="emergencyContactRelationship"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Spouse, Parent, Friend, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Payment Details</h3>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              🔒 Your payment information is secure and encrypted by Stripe
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!stripe || submitting}
            className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? 'Processing...' : `Complete Registration & Pay £${prefilledData?.price}/month`}
          </button>

          <p className="text-center text-gray-400 text-xs mt-4">
            By completing registration, you agree to be charged £{prefilledData?.price} per month starting on the{' '}
            {prefilledData?.billingDay}{prefilledData?.billingDay === 1 ? 'st' : prefilledData?.billingDay === 2 ? 'nd' : prefilledData?.billingDay === 3 ? 'rd' : 'th'} of each month.
          </p>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Powered by Simon Price Personal Training
        </p>
      </div>
    </div>
  );
};

const ClientOnboarding = () => {
  // Show error if Stripe key is missing
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 border border-red-500/20">
          <div className="text-center">
            <XCircle size={64} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Configuration Error</h2>
            <p className="text-gray-300 mb-6">
              Stripe payment system is not configured. Please contact support.
            </p>
            <p className="text-gray-500 text-xs">
              Error: REACT_APP_STRIPE_PUBLISHABLE_KEY is missing
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <OnboardingForm />
    </Elements>
  );
};

export default ClientOnboarding;
