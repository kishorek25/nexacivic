import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
import "./App.css";
import Logo from "./components/common/Logo";

import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import ComplaintForm from "./components/ComplaintForm";
import ComplaintList from "./components/ComplaintList";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminPage from "./components/AdminPage";
import StaffPage from "./components/StaffPage";
import ChatDashboard from "./components/ChatDashboard";
import CommunityPage from "./components/CommunityPage";
import AssistantPage from "./components/AssistantPage";
import Profile from "./components/Profile";
import Leaderboard from "./components/Leaderboard";
import CallCenter from "./components/CallCenter";

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { i18n } = useTranslation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setToken(storedToken);
      if (u.language) {
          i18n.changeLanguage(u.language);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Axios interceptor for headers
    const interceptor = axios.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['Accept-Language'] = i18n.language || 'en';
      return config;
    });

    return () => axios.interceptors.request.eject(interceptor);
  }, [token, i18n.language]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync language with backend when it changes
  useEffect(() => {
    if (user && token && i18n.language) {
      axios.put('/api/user/language', { language: i18n.language })
        .catch(err => console.error("Failed to sync language with server", err));
    }
  }, [i18n.language, user, token]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const handleUpdateProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const [sortBy, setSortBy] = useState('upvotes');

  const fetchComplaints = async (explicitSort) => {
    if (!token) return;

    try {
      if (complaints.length === 0) setLoading(true);

      const rolesWithUpvotesDefault = ['admin', 'staff'];
      
      // Use explicitSort if provided, otherwise role-based default, otherwise 'latest'
      let currentSort = explicitSort || (rolesWithUpvotesDefault.includes(user?.role) ? 'upvotes' : 'latest');
      if (explicitSort) setSortBy(explicitSort);

      const res = await axios.get(`/api/complaints?sort=${currentSort}`);

      setComplaints(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch complaints. Session might have expired.');
      if (err.response && (err.response.status === 401 || err.response.status === 400)) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchComplaints();
  }, [token]);

  if (loading && !user) return (
    <div className="loading-screen">
      <Logo size={64} />
      <p style={{ marginTop: '1rem' }}>Loading App...</p>
    </div>
  );

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />

      <div className="app-container">
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <ProtectedRoute user={user}>
                  {user.role === 'admin' ? (
                    <Navigate to="/admin" replace />
                  ) : user.role === 'staff' ? (
                    <Navigate to="/staff" replace />
                  ) : (
                    <>
                      <Dashboard complaints={complaints} token={token} />
                      <ComplaintForm onComplaintAdded={fetchComplaints} token={token} />
                      {error && <div className="error-alert">{error}</div>}
                      {loading ? (
                        <div className="loading-screen">Loading secure channel...</div>
                      ) : (
                        <ComplaintList complaints={complaints} onRefresh={fetchComplaints} token={token} user={user} />
                      )}
                    </>
                  )}
                </ProtectedRoute>
              ) : (
                <LandingPage />
              )
            }
          />

          <Route path="/about" element={<LandingPage />} />
          <Route path="/login" element={!user ? <Login setAuth={setUser} setToken={setToken} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute user={user}>
                {user?.role === 'admin' ? (
                  <AdminPage complaints={complaints} fetchComplaints={fetchComplaints} token={token} user={user} loading={loading} />
                ) : (
                  <Navigate to="/" replace />
                )}
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff"
            element={
              <ProtectedRoute user={user}>
                {user?.role === 'staff' ? (
                  <StaffPage complaints={complaints} fetchComplaints={fetchComplaints} token={token} user={user} loading={loading} />
                ) : (
                  <Navigate to="/" replace />
                )}
              </ProtectedRoute>
            }
          />

          <Route
            path="/chats"
            element={
              <ProtectedRoute user={user}>
                {user?.role === 'admin' ? <Navigate to="/admin" replace /> : <ChatDashboard user={user} token={token} complaints={complaints} />}
              </ProtectedRoute>
            }
          />

          <Route
            path="/community"
            element={
              <ProtectedRoute user={user}>
                <CommunityPage user={user} token={token} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user}>
                <Profile user={user} token={token} onUpdateUser={handleUpdateProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assistant"
            element={
              <ProtectedRoute user={user}>
                <AssistantPage user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute user={user}>
                <Leaderboard token={token} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/callcenter"
            element={
              <ProtectedRoute user={user}>
                {(user?.role === 'staff' || user?.role === 'admin') ? (
                  <CallCenter token={token} />
                ) : (
                  <Navigate to="/" replace />
                )}
              </ProtectedRoute>
            }
          />

          <Route path="*" element={user ? <Navigate to="/" /> : <LandingPage />} />
        </Routes>
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />

      {!user && <></>}
    </BrowserRouter>
  );
}

export default App;
