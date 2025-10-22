import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, 
  Activity, 
  Users, 
  FileText, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Settings,
  TrendingUp,
  Database,
  UserCheck,
  Phone
} from 'lucide-react';

const RoleBasedTab = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  // Define tabs based on user role
  const getTabsByRole = () => {
    const userRole = user?.role || 'victim'; // Default to victim if no role

    const roleTabs = {
      admin: [
        { value: 'overview', label: 'Overview', icon: BarChart3 },
        { value: 'users', label: 'User Management', icon: Users },
        { value: 'incidents', label: 'All Incidents', icon: AlertTriangle },
        { value: 'analytics', label: 'Analytics', icon: TrendingUp },
        { value: 'team', label: 'Team Management', icon: UserCheck },
        { value: 'activity', label: 'Activity Log', icon: Activity },
        // { value: 'settings', label: 'Settings', icon: Settings },
      ],
      investigator: [
        { value: 'overview', label: 'Overview', icon: BarChart3 },
        { value: 'assigned', label: 'Assigned Cases', icon: FileText },
        { value: 'activity', label: 'Activity Log', icon: Activity },
        { value: 'evidence', label: 'Evidence', icon: Shield },
        { value: 'reports', label: 'Reports', icon: CheckCircle },
      ],
      victim: [
        { value: 'overview', label: 'Overview', icon: BarChart3 },
        { value: 'incidents', label: 'My Incidents', icon: AlertTriangle },
        { value: 'status', label: 'Case Status', icon: CheckCircle },
        { value: 'support', label: 'Support', icon: Phone },
      ],
      guest: [
        { value: 'overview', label: 'Overview', icon: BarChart3 },
        { value: 'report', label: 'Report Incident', icon: AlertTriangle },
        { value: 'awareness', label: 'Awareness', icon: Shield },
      ],
    };

    return roleTabs[userRole.toLowerCase()] || roleTabs.guest;
  };

  const tabs = getTabsByRole();

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-700 min-w-full lg:min-w-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium
                transition-all duration-200 whitespace-nowrap
                ${activeTab === tab.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleBasedTab;
