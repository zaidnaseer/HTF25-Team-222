// frontend/src/services/api.js
import axios from 'axios';

// Determine API URL based on environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create an Axios instance with base configuration
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Axios interceptor to automatically add the JWT token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Get token from local storage
        if (token) {
            // If token exists, add it to the Authorization header
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config; // Return the modified config
    },
    (error) => {
        // Handle request errors
        return Promise.reject(error);
    }
);

// --- Authentication API Functions ---
export const authAPI = {
    register: (data) => api.post('/auth/register', data), // User registration
    login: (data) => api.post('/auth/login', data),       // User login
};

// --- User API Functions ---
export const userAPI = {
    getProfile: () => api.get('/users/profile'),              // Get logged-in user's profile
    updateProfile: (data) => api.put('/users/profile', data), // Update logged-in user's profile
    becomeTrainer: (data) => api.post('/users/become-trainer', data), // Upgrade user to trainer
    getUser: (id) => api.get(`/users/${id}`),                 // Get public profile of any user by ID
};

// --- Learner Hub API Functions ---
export const learnerHubAPI = {
    getHubs: (params) => api.get('/hubs', { params }),
    getHub: (id) => api.get(`/hubs/${id}`),
    createHub: (data) => api.post('/hubs', data),
    joinHub: (id, data) => api.post(`/hubs/${id}/join`, data),
    // Note: The origin/main version of leaveHub includes 'data', which might be needed
    leaveHub: (id, data) => api.delete(`/hubs/${id}/leave`, { data }),
    approveRequest: (hubId, userId) => api.post(`/hubs/${hubId}/approve/${userId}`),
    rejectRequest: (hubId, userId) => api.post(`/hubs/${hubId}/reject/${userId}`),
    addResource: (hubId, data) => api.post(`/hubs/${hubId}/resources`, data),
    // Added from HEAD (develop branch) as it was missing in origin/main
    getHubMembers: (id) => api.get(`/hubs/${id}/members`),
};

// --- Trainer API Functions ---
export const trainerAPI = {
    getTrainers: (params) => api.get('/trainers', { params }), // Get list of trainers (with filters)
    getTrainer: (id) => api.get(`/trainers/${id}`),          // Get public profile of a specific trainer
    updateTrainerProfile: (data) => api.put('/trainers/profile', data), // Update logged-in trainer's specific profile details
    getPrograms: (id) => api.get(`/trainers/${id}/programs`), // Get trainer's programs

    // --- Availability Management ---
    getAvailability: (id) => api.get(`/trainers/${id}/availability`), // Get trainer's availability settings (use 'me' for self)
    updateAvailability: (data) => api.put('/trainers/availability', data), // Update logged-in trainer's availability settings
    getAvailableSlots: (id, params) => api.get(`/trainers/${id}/available-slots`, { params }), // Get calculated available slots for a trainer
};

// --- Session API Functions (Includes Solo Requests & Group Meets) ---
export const sessionAPI = {
    // General Sessions
    getSessions: (params) => api.get('/sessions', { params }),             // Get list of sessions (learner or trainer, filtered)
    getSession: (id) => api.get(`/sessions/${id}`),                      // Get details of a specific session
    createSession: (data) => api.post('/sessions', data),                // (Potentially legacy or direct creation?)
    joinSession: (id) => api.post(`/sessions/${id}/join`),               // Join a scheduled session (meeting link?)
    completeSession: (id, data) => api.put(`/sessions/${id}/complete`, data), // Mark a session as complete
    processPayment: (id) => api.post(`/sessions/${id}/payment`),         // Process payment for a session

    // Solo Session Requests (Learner perspective)
    getPendingRequests: () => api.get('/sessions/requests/pending'),     // Get learner's own pending requests
    createRequest: (data) => api.post('/sessions/solo/request', data),  // Learner creates a request to a trainer
    cancelRequest: (id) => api.delete(`/sessions/requests/${id}`),       // Learner cancels their request

    // Solo Session Requests (Trainer perspective)
    getTrainerRequests: () => api.get('/sessions/requests/trainer'),     // Trainer gets requests directed to them
    approveRequest: (id, data) => api.post(`/sessions/solo/${id}/approve`, data), // Trainer approves a request
    rejectRequest: (id, data) => api.post(`/sessions/solo/${id}/reject`, data),   // Trainer rejects a request
    suggestAlternative: (id, data) => api.post(`/sessions/solo/${id}/suggest-alternative`, data), // Trainer suggests alternative time(s)

    // Group Meets
    createGroupMeet: (data) => api.post('/sessions/group/create', data), // Trainer creates a group meet
    publishGroupMeet: (id) => api.patch(`/sessions/group/${id}/publish`), // Trainer makes a group meet visible
    getUpcomingGroupMeets: (params) => api.get('/sessions/group/upcoming', { params }), // Get upcoming group meets
    enrollInGroupMeet: (id) => api.post(`/sessions/group/${id}/enroll`), // Learner enrolls in a group meet
    unenrollFromGroupMeet: (id) => api.delete(`/sessions/group/${id}/unenroll`), // Learner unenrolls
    sendGroupAnnouncement: (id, data) => api.post(`/sessions/group/${id}/announce`, data), // Trainer sends announcement to group meet attendees
};

// --- Rating API Functions ---
export const ratingAPI = {
    createRating: (data) => api.post('/ratings', data),                 // Submit a rating/review after a session
    getTrainerRatings: (trainerId) => api.get(`/ratings/trainer/${trainerId}`), // Get ratings for a specific trainer
};

// --- Roadmap API Functions ---
export const roadmapAPI = {

    getRoadmaps: (params) => api.get('/roadmaps', { params }),
    getApprovedRoadmaps: () => api.get('/roadmaps/approved/all'),
    getTrainerRoadmaps: (trainerId) => api.get(`/roadmaps/trainer/${trainerId}`),
    getMyRoadmaps: () => api.get('/roadmaps/my/all'),
    getRoadmap: (id) => api.get(`/roadmaps/${id}`),
    createRoadmap: (data) => api.post('/roadmaps', data),
    updateRoadmap: (id, data) => api.put(`/roadmaps/${id}`, data),
    deleteRoadmap: (id) => api.delete(`/roadmaps/${id}`),
    adoptRoadmap: (id, data) => api.post(`/roadmaps/${id}/adopt`, data),
    updateProgress: (id, data) => api.put(`/roadmaps/${id}/progress`, data),
};

// --- Activity API Functions ---
export const activityAPI = {
    getActivities: (params) => api.get('/activities', { params }),     // Get list of activities
    getActivity: (id) => api.get(`/activities/${id}`),                 // Get details of a specific activity
    createActivity: (data) => api.post('/activities', data),          // Create a new activity
    participate: (id, data) => api.post(`/activities/${id}/participate`, data), // Participate in an activity
    getLeaderboard: (id) => api.get(`/activities/${id}/leaderboard`), // Get leaderboard for an activity
};

// --- Message API Functions (Hub Chat) ---
export const messageAPI = {
    getMessages: (hubId, params) => api.get(`/messages/${hubId}`, { params }), // Get messages for a specific hub chat
    sendMessage: (data) => api.post('/messages', data),                       // Send a message in a hub chat
    reactToMessage: (id, data) => api.post(`/messages/${id}/react`, data),     // Add reaction to a message
};

// Export the configured Axios instance if needed elsewhere directly
export default api;
