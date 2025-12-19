import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Calculator, Mail, TrendingDown, TrendingUp, Minus, Activity } from 'lucide-react';
import AlertModal from './AlertModal';

const TDEECalculator = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1 = form, 2 = results
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    weightUnit: 'kg',
    weight: '',
    weightStone: '',
    weightLbs: '',
    heightUnit: 'cm',
    height: '',
    heightFeet: '',
    heightInches: '',
    activityLevel: '1.2',
    goal: 'maintain',
    bodyFat: '',
    email: '',
    joinMailingList: false
  });

  const [results, setResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' });

  if (!isOpen) return null;

  // Convert weight to kg
  const getWeightInKg = () => {
    if (formData.weightUnit === 'kg') {
      return parseFloat(formData.weight);
    } else if (formData.weightUnit === 'lbs') {
      return parseFloat(formData.weight) * 0.453592;
    } else if (formData.weightUnit === 'stone') {
      const stone = parseFloat(formData.weightStone) || 0;
      const lbs = parseFloat(formData.weightLbs) || 0;
      return (stone * 14 + lbs) * 0.453592;
    }
    return 0;
  };

  // Convert height to cm
  const getHeightInCm = () => {
    if (formData.heightUnit === 'cm') {
      return parseFloat(formData.height);
    } else if (formData.heightUnit === 'imperial') {
      const feet = parseFloat(formData.heightFeet) || 0;
      const inches = parseFloat(formData.heightInches) || 0;
      return (feet * 12 + inches) * 2.54;
    }
    return 0;
  };

  // Calculate BMR using Mifflin-St Jeor equation
  const calculateBMR = (weightKg, heightCm, age, gender) => {
    if (gender === 'male') {
      return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
  };

  // Calculate BMR using Katch-McArdle (if body fat provided)
  const calculateBMRWithBodyFat = (weightKg, bodyFatPercent) => {
    const leanBodyMass = weightKg * (1 - bodyFatPercent / 100);
    return 370 + (21.6 * leanBodyMass);
  };

  // Calculate TDEE
  const calculateTDEE = (bmr, activityLevel) => {
    return bmr * parseFloat(activityLevel);
  };

  // Calculate goal calories
  const calculateGoalCalories = (tdee, goal) => {
    if (goal === 'lose') {
      return tdee - 500; // 500 calorie deficit
    } else if (goal === 'gain') {
      return tdee + 300; // 300 calorie surplus
    }
    return tdee; // maintain
  };

  // Calculate macros using Simon Price PT method
  const calculateMacros = (goalCalories, weightKg, goal) => {
    // Set protein based on body weight (consistent across all goals)
    const proteinGrams = Math.round(weightKg * 2); // 2g per kg
    const proteinCalories = proteinGrams * 4;

    // Set fat percentage based on goal
    let fatPercentage = 0.25; // 25% for maintain
    if (goal === 'lose') {
      fatPercentage = 0.25; // 25% for cutting
    } else if (goal === 'gain') {
      fatPercentage = 0.30; // 30% for bulking
    }

    const fatCalories = goalCalories * fatPercentage;
    const fatGrams = Math.round(fatCalories / 9);

    // Remaining calories go to carbs
    const carbCalories = goalCalories - proteinCalories - fatCalories;
    const carbGrams = Math.round(carbCalories / 4);

    return { 
      protein: proteinGrams, 
      carbs: carbGrams, 
      fat: fatGrams 
    };
  };

  const handleCalculate = () => {
    const weightKg = getWeightInKg();
    const heightCm = getHeightInCm();
    const age = parseInt(formData.age);

    if (!weightKg || !heightCm || !age) {
      setAlertModal({
        show: true,
        title: 'Missing Information',
        message: 'Please fill in all required fields',
        type: 'warning'
      });
      return;
    }

    let bmr;
    if (formData.bodyFat && parseFloat(formData.bodyFat) > 0) {
      bmr = calculateBMRWithBodyFat(weightKg, parseFloat(formData.bodyFat));
    } else {
      bmr = calculateBMR(weightKg, heightCm, age, formData.gender);
    }

    const tdee = calculateTDEE(bmr, formData.activityLevel);
    const goalCalories = calculateGoalCalories(tdee, formData.goal);
    const macros = calculateMacros(goalCalories, weightKg, formData.goal);

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      goalCalories: Math.round(goalCalories),
      macros
    });

    setStep(2);
  };

  const handleEmailResults = async () => {
    if (!formData.email) {
      alert('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/tdee-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          joinMailingList: formData.joinMailingList,
          results: results,
          userInfo: {
            age: formData.age,
            gender: formData.gender,
            weight: `${formData.weightUnit === 'kg' ? formData.weight + ' kg' : formData.weightUnit === 'lbs' ? formData.weight + ' lbs' : formData.weightStone + ' st ' + formData.weightLbs + ' lbs'}`,
            height: `${formData.heightUnit === 'cm' ? formData.height + ' cm' : formData.heightFeet + '\' ' + formData.heightInches + '"'}`,
            activityLevel: formData.activityLevel,
            goal: formData.goal
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus({ type: 'success', message: 'Results sent to your email successfully!' });
      } else {
        throw new Error(data.message || 'Failed to send email');
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: error.message || 'Failed to send email. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleClose = () => {
    setStep(1);
    setResults(null);
    setSubmitStatus(null);
    setFormData({
      age: '',
      gender: 'male',
      weightUnit: 'kg',
      weight: '',
      weightStone: '',
      weightLbs: '',
      heightUnit: 'cm',
      height: '',
      heightFeet: '',
      heightInches: '',
      activityLevel: '1.2',
      goal: 'maintain',
      bodyFat: '',
      email: '',
      joinMailingList: false
    });
    onClose();
  };

  const activityLevels = [
    { value: '1.2', label: 'Sedentary', description: 'Little or no exercise' },
    { value: '1.375', label: 'Light', description: 'Exercise 1-3 times/week' },
    { value: '1.55', label: 'Moderate', description: 'Exercise 4-5 times/week' },
    { value: '1.725', label: 'Active', description: 'Daily exercise or intense 3-4 times/week' },
    { value: '1.9', label: 'Very Active', description: 'Intense exercise 6-7 times/week' }
  ];

  const goals = [
    { value: 'lose', label: 'Lose Weight', icon: TrendingDown, description: '500 cal deficit' },
    { value: 'maintain', label: 'Maintain Weight', icon: Minus, description: 'Maintain current' },
    { value: 'gain', label: 'Gain Weight', icon: TrendingUp, description: '300 cal surplus' }
  ];

  const modalContent = (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }} onClick={handleClose}></div>
      
      {/* Modal Panel */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ pointerEvents: 'none' }}>
        <div 
          className="relative w-full max-w-5xl flex flex-col rounded-3xl my-auto"
          style={{ background: 'var(--bg-card)', maxHeight: 'calc(85vh + 35px)', pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div 
          className="flex-shrink-0 p-3 border-b flex items-center justify-between rounded-t-3xl"
          style={{ 
            background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-hover) 100%)',
            borderColor: 'var(--border-medium)'
          }}
        >
          <div className="flex items-center gap-2">
            <Calculator size={20} className="text-white" />
            <h2 className="text-lg font-bold text-white">TDEE Calculator</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            /* Form Step */
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Age *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    required
                    min="15"
                    max="100"
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ 
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="e.g., 30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ 
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Weight Section */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Weight *
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, weightUnit: 'kg' }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      formData.weightUnit === 'kg' 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    style={{ 
                      background: formData.weightUnit === 'kg' ? 'var(--brand-primary)' : 'var(--bg-subtle)'
                    }}
                  >
                    KG
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, weightUnit: 'lbs' }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      formData.weightUnit === 'lbs' 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    style={{ 
                      background: formData.weightUnit === 'lbs' ? 'var(--brand-primary)' : 'var(--bg-subtle)'
                    }}
                  >
                    LBS
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, weightUnit: 'stone' }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      formData.weightUnit === 'stone' 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    style={{ 
                      background: formData.weightUnit === 'stone' ? 'var(--brand-primary)' : 'var(--bg-subtle)'
                    }}
                  >
                    STONE
                  </button>
                </div>

                {(formData.weightUnit === 'kg' || formData.weightUnit === 'lbs') && (
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    required
                    step="0.1"
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ 
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder={`Enter weight in ${formData.weightUnit}`}
                  />
                )}

                {formData.weightUnit === 'stone' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="weightStone"
                      value={formData.weightStone}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ 
                        border: '1px solid var(--border-medium)',
                        background: 'var(--bg-page)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Stone"
                    />
                    <input
                      type="number"
                      name="weightLbs"
                      value={formData.weightLbs}
                      onChange={handleInputChange}
                      min="0"
                      max="13"
                      step="0.1"
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ 
                        border: '1px solid var(--border-medium)',
                        background: 'var(--bg-page)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Pounds"
                    />
                  </div>
                )}
              </div>

              {/* Height Section */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Height *
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, heightUnit: 'cm' }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      formData.heightUnit === 'cm' 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    style={{ 
                      background: formData.heightUnit === 'cm' ? 'var(--brand-primary)' : 'var(--bg-subtle)'
                    }}
                  >
                    CM
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, heightUnit: 'imperial' }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      formData.heightUnit === 'imperial' 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    style={{ 
                      background: formData.heightUnit === 'imperial' ? 'var(--brand-primary)' : 'var(--bg-subtle)'
                    }}
                  >
                    FT/IN
                  </button>
                </div>

                {formData.heightUnit === 'cm' && (
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ 
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Enter height in cm"
                  />
                )}

                {formData.heightUnit === 'imperial' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="heightFeet"
                      value={formData.heightFeet}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="8"
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ 
                        border: '1px solid var(--border-medium)',
                        background: 'var(--bg-page)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Feet"
                    />
                    <input
                      type="number"
                      name="heightInches"
                      value={formData.heightInches}
                      onChange={handleInputChange}
                      min="0"
                      max="11"
                      className="w-full px-4 py-3 rounded-lg border"
                      style={{ 
                        border: '1px solid var(--border-medium)',
                        background: 'var(--bg-page)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Inches"
                    />
                  </div>
                )}
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Activity Level *
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {activityLevels.map((level) => (
                    <label
                      key={level.value}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer transition-all"
                      style={{ 
                        background: formData.activityLevel === level.value ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                        border: formData.activityLevel === level.value ? '2px solid var(--brand-primary)' : '2px solid transparent'
                      }}
                    >
                      <input
                        type="radio"
                        name="activityLevel"
                        value={level.value}
                        checked={formData.activityLevel === level.value}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <div className="text-center">
                        <div className="font-semibold text-sm mb-1" style={{ color: formData.activityLevel === level.value ? 'white' : 'var(--text-primary)' }}>
                          {level.label}
                        </div>
                        <div className="text-xs leading-tight" style={{ color: formData.activityLevel === level.value ? 'rgba(255,255,255,0.8)' : 'var(--text-light)' }}>
                          {level.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Your Goal *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {goals.map((goal) => {
                    const Icon = goal.icon;
                    return (
                      <label
                        key={goal.value}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer transition-all"
                        style={{ 
                          background: formData.goal === goal.value ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                          border: formData.goal === goal.value ? '2px solid var(--brand-primary)' : '2px solid transparent'
                        }}
                      >
                        <input
                          type="radio"
                          name="goal"
                          value={goal.value}
                          checked={formData.goal === goal.value}
                          onChange={handleInputChange}
                          className="hidden"
                        />
                        <Icon size={18} style={{ color: formData.goal === goal.value ? 'white' : 'var(--brand-primary)' }} />
                        <div className="font-semibold text-sm text-center" style={{ color: formData.goal === goal.value ? 'white' : 'var(--text-primary)' }}>
                          {goal.label}
                        </div>
                        <div className="text-xs text-center" style={{ color: formData.goal === goal.value ? 'rgba(255,255,255,0.8)' : 'var(--text-light)' }}>
                          {goal.description}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Body Fat (Optional) and Calculate Button in same row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Body Fat % <span className="text-xs" style={{ color: 'var(--text-light)' }}>(Optional - for accuracy)</span>
                  </label>
                  <input
                    type="number"
                    name="bodyFat"
                    value={formData.bodyFat}
                    onChange={handleInputChange}
                    min="5"
                    max="50"
                    step="0.1"
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ 
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="e.g., 20"
                  />
                </div>

                {/* Calculate Button */}
                <button
                  onClick={handleCalculate}
                  className="btn-cta group h-fit"
                >
                  Calculate My TDEE
                  <Calculator size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          ) : (
            /* Results Step */
            <div className="space-y-6">
              {/* Main Results */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className="p-6 rounded-2xl text-center"
                  style={{ background: 'var(--bg-subtle)', border: '2px solid var(--border-medium)' }}
                >
                  <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-light)' }}>
                    BMR (Basal Metabolic Rate)
                  </div>
                  <div className="text-3xl font-bold" style={{ color: 'var(--brand-primary)' }}>
                    {results.bmr}
                  </div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
                    calories/day at rest
                  </div>
                </div>

                <div 
                  className="p-6 rounded-2xl text-center"
                  style={{ background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-hover) 100%)' }}
                >
                  <div className="text-sm font-medium mb-2 text-white/80">
                    TDEE (Total Daily Energy)
                  </div>
                  <div className="text-4xl font-bold text-white">
                    {results.tdee}
                  </div>
                  <div className="text-sm mt-1 text-white/80">
                    calories/day to maintain
                  </div>
                </div>

                <div 
                  className="p-6 rounded-2xl text-center"
                  style={{ background: 'var(--bg-subtle)', border: '2px solid var(--brand-primary)' }}
                >
                  <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-light)' }}>
                    Goal Calories
                  </div>
                  <div className="text-3xl font-bold" style={{ color: 'var(--brand-primary)' }}>
                    {results.goalCalories}
                  </div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
                    calories/day for {formData.goal === 'lose' ? 'weight loss' : formData.goal === 'gain' ? 'weight gain' : 'maintenance'}
                  </div>
                </div>
              </div>

              {/* Macro Breakdown */}
              <div 
                className="p-6 rounded-2xl"
                style={{ background: 'var(--bg-subtle)' }}
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Recommended Macronutrients
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1" style={{ color: 'var(--brand-primary)' }}>
                      {results.macros.protein}g
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
                      Protein
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                      {Math.round((results.macros.protein * 4 / results.goalCalories) * 100)}% of calories
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1" style={{ color: 'var(--brand-primary)' }}>
                      {results.macros.carbs}g
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
                      Carbohydrates
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                      {Math.round((results.macros.carbs * 4 / results.goalCalories) * 100)}% of calories
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1" style={{ color: 'var(--brand-primary)' }}>
                      {results.macros.fat}g
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
                      Fats
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                      {Math.round((results.macros.fat * 9 / results.goalCalories) * 100)}% of calories
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Results Section */}
              <div 
                className="p-6 rounded-2xl"
                style={{ background: 'var(--bg-card)', border: '2px solid var(--border-medium)' }}
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Mail size={20} style={{ color: 'var(--brand-primary)' }} />
                  Email Your Results
                </h3>
                
                <div className="space-y-4">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border"
                    style={{ 
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Enter your email address"
                  />

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="joinMailingList"
                      checked={formData.joinMailingList}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: 'var(--brand-primary)' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      Join my mailing list for fitness tips and exclusive offers
                    </span>
                  </label>

                  <button
                    onClick={handleEmailResults}
                    disabled={isSubmitting}
                    className="btn-cta w-full group"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Results to Email
                        <Mail size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {submitStatus && (
                    <div 
                      className={`p-4 rounded-xl ${
                        submitStatus.type === 'success' 
                          ? 'bg-green-500/20 border-2 border-green-500' 
                          : 'bg-red-500/20 border-2 border-red-500'
                      }`}
                    >
                      <p style={{ color: submitStatus.type === 'success' ? '#10b981' : '#ef4444' }}>
                        {submitStatus.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div 
                className="p-6 rounded-2xl text-center"
                style={{ background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-hover) 100%)' }}
              >
                <Activity size={32} className="text-white mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2 text-white">
                  Ready to Achieve Your Goals?
                </h3>
                <p className="text-white/90 mb-4">
                  Get personalized training and nutrition plans tailored to your results
                </p>
                <button
                  onClick={() => {
                    handleClose();
                    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  Book Free Consultation
                </button>
              </div>

              {/* Calculate Again */}
              <button
                onClick={() => setStep(1)}
                className="btn-secondary w-full"
              >
                Calculate Again
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default TDEECalculator;
