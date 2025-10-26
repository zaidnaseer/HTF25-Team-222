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
    getHubs: (params) => api.get('/learner-hubs', { params }),
    getHub: (id) => api.get(`/learner-hubs/${id}`),
    createHub: (data) => api.post('/learner-hubs', data),
    joinHub: (id, data) => api.post(`/learner-hubs/${id}/join`, data),
    leaveHub: (id, data) => api.delete(`/learner-hubs/${id}/leave`, { data }),
    approveRequest: (hubId, userId) => api.post(`/learner-hubs/${hubId}/approve/${userId}`),
    rejectRequest: (hubId, userId) => api.post(`/learner-hubs/${hubId}/reject/${userId}`),
    addResource: (hubId, data) => api.post(`/learner-hubs/${hubId}/resources`, data),
};

// Trainer API
export const trainerAPI = {
    getTrainers: (params) => api.get('/trainers', { params }),
    getTrainer: (id) => api.get(`/trainers/${id}`),
    updateTrainerProfile: (data) => api.put('/trainers/profile', data),
    getPrograms: (id) => api.get(`/trainers/${id}/programs`),
};

// Session API
export const sessionAPI = {
    getSessions: (params) => api.get('/sessions', { params }),
    getSession: (id) => api.get(`/sessions/${id}`),
    createSession: (data) => api.post('/sessions', data),
    joinSession: (id) => api.post(`/sessions/${id}/join`),
    completeSession: (id, data) => api.put(`/sessions/${id}/complete`, data),
    processPayment: (id) => api.post(`/sessions/${id}/payment`),
};

// Rating API
export const ratingAPI = {
    createRating: (data) => api.post('/ratings', data),
    getTrainerRatings: (trainerId) => api.get(`/ratings/trainer/${trainerId}`),
};

// Roadmap API
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
