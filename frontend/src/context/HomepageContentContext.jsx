import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const HomepageContentContext = createContext(null);

export const HomepageContentProvider = ({ children }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/homepage-content`);
      if (response.data.success && response.data.content) {
        setContent(response.data.content);
      }
    } catch (err) {
      console.error('Failed to fetch homepage content:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshContent = () => {
    setLoading(true);
    fetchContent();
  };

  return (
    <HomepageContentContext.Provider value={{ content, loading, error, refreshContent }}>
      {children}
    </HomepageContentContext.Provider>
  );
};

export const useHomepageContent = () => {
  const context = useContext(HomepageContentContext);
  if (!context) {
    throw new Error('useHomepageContent must be used within a HomepageContentProvider');
  }
  return context;
};

// Icon mapping helper
export const getIconComponent = (iconName) => {
  const icons = {
    Dumbbell: require('lucide-react').Dumbbell,
    Apple: require('lucide-react').Apple,
    MessageCircle: require('lucide-react').MessageCircle,
    Calendar: require('lucide-react').Calendar,
    Video: require('lucide-react').Video,
    Target: require('lucide-react').Target,
    Zap: require('lucide-react').Zap,
    TrendingUp: require('lucide-react').TrendingUp,
    Smartphone: require('lucide-react').Smartphone,
    Trophy: require('lucide-react').Trophy,
    Users: require('lucide-react').Users,
    Star: require('lucide-react').Star,
    Award: require('lucide-react').Award,
    CheckCircle: require('lucide-react').CheckCircle,
    Clock: require('lucide-react').Clock,
    Shield: require('lucide-react').Shield,
    Phone: require('lucide-react').Phone,
    Mail: require('lucide-react').Mail,
    MapPin: require('lucide-react').MapPin,
    Heart: require('lucide-react').Heart,
    Activity: require('lucide-react').Activity,
    Flame: require('lucide-react').Flame,
    Brain: require('lucide-react').Brain,
    Coffee: require('lucide-react').Coffee,
    Compass: require('lucide-react').Compass,
    Crown: require('lucide-react').Crown,
    Diamond: require('lucide-react').Diamond,
    Gift: require('lucide-react').Gift,
    Globe: require('lucide-react').Globe,
    Headphones: require('lucide-react').Headphones,
    Key: require('lucide-react').Key,
    Layers: require('lucide-react').Layers,
    LifeBuoy: require('lucide-react').LifeBuoy,
    Lightbulb: require('lucide-react').Lightbulb,
    Link: require('lucide-react').Link,
    Lock: require('lucide-react').Lock,
    Medal: require('lucide-react').Medal,
    Music: require('lucide-react').Music,
    Palette: require('lucide-react').Palette,
    Percent: require('lucide-react').Percent,
    PieChart: require('lucide-react').PieChart,
    Rocket: require('lucide-react').Rocket,
    Settings: require('lucide-react').Settings,
    Sparkles: require('lucide-react').Sparkles,
    Sun: require('lucide-react').Sun,
    ThumbsUp: require('lucide-react').ThumbsUp,
    Timer: require('lucide-react').Timer,
    Truck: require('lucide-react').Truck,
    Umbrella: require('lucide-react').Umbrella,
    Wand2: require('lucide-react').Wand2,
    Wifi: require('lucide-react').Wifi,
    Wrench: require('lucide-react').Wrench
  };
  return icons[iconName] || icons.Star;
};

export default HomepageContentContext;
