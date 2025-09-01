import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CustomThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Settings from './pages/Settings';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPosts from './pages/admin/AdminPosts';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminAccount from './pages/admin/AdminAccount';

// Error Pages
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <CustomThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/admin/login" element={<AdminLogin />} />

                  {/* Protected Routes with Layout */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/profile/:username" element={<Profile />} />
                            <Route path="/profile/edit" element={<EditProfile />} />
                            <Route path="/create-post" element={<CreatePost />} />
                            <Route path="/post/:postId" element={<PostDetail />} />
                            <Route path="/search" element={<Search />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/messages" element={<Messages />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin/*"
                    element={
                      <AdminRoute>
                        <Routes>
                          <Route path="/dashboard" element={<AdminDashboard />} />
                          <Route path="/posts" element={<AdminPosts />} />
                          <Route path="/employees" element={<AdminEmployees />} />
                          <Route path="/revenue" element={<AdminRevenue />} />
                          <Route path="/account" element={<AdminAccount />} />
                          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AdminRoute>
                    }
                  />

                  {/* Catch all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>

                {/* Toast Notifications */}
                <ToastContainer
                  position="top-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="colored"
                />
              </div>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </ErrorBoundary>
  );
}

export default App;