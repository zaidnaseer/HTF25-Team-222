import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
};

// User API
export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    becomeTrainer: (data) => api.post('/users/become-trainer', data),
    getUser: (id) => api.get(`/users/${id}`),
};

// Learner Hub API
export const learnerHubAPI = {
    getHubs: (params) => api.get('/hubs', { params }),
    getHub: (id) => api.get(`/hubs/${id}`),
    createHub: (data) => api.post('/hubs', data),
    joinHub: (id, data) => api.post(`/hubs/${id}/join`, data),
    leaveHub: (id) => api.delete(`/hubs/${id}/leave`),
    approveRequest: (hubId, userId) => api.post(`/hubs/${hubId}/approve/${userId}`),
    addResource: (hubId, data) => api.post(`/hubs/${hubId}/resources`, data),
    getHubMembers: (id) => api.get(`/hubs/${id}/members`),
};

// Trainer API
export const trainerAPI = {
    getTrainers: (params) => api.get('/trainers', { params }),
    getTrainer: (id) => api.get(`/trainers/${id}`),
    updateTrainerProfile: (data) => api.put('/trainers/profile', data),
    getPrograms: (id) => api.get(`/trainers/${id}/programs`),
    
    // NEW: Availability management
    getAvailability: (id) => api.get(`/trainers/${id}/availability`),
    updateAvailability: (data) => api.put('/trainers/availability', data),
    getAvailableSlots: (id, params) => api.get(`/trainers/${id}/available-slots`, { params }),
};

// Session API (ENHANCED)
export const sessionAPI = {
    getSessions: (params) => api.get('/sessions', { params }),
    getSession: (id) => api.get(`/sessions/${id}`),
    createSession: (data) => api.post('/sessions', data),
    joinSession: (id) => api.post(`/sessions/${id}/join`),
    completeSession: (id, data) => api.put(`/sessions/${id}/complete`, data),
    processPayment: (id) => api.post(`/sessions/${id}/payment`),
    
    // NEW: Request-based booking
    getPendingRequests: () => api.get('/sessions/requests/pending'),
    createRequest: (data) => api.post('/sessions/solo/request', data),
    cancelRequest: (id) => api.delete(`/sessions/requests/${id}`),
    
    // NEW: Trainer approval actions
    getTrainerRequests: () => api.get('/sessions/requests/trainer'),
    approveRequest: (id, data) => api.post(`/sessions/solo/${id}/approve`, data),
    rejectRequest: (id, data) => api.post(`/sessions/solo/${id}/reject`, data),
    suggestAlternative: (id, data) => api.post(`/sessions/solo/${id}/suggest-alternative`, data),
    
    // NEW: Group meets
    createGroupMeet: (data) => api.post('/sessions/group/create', data),
    publishGroupMeet: (id) => api.patch(`/sessions/group/${id}/publish`),
    getUpcomingGroupMeets: (params) => api.get('/sessions/group/upcoming', { params }),
    enrollInGroupMeet: (id) => api.post(`/sessions/group/${id}/enroll`),
    unenrollFromGroupMeet: (id) => api.delete(`/sessions/group/${id}/unenroll`),
    sendGroupAnnouncement: (id, data) => api.post(`/sessions/group/${id}/announce`, data),
};

// Rating API
export const ratingAPI = {
    createRating: (data) => api.post('/ratings', data),
    getTrainerRatings: (trainerId) => api.get(`/ratings/trainer/${trainerId}`),
};

// Roadmap API
export const roadmapAPI = {
    getRoadmaps: (params) => api.get('/roadmaps', { params }),
    getRoadmap: (id) => api.get(`/roadmaps/${id}`),
    createRoadmap: (data) => api.post('/roadmaps', data),
    updateProgress: (id, data) => api.put(`/roadmaps/${id}/progress`, data),
};

// Activity API
export const activityAPI = {
    getActivities: (params) => api.get('/activities', { params }),
    getActivity: (id) => api.get(`/activities/${id}`),
    createActivity: (data) => api.post('/activities', data),
    participate: (id, data) => api.post(`/activities/${id}/participate`, data),
    getLeaderboard: (id) => api.get(`/activities/${id}/leaderboard`),
};

// Message API
export const messageAPI = {
    getMessages: (hubId, params) => api.get(`/messages/${hubId}`, { params }),
    sendMessage: (data) => api.post('/messages', data),
    reactToMessage: (id, data) => api.post(`/messages/${id}/react`, data),
};

export default api;
