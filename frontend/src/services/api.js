import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('token', newToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  adminLogin: (credentials) => api.post('/auth/admin/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  getStats: () => api.get('/auth/stats'),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUserProfile: (userId) => api.get(`/users/${userId}`),
  getUserPosts: (userId, params) => api.get(`/users/${userId}/posts`, { params }),
  getUserFollowers: (userId, params) => api.get(`/users/${userId}/followers`, { params }),
  getUserFollowing: (userId, params) => api.get(`/users/${userId}/following`, { params }),
  toggleFollow: (userId) => api.post(`/users/${userId}/follow`),
  getFollowSuggestions: () => api.get('/users/suggestions/follow'),
  searchUsers: (params) => api.get('/users/search', { params }),
};

// Posts API
export const postsAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  getPost: (postId) => api.get(`/posts/${postId}`),
  createPost: (postData) => api.post('/posts', postData),
  updatePost: (postId, postData) => api.put(`/posts/${postId}`, postData),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  toggleLike: (postId) => api.post(`/posts/${postId}/like`),
  addView: (postId, viewData) => api.post(`/posts/${postId}/view`, viewData),
  getPostsByHashtag: (hashtag, params) => api.get(`/posts/hashtag/${hashtag}`, { params }),
  getTrendingHashtags: () => api.get('/posts/trending/hashtags'),
  getUserLikedPosts: (params) => api.get('/posts/user/liked', { params }),
  getPostComments: (postId, params) => api.get(`/posts/${postId}/comments`, { params }),
  addComment: (postId, commentData) => api.post(`/posts/${postId}/comments`, commentData),
};

// Comments API
export const commentsAPI = {
  getComment: (commentId) => api.get(`/comments/${commentId}`),
  updateComment: (commentId, commentData) => api.put(`/comments/${commentId}`, commentData),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  toggleLike: (commentId) => api.post(`/comments/${commentId}/like`),
  getReplies: (commentId, params) => api.get(`/comments/${commentId}/replies`, { params }),
};

// Upload API
export const uploadAPI = {
  uploadProfile: (formData) => api.post('/upload/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadPostMedia: (formData) => api.post('/upload/post-media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Admin API
export const adminAPI = {
  // Employee management
  createEmployee: (employeeData) => api.post('/admin/employees', employeeData),
  getEmployees: (params) => api.get('/admin/employees', { params }),
  updateEmployee: (employeeId, employeeData) => api.put(`/admin/employees/${employeeId}`, employeeData),
  deleteEmployee: (employeeId) => api.delete(`/admin/employees/${employeeId}`),

  // Revenue management
  createRevenuePricing: (pricingData) => api.post('/admin/revenue', pricingData),
  getRevenuePricing: (params) => api.get('/admin/revenue', { params }),
  updateRevenuePricing: (pricingId, pricingData) => api.put(`/admin/revenue/${pricingId}`, pricingData),

  // Post management
  getPostsForApproval: (params) => api.get('/admin/posts', { params }),
  approvePost: (postId) => api.post(`/admin/posts/${postId}/approve`),

  // Dashboard
  getAccountDashboard: (params) => api.get('/admin/dashboard', { params }),
  payPostEarnings: (postId) => api.post(`/admin/posts/${postId}/pay`),
  getAdminStats: () => api.get('/admin/stats'),
};

export default api;
