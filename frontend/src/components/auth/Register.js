import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';


const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};



const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password1: '', password2: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const csrfToken = getCookie('csrftoken');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const { login } = useContext(AuthContext);

  useEffect(() => {
    fetch('/csrf/', {
      method: 'GET',
      credentials: 'include'
    });
  }, []);
  


  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
  
    try {
      const res = await fetch("http://localhost:8000/auth/registration/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(form),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        const errors = [];
  
        for (const field in data) {
          if (Array.isArray(data[field])) {
            errors.push(`${field}: ${data[field].join(" ")}`);
          } else {
            errors.push(`${field}: ${data[field]}`);
          }
        }
  
        throw new Error(errors.join("\n"));
      }
  
      const loginRes = await fetch("http://localhost:8000/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password1,
        }),
      });
  
      if (!loginRes.ok) {
        throw new Error("Registered but failed to log in.");
      }
  
      const loginData = await loginRes.json();
      login(loginData.key, { username: form.username }); // updates context and localS

      navigate("/posts");
  
    } catch (err) {
      setError(err.message);
    }
  };
  
  

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} required />
        <input name="password1" placeholder="Password" type="password" value={form.password1} onChange={handleChange} required />
        <input name="password2" placeholder="Confirm Password" type="password" value={form.password2} onChange={handleChange} required />
        <button type="submit">Register</button>
      </form>
      {error && (
        <div className="error">
            {error.split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
            ))}
        </div>
        )}

    </div>
  );
};

export default Register;
