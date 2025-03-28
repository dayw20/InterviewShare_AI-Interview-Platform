import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from '../../context/AuthContext';
import './Auth.css';


const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleManualLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Invalid credentials");

      const data = await res.json();
      login(data.key, { username: form.username }); // Optional: Fetch user after login
      navigate("/posts");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;
    const decoded = jwtDecode(token);
    try {
      const res = await fetch("http://localhost:8000/auth/google/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.token, data.user);
        navigate("/posts");
      } else {
        setError("Google authentication failed");
      }
    } catch (err) {
      console.error("Google login error", err);
    }
  };

  return (
    <div className="auth-container">

      <h2>Login</h2>

      <form onSubmit={handleManualLogin}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
        <button type="submit">Login</button>
      </form>

      <div style={{ margin: '1rem 0' }}>
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google login failed")} />
      </div>

      <p>Don't have an account? <Link to="/register">Register here</Link></p>

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default Login;
