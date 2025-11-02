import RoleBasedTab from "../../components/RoleBasedTab";
import IncidentChart from "../IncidentChart";
import ResponseTimeGraph from "./ResponseTimeGraph";
import { useState, useEffect } from "react";
import IncidentHotspots from "./IncidentHotspots";
import SystemMetrics from "../SystemMetrics";
import TypeOfCrime from "./TypeOfCrime";
import AllIncidents from "./AllIncidents";
import Users from "./Users";
import AssignCase from "./AssignCase";
import axiosInstance from "../../api/axiosConfig";
import { CheckCircle, Users as UsersIcon, Clock, BarChart3, Mail, Shield, Lock, FileText, CreditCard, Wifi, Globe, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import ActivityLog from "./ActivityLog";
import { motion } from "framer-motion";


function DashboardAdmin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [detailedAnalytics, setDetailedAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);


  useEffect(() => {
    const fetchDetailedAnalytics = async () => {
      if (activeTab === 'overview') {
        try {
          const response = await axiosInstance.get('/analytics/detailed');
          setDetailedAnalytics(response.data);
        } catch (err) {
          console.error('Error fetching detailed analytics:', err);
        }
        finally{
          setLoading(false);
        }
      }
    };

    fetchDetailedAnalytics();
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling down 300px
      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(true);
      }

      // Check if at bottom
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;
      
      if (scrollHeight - scrollTop - clientHeight < 100) {
        setIsAtBottom(true);
      } else {
        setIsAtBottom(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  // Transform detailed analytics data for analytics tab
  const systemMetricsData = detailedAnalytics ? [
    {
      title: 'Cases Solved',
      value: detailedAnalytics.case_solved || 0,
      previous: (detailedAnalytics.case_solved || 0) - (detailedAnalytics.case_solved_change || 0),
      unit: 'cases',
      icon: CheckCircle,
      color: 'green',
      analytics: `${detailedAnalytics.case_solved_change >= 0 ? 'Up' : 'Down'} ${Math.abs(detailedAnalytics.case_solved_change || 0)} from last month`,
    },
    {
      title: 'New Users',
      value: detailedAnalytics.new_users || 0,
      previous: (detailedAnalytics.new_users || 0) - (detailedAnalytics.new_users_change || 0),
      unit: 'users',
      icon: UsersIcon,
      color: 'blue',
      analytics: `${detailedAnalytics.new_users_change >= 0 ? 'Up' : 'Down'} ${Math.abs(detailedAnalytics.new_users_change || 0)} from last month`,
    },
    {
      title: 'Avg Response Time',
      value: detailedAnalytics.avg_resolution_time || 0,
      previous: (detailedAnalytics.avg_resolution_time || 0) - (detailedAnalytics.avg_resolution_time_change || 0),
      unit: 'hrs',
      icon: Clock,
      color: 'purple',
      analytics: `${detailedAnalytics.avg_resolution_time_change <= 0 ? 'Improved' : 'Increased'} by ${Math.abs(detailedAnalytics.avg_resolution_time_change || 0)} hrs`,
      lowerIsBetter: true,
    },
    {
      title: 'Efficiency',
      value: `${Math.round(detailedAnalytics.efficiency || 0)}%`,
      previous: `${Math.round((detailedAnalytics.efficiency || 0) - (detailedAnalytics.efficiency_change || 0))}%`,
      unit: 'efficiency',
      icon: BarChart3,
      color: 'orange',
      analytics: `${detailedAnalytics.efficiency_change >= 0 ? 'Up' : 'Down'} ${Math.abs(Math.round(detailedAnalytics.efficiency_change || 0))}% from last month`,
    },
  ] : null;

  // Transform incident trend graph data
  const incidentTrendData = detailedAnalytics?.incident_trend_graph?.months?.map((month, index) => ({
    month: month,
    incidents: detailedAnalytics.incident_trend_graph.created[index] || 0,
    resolved: detailedAnalytics.incident_trend_graph.resolved[index] || 0,
  })) || [];

  // Transform category graph data for TypeOfCrime
  const iconList = [Mail, Shield, Lock, FileText, CreditCard, Wifi, Globe, AlertTriangle];
  const categoryData = detailedAnalytics?.category_graph?.categories?.map((category, index) => ({
    type: category || 'Unknown',
    count: detailedAnalytics.category_graph.counts[index] || 0,
    percentage: ((detailedAnalytics.category_graph.counts[index] || 0) /
      detailedAnalytics.category_graph.counts.reduce((a, b) => a + b, 0) * 100).toFixed(1),
    icon: iconList[index % iconList.length],
    color: ['#ef4444', '#f97316', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'][index % 7],
    severity: ['Critical', 'High', 'Medium', 'Low'][Math.floor(Math.random() * 4)],
    trend: `${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 15)}%`,
  })).filter(item => item.count > 0).slice(0, 10) || [];

  // Transform time taken graph data for ResponseTimeGraph
  const responseTimeData = detailedAnalytics?.time_taken_graph ? (() => {
    const priorities = detailedAnalytics.time_taken_graph.priorities || [];
    const timeTaken = detailedAnalytics.time_taken_graph.time_taken || {};
    const counts = detailedAnalytics.time_taken_graph.counts || {};

    // Create time ranges
    const timeRanges = ['0-2h', '2-4h', '4-8h', '8-24h', '24h+'];

    return timeRanges.map(range => {
      const dataPoint = { time: range };
      priorities.forEach(priority => {
        // Distribute counts across time ranges (simplified)
        const priorityCounts = counts[priority] || [0];
        const avgCount = priorityCounts.reduce((a, b) => a + b, 0) / timeRanges.length;
        dataPoint[priority] = Math.round(avgCount);
      });
      return dataPoint;
    });
  })() : [];

  // Transform hotspot graph data
  const hotspotData = detailedAnalytics?.hotspot_graph?.cities?.map((city, index) => ({
    location: city || 'Unknown',
    incidents: detailedAnalytics.hotspot_graph.counts[index] || 0,
    severity: ['critical', 'high', 'medium', 'low'][Math.floor(index / 3) % 4],
    position: {
      top: `${20 + (index * 7) % 60}%`,
      left: `${30 + (index * 11) % 50}%`
    }
  })).filter(item => item.incidents > 0).slice(0, 10) || [];

  // Scroll down helper function
  const scrollDown = () => {
    window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
  };

  // Scroll up helper function
  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle scroll based on position
  const handleScrollClick = () => {
    if (isAtBottom) {
      scrollUp();
    } else {
      scrollDown();
    }
  };

  return (
    <div className="mx-6">
      <div className="h-21" />
      <div className="m-4">
        <h1 className="text-3xl font-semibold text-blue-500">Command Center</h1>
        <p className="text-sm text-gray-400 mt-1">Real-time incident tracking and management</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64 mt-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 mt-12">
          {error}
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && detailedAnalytics && (
        <>
          <RoleBasedTab activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === "users" && <Users />}
          {activeTab === "incidents" && <AllIncidents />}
          {activeTab === 'overview' && (
            <>
              {detailedAnalytics ? (
                <>
                  <div className="flex gap-2 mt-12">
                    <IncidentChart data={incidentTrendData} />
                    <SystemMetrics data={systemMetricsData} />
                  </div>
                  <TypeOfCrime data={categoryData} />
                  <ResponseTimeGraph data={responseTimeData} />
                  <IncidentHotspots hotspots={hotspotData} />

                </>
              ) : (
                <div className="flex items-center justify-center h-64 mt-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              )}
            </>
          )}
          {activeTab === 'team' && (
            <div className="">
              <AssignCase />
            </div>
          )}
          {activeTab === 'activity' && <ActivityLog />}
        </>
      )}

      {/* Floating Scroll Button */}
      {showScrollButton && (
        <motion.button
          whileHover={{ scale: [1, 1.1, 1] }}
          onClick={handleScrollClick}
          className="fixed bottom-6 right-6 z-50 p-3 bg-blue-500/90 backdrop-blur-sm text-white rounded-full shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all duration-300 group animate-pulse"
          aria-label={isAtBottom ? "Scroll to top" : "Scroll down"}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {isAtBottom ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </motion.div>
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-900/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {isAtBottom ? "Top" : "More"}
          </span>
        </motion.button>
      )}
    </div>
  );
}

export default DashboardAdmin;