import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import PostsList from './components/posts/PostsList';
import PostDetail from './components/posts/PostDetail';
import CreatePost from './components/posts/CreatePost';
import Login from './components/auth/login';
import PrivateRoute from './components/auth/PrivaterRoute'; 
import Register from './components/auth/Register';
import './App.css';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          {/* Redirect base path to login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route 
            path="/posts" 
            element={
              <PrivateRoute>
                <PostsList />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/posts/:id" 
            element={
              <PrivateRoute>
                <PostDetail />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/create-post" 
            element={
              <PrivateRoute>
                <CreatePost />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
