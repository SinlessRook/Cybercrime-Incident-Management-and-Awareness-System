import axiosInstance from './axiosConfig';

/**
 * Service for managing case assignments
 */

// Get all unassigned cases
export const getUnassignedCases = async () => {
  try {
    const response = await axiosInstance.get('/cases/unassigned');
    return response.data;
  } catch (error) {
    console.error('Error fetching unassigned cases:', error);
    throw error;
  }
};

// Get all assigned cases
export const getAssignedCases = async () => {
  try {
    // Get all incidents
    const incidentsResponse = await axiosInstance.get('/cases/assigned/');
    const incidents = incidentsResponse.data.incidents || incidentsResponse.data;
    
    // Filter only assigned cases
    const assignedCases = incidents.filter(
      incident => incident.status?.toLowerCase() === 'assigned'
    );
    
    return assignedCases;
  } catch (error) {
    console.error('Error fetching assigned cases:', error);
    throw error;
  }
};

// Get all available investigators (users with investigator role)
export const getInvestigators = async () => {
  try {
    const response = await axiosInstance.get('/users/investigators');
    const investigators = response.data.investigators || response.data;
    
    return investigators;
  } catch (error) {
    console.error('Error fetching investigators:', error);
    throw error;
  }
};

// Assign a case to an investigator
export const assignCase = async (caseId, investigatorId) => {
  try {
    const response = await axiosInstance.post(`/cases/${caseId}/assign/${investigatorId}`);
    return response.data;
  } catch (error) {
    console.error('Error assigning case:', error);
    throw error;
  }
};

// Reassign a case to a different investigator
export const reassignCase = async (caseId, investigatorId) => {
  try {
    const response = await axiosInstance.post(`/cases/${caseId}/reassign/${investigatorId}`);
    return response.data;
  } catch (error) {
    console.error('Error reassigning case:', error);
    throw error;
  }
};

// Get case details
export const getCaseDetails = async (caseId) => {
  try {
    const response = await axiosInstance.get(`/cases/${caseId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching case details:', error);
    throw error;
  }
};

// Update case details
export const updateCase = async (caseId, data) => {
  try {
    const response = await axiosInstance.put(`/cases/${caseId}/update/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating case:', error);
    throw error;
  }
};

// Update case priority
export const updateCasePriority = async (caseId, priority) => {
  try {
    const response = await axiosInstance.put(`/cases/${caseId}/update/`, {
      priority: priority
    });
    return response.data;
  } catch (error) {
    console.error('Error updating case priority:', error);
    throw error;
  }
};
