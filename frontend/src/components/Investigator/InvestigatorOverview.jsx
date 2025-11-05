import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Award,
  Calendar,
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';

const InvestigatorOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_assigned: 0,
    in_progress: 0,
    resolved: 0,
    success_rate: 0,
    cases_this_month: 0,
    upcoming_deadlines: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axiosInstance.get('/analytics/summary');
        const data = response.data;
        
        setStats({
          total_assigned: data.total_assigned_cases || 0,
          in_progress: data.in_progress_cases || 0,
          resolved: data.resolved_cases || 0,
          success_rate: data.success_rate || 0,
          cases_this_month: data.cases_this_month || 0,
          upcoming_deadlines: data.upcoming_deadlines || [],
          recentActivity: data.recent_activity || []
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Calculate days left for upcoming deadlines
  const calculateDaysLeft = (deadline) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format timestamp to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Determine activity type based on action
  const getActivityType = (action) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('resolve')) return 'success';
    if (lowerAction.includes('assign')) return 'warning';
    if (lowerAction.includes('update')) return 'info';
    return 'info';
  };

  // Process upcoming deadlines from API data
  const upcomingDeadlines = stats.upcoming_deadlines.map((deadline, index) => ({
    case_id: index + 1,
    title: deadline.title || 'Untitled Case',
    deadline: formatDate(deadline.deadline),
    priority: deadline.priority || 'medium',
    days_left: calculateDaysLeft(deadline.deadline),
    assigned_at: formatDate(deadline.assigned_at)
  }));

  const statCards = [
    {
      title: 'Total Cases',
      value: stats.total_assigned,
      icon: FileText,
      color: 'blue',
      gradient: 'from-blue-600 to-blue-700'
    },
    {
      title: 'In Progress',
      value: stats.in_progress,
      icon: Clock,
      color: 'yellow',
      gradient: 'from-yellow-600 to-yellow-700'
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'green',
      gradient: 'from-green-600 to-green-700'
    },
    {
      title: 'Success Rate',
      value: `${stats.success_rate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'purple',
      gradient: 'from-purple-600 to-purple-700'
    }
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome, {user.name}!</h1>
          <p className="text-gray-400 mt-1">Here's your case overview</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
          <Award className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">Senior Investigator</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
            <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases This Month */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Cases This Month</h3>
              <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white">{stats.cases_this_month}</span>
            <span className="text-gray-400 text-lg mb-1">cases</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">{stats.cases_this_month > 0 ? 'Active this month' : 'No cases this month'}</span>
          </div>
        </motion.div>

        {/* Total Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Upcoming Deadlines</h3>
              <p className="text-gray-400 text-sm">Cases requiring attention</p>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white">{upcomingDeadlines.length}</span>
            <span className="text-gray-400 text-lg mb-1">deadlines</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-sm font-medium">
              {upcomingDeadlines.filter(d => d.days_left <= 7).length} urgent
            </span>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => {
                const activityType = getActivityType(activity.action);
                return (
                  <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-800 last:border-0 last:pb-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activityType === 'success' ? 'bg-green-400' :
                      activityType === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-white text-sm">{activity.action}</p>
                      <p className="text-gray-400 text-xs mt-1">{formatRelativeTime(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Upcoming Deadlines
          </h3>
          <div className="space-y-4">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-400 font-bold">#{deadline.case_id}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          deadline.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          deadline.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {deadline.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium">{deadline.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-gray-400 text-xs">Due: {deadline.deadline}</span>
                    <span className={`text-xs font-semibold ${
                      deadline.days_left <= 3 ? 'text-red-400' :
                      deadline.days_left <= 7 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {deadline.days_left > 0 ? `${deadline.days_left} days left` : 
                       deadline.days_left === 0 ? 'Due today' : 
                       `${Math.abs(deadline.days_left)} days overdue`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No upcoming deadlines</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InvestigatorOverview;
