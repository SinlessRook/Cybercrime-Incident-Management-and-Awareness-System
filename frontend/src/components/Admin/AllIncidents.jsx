import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  User, 
  MapPin, 
  FileText,
  Calendar,
  Eye,
  UserCheck,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Folder,
  Shield,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';

const AllIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // Combined sort type and order
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIncident, setExpandedIncident] = useState(null);

  // Fetch incidents from API
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        // Small delay to ensure proper rendering
        await new Promise(resolve => setTimeout(resolve, 100));
        const response = await axiosInstance.get('/incidents');
        let incidentsData = response.data.incidents || response.data;
        
        // Sort data before setting state
        incidentsData = [...incidentsData].sort((a, b) => {
          const dateA = new Date(a.reported_at || a.reportedDate || 0);
          const dateB = new Date(b.reported_at || b.reportedDate || 0);
          return dateB - dateA; // Most recent first
        });
        
        setIncidents(incidentsData);
        setFilteredIncidents(incidentsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching incidents:', err);
        setError('Failed to load incidents data');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  // Filter and sort incidents with debouncing for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let filtered = incidents;

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(incident => 
          incident.id?.toString().includes(searchQuery) ||
          incident.caseId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          incident.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          incident.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          incident.reportedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          incident.investigator?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          incident.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          incident.location?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(incident => {
          const normalizedIncidentStatus = incident.status?.toLowerCase().replace(/\s+/g, '_');
          const normalizedFilterStatus = statusFilter.toLowerCase().replace(/\s+/g, '_');
          return normalizedIncidentStatus === normalizedFilterStatus;
        });
      }

      // Apply sorting
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'recent': {
            const dateA = new Date(a.reported_at || a.reportedDate || 0);
            const dateB = new Date(b.reported_at || b.reportedDate || 0);
            comparison = dateB - dateA; // Most recent first
            break;
          }
          case 'oldest': {
            const dateA = new Date(a.reported_at || a.reportedDate || 0);
            const dateB = new Date(b.reported_at || b.reportedDate || 0);
            comparison = dateA - dateB; // Oldest first
            break;
          }
          case 'priority-high': {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityA = priorityOrder[a.priority?.toLowerCase()] || 0;
            const priorityB = priorityOrder[b.priority?.toLowerCase()] || 0;
            comparison = priorityB - priorityA; // High to low
            break;
          }
          case 'priority-low': {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityA = priorityOrder[a.priority?.toLowerCase()] || 0;
            const priorityB = priorityOrder[b.priority?.toLowerCase()] || 0;
            comparison = priorityA - priorityB; // Low to high
            break;
          }
          case 'status': {
            const statusOrder = { in_progress: 1, assigned: 2, resolved: 3 };
            const statusA = statusOrder[a.status?.toLowerCase().replace(/\s+/g, '_')] || 0;
            const statusB = statusOrder[b.status?.toLowerCase().replace(/\s+/g, '_')] || 0;
            comparison = statusA - statusB;
            break;
          }
          case 'id-asc': {
            comparison = (a.id || 0) - (b.id || 0);
            break;
          }
          case 'id-desc': {
            comparison = (b.id || 0) - (a.id || 0);
            break;
          }
          default:
            comparison = 0;
        }

        return comparison;
      });

      setFilteredIncidents(filtered);
    }, searchQuery ? 300 : 0); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter, incidents, sortBy]);

  // Get status badge styling
  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_');
    
    const statusConfig = {
      in_progress: {
        icon: Clock,
        label: 'In Progress',
        colors: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      },
      assigned: {
        icon: UserCheck,
        label: 'Assigned',
        colors: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      },
      resolved: {
        icon: CheckCircle,
        label: 'Resolved',
        colors: 'bg-green-500/10 text-green-400 border-green-500/30'
      },
      pending: {
        icon: Clock,
        label: 'Pending',
        colors: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
      },
      closed: {
        icon: XCircle,
        label: 'Closed',
        colors: 'bg-gray-500/10 text-gray-400 border-gray-500/30'
      }
    };

    const config = statusConfig[normalizedStatus] || {
      icon: AlertCircle,
      label: status,
      colors: 'bg-gray-500/10 text-gray-400 border-gray-500/30'
    };

    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.colors}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  };

  // Get priority badge styling
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: {
        colors: 'bg-red-500/10 text-red-400 border-red-500/30',
        label: 'High Priority'
      },
      medium: {
        colors: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        label: 'Medium Priority'
      },
      low: {
        colors: 'bg-green-500/10 text-green-400 border-green-500/30',
        label: 'Low Priority'
      }
    };

    const config = priorityConfig[priority?.toLowerCase()] || {
      colors: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
      label: priority || 'Normal'
    };

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.colors}`}>
        <Shield className="w-4 h-4" />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  };

  // Toggle incident details
  const toggleExpand = (incidentId) => {
    setExpandedIncident(expandedIncident === incidentId ? null : incidentId);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-10 bg-gray-800 rounded-lg w-1/3 animate-pulse"></div>
          <div className="h-6 bg-gray-800 rounded-lg w-1/4 animate-pulse"></div>
        </div>

        {/* Search and Filter Skeleton */}
        <div className="flex gap-4">
          <div className="flex-1 h-12 bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-12 w-48 bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-12 w-48 bg-gray-800 rounded-lg animate-pulse"></div>
        </div>

        {/* Incident Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6">
              <div className="space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-16 bg-gray-800 rounded"></div>
                  <div className="h-6 w-32 bg-gray-800 rounded-full"></div>
                  <div className="h-6 w-32 bg-gray-800 rounded-full"></div>
                </div>
                <div className="h-6 bg-gray-800 rounded w-3/4"></div>
                <div className="h-20 bg-gray-800 rounded"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-5 bg-gray-800 rounded"></div>
                  <div className="h-5 bg-gray-800 rounded"></div>
                  <div className="h-5 bg-gray-800 rounded"></div>
                  <div className="h-5 bg-gray-800 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">All Incidents</h1>
            <p className="text-gray-400 mt-1">
              Showing {filteredIncidents.length} of {incidents.length} incidents
            </p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by ID, case ID, title, description, reporter, investigator, type, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="all">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="assigned">Assigned</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-10 pr-8 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="recent">Most Recent First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority-high">Priority: High to Low</option>
              <option value="priority-low">Priority: Low to High</option>
              <option value="status">By Status</option>
              <option value="id-asc">ID: Low to High</option>
              <option value="id-desc">ID: High to Low</option>
            </select>
          </div>
        </div>
      </div>
      {/* Summary Header */}
      {filteredIncidents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-black border border-gray-800 rounded-lg"
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">
                In Progress: <span className="text-yellow-400 font-semibold">
                  {incidents.filter(i => i.status?.toLowerCase().replace(/\s+/g, '_') === 'in_progress').length}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">
                Assigned: <span className="text-blue-400 font-semibold">
                  {incidents.filter(i => i.status?.toLowerCase().replace(/\s+/g, '_') === 'assigned').length}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">
                Resolved: <span className="text-green-400 font-semibold">
                  {incidents.filter(i => i.status?.toLowerCase().replace(/\s+/g, '_') === 'resolved').length}
                </span>
              </span>
            </div>
          </div>
        </motion.div>
      )}
      {/* Incidents List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredIncidents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No incidents found</p>
            </motion.div>
          ) : (
            filteredIncidents.map((incident, index) => {
              const isExpanded = expandedIncident === incident.id;

              return (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all duration-300"
                >
                  {/* Main Card Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left Section - Main Info */}
                      <div className="flex-1 space-y-3">
                        {/* ID, Case ID and Status */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-2xl font-bold text-blue-400">
                            {incident.id}
                          </span>
                          {incident.caseId && (
                            <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                              <Folder className="w-3 h-3 inline mr-1" />
                              {incident.caseId}
                            </span>
                          )}
                          {getStatusBadge(incident.status)}
                          {incident.priority && getPriorityBadge(incident.priority)}
                        </div>

                        {/* Title */}
                        {incident.title && (
                          <h3 className="text-lg font-semibold text-white">
                            {incident.title}
                          </h3>
                        )}

                        {/* Description */}
                        <p className="text-gray-300 text-base leading-relaxed">
                          {incident.description || 'No description provided'}
                        </p>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {/* Reporter */}
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-400">Reporter:</span>
                            <span className="text-gray-200 font-medium">
                              {incident.reportedBy || incident.user || 'Unknown'}
                            </span>
                          </div>

                          {/* Incident Type */}
                          {(incident.type || incident.crime_type) && (
                            <div className="flex items-center gap-2 text-sm">
                              <AlertCircle className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-400">Type:</span>
                              <span className="text-gray-200 font-medium">
                                {incident.type || incident.crime_type}
                              </span>
                            </div>
                          )}

                          {/* Location */}
                          {incident.location && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-400">Location:</span>
                              <span className="text-gray-200 font-medium">{incident.location}</span>
                            </div>
                          )}

                          {/* Date */}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-400">Reported:</span>
                            <span className="text-gray-200 font-medium">
                              {incident.reportedDate 
                                ? new Date(incident.reportedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                : incident.reported_at 
                                ? formatDate(incident.reported_at)
                                : 'N/A'}
                            </span>
                          </div>

                          {/* Evidence Count */}
                          {incident.evidenceCount !== undefined && (
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-400">Evidence:</span>
                              <span className="text-gray-200 font-medium">
                                {incident.evidenceCount} {incident.evidenceCount === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                          )}

                          {/* Last Update */}
                          {incident.lastUpdate && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-400">Last Update:</span>
                              <span className="text-gray-200 font-medium">{incident.lastUpdate}</span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {incident.progress !== undefined && (
                          <div className="pt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-400">Investigation Progress</span>
                              <span className="text-sm text-gray-200 font-medium">{incident.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${incident.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Assignment Status */}
                        {(incident.investigator || incident.assigned_to) && (
                          <div className="flex items-center gap-2 pt-2">
                            <UserCheck className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-gray-400">
                              {incident.status?.toLowerCase() === 'assigned' 
                                ? `Assigned to: ${incident.investigator || incident.assigned_to}`
                                : incident.status?.toLowerCase() === 'resolved'
                                ? `Resolved by: ${incident.investigator || incident.assigned_to}`
                                : `Investigator: ${incident.investigator || incident.assigned_to}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex flex-col gap-2">
                        {/* View Details Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleExpand(incident.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {isExpanded ? 'Hide' : 'View'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </motion.button>

                        {/* View Report Button (for resolved cases) */}
                        {incident.status?.toLowerCase() === 'resolved' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {/* Handle view report */}}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm font-medium">Report</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details Section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-800"
                      >
                        <div className="p-6 bg-black/40 space-y-4">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" />
                            Detailed Information
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Full Description */}
                            <div className="md:col-span-2">
                              <label className="text-sm text-gray-400 font-medium">Full Description</label>
                              <p className="mt-1 text-gray-200 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                {incident.description || 'No description provided'}
                              </p>
                            </div>

                            {/* Incident ID */}
                            <div>
                              <label className="text-sm text-gray-400 font-medium">Incident ID</label>
                              <p className="mt-1 text-gray-200 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                {incident.id}
                              </p>
                            </div>

                            {/* Case ID */}
                            {incident.caseId && (
                              <div>
                                <label className="text-sm text-gray-400 font-medium">Case ID</label>
                                <p className="mt-1 text-gray-200 bg-gray-900/50 p-3 rounded-lg border border-gray-800 flex items-center gap-2">
                                  <Folder className="w-4 h-4 text-blue-400" />
                                  {incident.caseId}
                                </p>
                              </div>
                            )}

                            {/* Title */}
                            {incident.title && (
                              <div className="md:col-span-2">
                                <label className="text-sm text-gray-400 font-medium">Title</label>
                                <p className="mt-1 text-gray-200 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                  {incident.title}
                                </p>
                              </div>
                            )}

                            {/* Status */}
                            <div>
                              <label className="text-sm text-gray-400 font-medium">Current Status</label>
                              <div className="mt-1 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                {getStatusBadge(incident.status)}
                              </div>
                            </div>

                            {/* Priority */}
                            {incident.priority && (
                              <div>
                                <label className="text-sm text-gray-400 font-medium">Priority</label>
                                <div className="mt-1 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                  {getPriorityBadge(incident.priority)}
                                </div>
                              </div>
                            )}

                            {/* Reporter */}
                            <div>
                              <label className="text-sm text-gray-400 font-medium">Reported By</label>
                              <p className="mt-1 text-gray-200 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                {incident.reportedBy || incident.user || 'Unknown'}
                              </p>
                            </div>

                            {/* Incident Type */}
                            <div>
                              <label className="text-sm text-gray-400 font-medium">Incident Type</label>
                              <p className="mt-1 text-gray-200 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                {incident.type || incident.crime_type || 'Not specified'}
                              </p>
                            </div>

                            {/* Location */}
                            <div className="md:col-span-2">
                              <label className="text-sm text-gray-400 font-medium">Location</label>
                              <p className="mt-1 text-gray-200 bg-gray-900/50 p-3 rounded-lg border border-gray-800 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {incident.location || 'Location not specified'}
                              </p>
                            </div>

                            {/* Reported Date */}
                            <div>
                              <label className="text-sm text-gray-400 font-medium">Reported Date</label>
                              <p className="mt-1 text-gray-200 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                {incident.reportedDate 
                                  ? new Date(incident.reportedDate).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })
                                  : incident.reported_at 
                                  ? formatDate(incident.reported_at)
                                  : 'N/A'}
                              </p>
                            </div>

                            {/* Last Update */}
                            {incident.lastUpdate && (
                              <div>
                                <label className="text-sm text-gray-400 font-medium">Last Update</label>
                                <p className="mt-1 text-gray-200 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                  {incident.lastUpdate}
                                </p>
                              </div>
                            )}

                            {/* Investigator */}
                            {(incident.investigator || incident.assigned_to) && (
                              <div>
                                <label className="text-sm text-gray-400 font-medium">Investigator</label>
                                <p className="mt-1 text-gray-200 bg-gray-900/50 p-3 rounded-lg border border-gray-800 flex items-center gap-2">
                                  <UserCheck className="w-4 h-4 text-blue-400" />
                                  {incident.investigator || incident.assigned_to}
                                </p>
                              </div>
                            )}

                            {/* Evidence Count */}
                            {incident.evidenceCount !== undefined && (
                              <div>
                                <label className="text-sm text-gray-400 font-medium">Evidence Items</label>
                                <p className="mt-1 text-gray-200 bg-gray-900/50 p-3 rounded-lg border border-gray-800 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  {incident.evidenceCount} {incident.evidenceCount === 1 ? 'item' : 'items'}
                                </p>
                              </div>
                            )}

                            {/* Progress */}
                            {incident.progress !== undefined && (
                              <div className="md:col-span-2">
                                <label className="text-sm text-gray-400 font-medium">Investigation Progress</label>
                                <div className="mt-1 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-200 font-medium">{incident.progress}%</span>
                                    <TrendingUp className="w-4 h-4 text-blue-400" />
                                  </div>
                                  <div className="w-full bg-gray-800 rounded-full h-3">
                                    <div 
                                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                                      style={{ width: `${incident.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {incident.assigned_at && (
                              <div>
                                <label className="text-sm text-gray-400 font-medium">Assigned At</label>
                                <p className="mt-1 text-gray-200 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                  {formatDate(incident.assigned_at)}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Timeline Section */}
                          {incident.timeline && incident.timeline.length > 0 && (
                            <div className="pt-4 border-t border-gray-800">
                              <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-400" />
                                Investigation Timeline
                              </h4>
                              <div className="space-y-3">
                                {incident.timeline.map((event, idx) => {
                                  const getEventIcon = (type) => {
                                    switch(type?.toLowerCase()) {
                                      case 'report': return AlertCircle;
                                      case 'assign': return UserCheck;
                                      case 'evidence': return FileText;
                                      case 'update': return Clock;
                                      default: return Calendar;
                                    }
                                  };

                                  const getEventColor = (type) => {
                                    switch(type?.toLowerCase()) {
                                      case 'report': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
                                      case 'assign': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
                                      case 'evidence': return 'text-green-400 bg-green-500/10 border-green-500/30';
                                      case 'update': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
                                      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
                                    }
                                  };

                                  const EventIcon = getEventIcon(event.type);

                                  return (
                                    <div 
                                      key={idx}
                                      className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800"
                                    >
                                      <div className={`p-2 rounded-full border ${getEventColor(event.type)}`}>
                                        <EventIcon className="w-4 h-4" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-gray-200 text-sm">{event.event}</p>
                                        <p className="text-gray-400 text-xs mt-1">
                                          {new Date(event.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Additional Actions for Resolved Cases */}
                          {incident.status?.toLowerCase() === 'resolved' && (
                            <div className="pt-4 border-t border-gray-800">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {/* Handle view full report */}}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                              >
                                <FileText className="w-5 h-5" />
                                View Full Investigation Report
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      
    </div>
  );
};

export default AllIncidents;
