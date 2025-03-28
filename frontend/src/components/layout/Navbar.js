import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-container">
      <div className="navbar-left">
        <h1 to="/" className="navbar-logo">InterviewShare</h1>
        <div className="nav-menu">
          <Link to="/posts" className="nav-link">Browse Interviews</Link>
          <Link to="/mock-interviews" className="nav-link">Mock Lab</Link>
        </div>
      </div>
        <div className="navbar-buttons">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn dashboard-btn">Dashboard</Link>
              <div className="user-menu">
                <img src={user?.avatar || "/default-avatar.png"} alt="User" className="user-avatar" />
                <div className="dropdown-menu">
                  <Link to="/profile">Profile</Link>
                  <Link to="/settings">Settings</Link>
                  <button className="logout-btn" onClick={logout}>Logout</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn login-btn">Login</Link>
              <Link to="/register" className="btn register-btn">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
