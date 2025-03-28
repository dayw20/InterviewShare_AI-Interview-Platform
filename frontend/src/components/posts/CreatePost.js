// src/components/posts/CreatePost.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreatePost.css';


const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const CreatePost = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    post_type: 'interview',
    company: '',
    visibility: 'public',
    interview_date: '',
    round_number: 1,
    round_type: 'technical_interview',
  });
  
  const [companies, setCompanies] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // For rich text editing (simplified)
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  
  useEffect(() => {
    // Fetch companies list from API (if available)
    // For now, we'll use a dummy list
    setCompanies(['Google', 'Amazon', 'Microsoft', 'Apple', 'Facebook']);
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const applyFormatting = (format) => {
    switch (format) {
      case 'bold':
        setIsBold(!isBold);
        break;
      case 'italic':
        setIsItalic(!isItalic);
        break;
      default:
        break;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      
      if (!formData.content.trim()) {
        throw new Error('Content is required');
      }
      
      if (formData.post_type === 'interview' && !formData.company.trim()) {
        throw new Error('Company is required for interview experiences');
      }
      
      // Prepare data for API
      const postData = {
        title: formData.title,
        content: formData.content,
        post_type: formData.post_type,
        visibility: formData.visibility,
        company: formData.company || null,
        interview_date: formData.interview_date || null,
      };
      
      // Add interview-specific data if needed
      if (formData.post_type === 'interview') {
        postData.interview_details = {
          round_number: formData.round_number,
          round_type: formData.round_type,
        };
      }
      
      console.log('Sending data:', JSON.stringify(postData)); 
    
      const token = localStorage.getItem('token');
      
      // Send to API
      const response = await fetch('/api/posts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(postData),
        credentials: 'include', 
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Server response:', responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || 'Failed to create post');
        } catch (jsonError) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      const newPost = await response.json();
      
      // Redirect to the new post
      navigate(`/posts/${newPost.id}`);
    } catch (error) {
      setError(error.message);
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="create-post-container">
      <h1>Create a New Post</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="create-post-form">
        <div className="form-group post-type-selector">
          <button
            type="button"
            className={`post-type-btn ${formData.post_type === 'general' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, post_type: 'general'})}
          >
            General Post
          </button>
          
          <button
            type="button"
            className={`post-type-btn ${formData.post_type === 'interview' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, post_type: 'interview'})}
          >
            Interview Experience
          </button>

        </div>
        
        <div className="form-group">
          <label htmlFor="title">Post Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a descriptive title"
            maxLength="255"
            required
          />
        </div>
        
        {(formData.post_type === 'interview') && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Enter company name"
                list="company-list"
                required
              />
              <datalist id="company-list">
                {companies.map((company) => (
                  <option key={company} value={company} />
                ))}
              </datalist>
            </div>
            
            <div className="form-group">
              <label htmlFor="interview_date">Date</label>
              <input
                type="date"
                id="interview_date"
                name="interview_date"
                value={formData.interview_date}
                onChange={handleChange}
              />
            </div>
          </div>
        )}
        
        {formData.post_type === 'interview' && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="round_number">Round Number</label>
              <input
                type="number"
                id="round_number"
                name="round_number"
                value={formData.round_number}
                onChange={handleChange}
                min="1"
                max="10"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="round_type">Round Type</label>
              <select
                id="round_type"
                name="round_type"
                value={formData.round_type}
                onChange={handleChange}
              >
                <option value="online_assessment">Online Assessment</option>
                <option value="technical_interview">Technical Interview</option>
                <option value="hr_interview">HR Interview</option>
                <option value="system_design">System Design</option>
                <option value="behavioral">Behavioral Interview</option>
              </select>
            </div>
          </div>
        )}
        
        <div className="form-group content-editor">
          <label htmlFor="content">Content</label>
          
          <div className="editor-toolbar">
            <button 
              type="button" 
              className={`toolbar-btn ${isBold ? 'active' : ''}`}
              onClick={() => applyFormatting('bold')}
            >
              <i className="fas fa-bold"></i>
            </button>
            <button 
              type="button" 
              className={`toolbar-btn ${isItalic ? 'active' : ''}`}
              onClick={() => applyFormatting('italic')}
            >
              <i className="fas fa-italic"></i>
            </button>
            <button type="button" className="toolbar-btn">
              <i className="fas fa-list-ul"></i>
            </button>
            <button type="button" className="toolbar-btn">
              <i className="fas fa-list-ol"></i>
            </button>
            <button type="button" className="toolbar-btn">
              <i className="fas fa-code"></i>
            </button>
            <button type="button" className="toolbar-btn">
              <i className="fas fa-link"></i>
            </button>
          </div>
          
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Share your experience or thoughts..."
            rows="15"
            required
          ></textarea>
          <div className="editor-hint">
            <i className="fas fa-info-circle"></i> You can use Markdown for formatting.
          </div>
        </div>
        
        <div className="form-group visibility-options">
          <label>Post Visibility</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={formData.visibility === 'public'}
                onChange={handleChange}
              />
              <span>Public</span>
              <small>Everyone can see this post</small>
            </label>
            
            <label>
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={formData.visibility === 'private'}
                onChange={handleChange}
              />
              <span>Private</span>
              <small>Only you can see this post</small>
            </label>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="button" className="save-draft-btn">
            Save as Draft
          </button>
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Publish Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;