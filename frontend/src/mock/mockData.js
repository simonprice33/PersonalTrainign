// Mock data for Simon Price Personal Training website

export const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    age: 32,
    location: "Manchester, UK",
    rating: 5,
    comment: "Simon completely transformed my approach to fitness. Lost 25lbs in 4 months and gained so much confidence. His nutrition plans are amazing!",
    transformation: "Lost 25lbs in 4 months",
    image: "/api/placeholder/80/80"
  },
  {
    id: 2,
    name: "Mike Chen",
    age: 28,
    location: "London, UK", 
    rating: 5,
    comment: "The 24/7 support really makes the difference. Simon is always there when I need motivation or have questions about my workout.",
    transformation: "Gained 15lbs muscle mass",
    image: "/api/placeholder/80/80"
  },
  {
    id: 3,
    name: "Emma Thompson",
    age: 35,
    location: "Birmingham, UK",
    rating: 5,
    comment: "Best investment I've ever made. The weekly check-ins keep me accountable and the video reviews helped perfect my form.",
    transformation: "Completed first marathon",
    image: "/api/placeholder/80/80"
  },
  {
    id: 4,
    name: "James Rodriguez",
    age: 45,
    location: "Leeds, UK",
    rating: 5,
    comment: "Simon's discipline coaching changed my life. I finally have sustainable habits that stick. Down 40lbs and feeling incredible!",
    transformation: "Lost 40lbs, improved health markers",
    image: "/api/placeholder/80/80"
  },
  {
    id: 5,
    name: "Lisa Parker",
    age: 29,
    location: "Bristol, UK",
    rating: 5,
    comment: "The app is fantastic and Simon's personalized approach made all the difference. Never felt stronger or more confident!",
    transformation: "Increased strength by 150%",
    image: "/api/placeholder/80/80"
  },
  {
    id: 6,
    name: "David Wilson",
    age: 38,
    location: "Sheffield, UK",
    rating: 5,
    comment: "Simon doesn't just train your body, he transforms your mindset. The goal setting sessions were life-changing.",
    transformation: "Complete lifestyle transformation",
    image: "/api/placeholder/80/80"
  }
];

export const aboutStats = {
  experience: "5+ Years",
  clients: "500+",
  successRate: "95%",
  rating: "4.9/5",
  certifications: [
    "NASM Certified Personal Trainer",
    "Precision Nutrition Coach",
    "Functional Movement Screen Specialist", 
    "Mental Performance Coach"
  ]
};

export const contactInfo = {
  phone: "+44 7123 456789",
  email: "simon@simonpricept.com",
  location: "Greater Manchester, UK",
  socialMedia: {
    instagram: "@simonpricept",
    facebook: "Simon Price Personal Training",
    linkedin: "simon-price-pt"
  }
};

// Mock form submission function
export const submitContactForm = async (formData) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('Contact form submitted:', formData);
  
  // Simulate success response
  return {
    success: true,
    message: "Thank you for your interest! Simon will get back to you within 24 hours."
  };
};

// Mock newsletter signup
export const subscribeNewsletter = async (email) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  console.log('Newsletter subscription:', email);
  
  return {
    success: true,
    message: "Successfully subscribed to fitness tips and updates!"
  };
};