import { CheckCircle, Users, Clock, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

function getChange(current, previous, lowerIsBetter = false) {
  if (typeof current === 'string' || typeof previous === 'string') return null;
  const change = ((current - previous) / previous) * 100;
  if (lowerIsBetter) return -change;
  return change;
}

const colorMap = {
  green: 'from-green-500/20 to-green-600/20 border-green-500/30',
  blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
};

const SystemMetrics = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Default data
  const defaultMetricsData = [
    {
      title: 'Cases Solved',
      value: 245,
      previous: 220,
      unit: 'cases',
      icon: CheckCircle,
      color: 'green',
      analytics: 'Up 11.4% from last month',
    },
    {
      title: 'New Users',
      value: 1847,
      previous: 1650,
      unit: 'users',
      icon: Users,
      color: 'blue',
      analytics: 'Up 12% from last month',
    },
    {
      title: 'Avg Response Time',
      value: 4.2,
      previous: 5.8,
      unit: 'hrs',
      icon: Clock,
      color: 'purple',
      analytics: 'Down 27.6% (faster)',
      lowerIsBetter: true,
    },
    {
      title: 'Efficiency',
      value: '92%',
      previous: '88%',
      unit: 'efficiency',
      icon: BarChart3,
      color: 'orange',
      analytics: 'Up 4% from last month',
    },
  ];

  // Use provided data or default
  const metricsData = data || defaultMetricsData;

  // Map icon names to components if data contains strings
  const getIconComponent = (icon) => {
    // If icon is already a component, return it
    if (typeof icon === 'function') {
      return icon;
    }
    
    // If icon is a string, map it to a component
    if (typeof icon === 'string') {
      const iconMap = {
        CheckCircle,
        Users,
        UsersIcon: Users,
        Clock,
        BarChart3,
      };
      return iconMap[icon] || CheckCircle;
    }
    
    // Default fallback
    return CheckCircle;
  };

useEffect(() => {
    if (hoveredIndex === null) {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % metricsData.length);
        }, 3000);
        return () => clearInterval(interval);
    }
}, [hoveredIndex, metricsData.length]);

  return (
    <div className="w-full py-6 px-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((card, idx) => {
          const Icon = getIconComponent(card.icon);
          const change = getChange(card.value, card.previous, card.lowerIsBetter);
          const isPositive = change !== null ? change > 0 : true;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;
          const isActive = activeIndex === idx || hoveredIndex === idx;
          
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: isActive ? -8 : 0,
                scale: isActive ? 1.1 : 1,
                zIndex: isActive ? 10 : 1
              }}
              transition={{ 
                duration: 0.5,
                scale: { duration: 0.4, type: "spring", stiffness: 300 },
                y: { duration: 0.4 }
              }}
              style={{
                boxShadow: isActive 
                  ? `0 20px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px ${card.color === 'green' ? 'rgba(34, 197, 94, 0.3)' : card.color === 'blue' ? 'rgba(59, 130, 246, 0.3)' : card.color === 'purple' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`
                  : undefined
              }}
              className={`relative rounded-xl border ${colorMap[card.color]} bg-gradient-to-br ${colorMap[card.color]} backdrop-blur-sm p-6 transition-all duration-300 cursor-pointer`}
            >
              <div className="absolute inset-0 bg-black/40 rounded-xl" />
              
              {/* Enhanced content with extra info when active */}
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center justify-between mb-2">
                  <span className={`${isActive ? 'text-base' : 'text-sm'} font-semibold text-white transition-all duration-300`}>{card.title}</span>
                  <motion.span 
                    animate={{ scale: isActive ? 1.15 : 1 }}
                    className={`p-2 rounded-lg ${card.color === 'green' ? 'bg-green-500/20 text-green-400' : card.color === 'blue' ? 'bg-blue-500/20 text-blue-400' : card.color === 'purple' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'}`}
                  >
                    <Icon className={`${isActive ? 'h-6 w-6' : 'h-5 w-5'} transition-all duration-300`} />
                  </motion.span>
                </div>
                <div className="flex items-end gap-2">
                  <span className={`${isActive ? 'text-3xl' : 'text-2xl'} font-bold text-white transition-all duration-300`}>{card.value}</span>
                  <span className="text-xs text-gray-400">{card.unit}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {change !== null && (
                    <span className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      <TrendIcon className="h-3 w-3" />
                      {Math.abs(change).toFixed(1)}%
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{card.analytics}</span>
                </div>
                
                {/* Additional info shown when active */}
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ 
                    opacity: isActive ? 1 : 0,
                    height: isActive ? 'auto' : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-2 bg-gray-800/50 rounded-md">
                    <div className="text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>Current Month:</span>
                        <span className="font-semibold text-white">{card.value} {card.unit}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Target:</span>
                        <span className="font-semibold text-blue-400">{typeof card.value === 'number' ? Math.round(card.value * 1.15) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                <div className="mt-1 pt-2 border-t border-gray-700/50">
                  <span className="text-xs text-gray-500">Last month: <span className="font-semibold text-gray-400">{card.previous}</span></span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SystemMetrics;
