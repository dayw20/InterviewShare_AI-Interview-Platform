import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import PostsList from './components/posts/PostsList';
import PostDetail from './components/posts/PostDetail';
import CreatePost from './components/posts/CreatePost';
import Login from './components/auth/Login';
import PrivateRoute from './components/auth/PrivateRoute';
import Register from './components/auth/Register';
import UserProfile from './components/dashboard/UserProfile';
import Layout from './Layout';
import Aimock from './Aimock';
import ScrollToTop from './ScrollToTop';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/login" />} />

          {/* Animated Login */}
          <Route path="login" element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Login />
            </motion.div>
          } />

          {/* Animated Register */}
          <Route path="register" element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Register />
            </motion.div>
          } />

          {/* Normal routes */}
          <Route path="posts" element={<PrivateRoute><PostsList /></PrivateRoute>} />
          <Route path="posts/:id" element={<PrivateRoute><PostDetail /></PrivateRoute>} />
          <Route path="create-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
          <Route path="mock-interviews" element={<PrivateRoute><Aimock  /></PrivateRoute>} />
          <Route path="dashboard" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
          <Route path="users/:id" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <AnimatedRoutes />
      <ToastContainer
        position="top-right"
        autoClose={200} 
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="bg-gray-800 text-white p-4 rounded-lg shadow-lg flex items-center space-x-2"
        progressClassName="bg-blue-500"
      />

    </Router>
  );
};

export default App;
