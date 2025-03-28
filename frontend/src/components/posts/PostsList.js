import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import PostItem from './PostItem';
import PostsFilter from './PostsFilter';
import './Posts.css';

const PostsList = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const trendingTimeoutRef = useRef(null); 

  const [filters, setFilters] = useState({
    company: '',
    roundType: '',
    postType: '',
    searchQuery: '',
    roundNumber: '',
    orderBy: '-created_at'  
  });
  
  
  const location = useLocation(); 

  useEffect(() => {
    fetchPosts();
  }, [location, filters.orderBy]); 
  

  useEffect(() => {
    // Apply filters whenever filters change
    applyFilters();
  }, [filters, posts]);

  useEffect(() => {
    fetchTrendingPosts();
  }, []);

  const fetchTrendingPosts = async () => {
    try {
      const response = await fetch('/api/posts/trending/');
      const data = await response.json();
      setTrendingPosts(data);
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    }
  };
  

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.orderBy) params.append('ordering', filters.orderBy);

      const response = await fetch(`/api/posts/?${params.toString()}`);
      const data = await response.json();
      const postsArray = Array.isArray(data) ? data : (data.results || []);
      setPosts(postsArray);
      setFilteredPosts(postsArray);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(posts)) {
      setFilteredPosts([]);
      return;
    }
    let result = [...posts];
    
    // Apply company filter
    if (filters.company) {
      result = result.filter(post =>
        post.company &&
        post.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }
    
    
    if (filters.roundNumber) {
      result = result.filter(post =>
        post.round_number === parseInt(filters.roundNumber)
      );
    }
    
    // Apply post type filter
    if (filters.postType) {
      result = result.filter(post => 
        post.post_type === filters.postType
      );
    }
    
    // Apply search query (across title and content)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.content.toLowerCase().includes(query)
      );
    }
    
    setFilteredPosts(result);
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };
  

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error('Failed to like the post');
      }
  
      const data = await response.json(); // { liked: true/false, likes_count: number }
  
      // Update posts
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, likes_count: data.likes_count, liked: data.liked }
            : post
        )
      );
  
      // Re-fetch trending if needed
      if (trendingTimeoutRef.current) clearTimeout(trendingTimeoutRef.current);
  
      trendingTimeoutRef.current = setTimeout(() => {
        fetchTrendingPosts();
      }, 500);
  
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  

  return (
    <div className="posts-container">
      <div className="posts-header">
        <h1>Interview Experiences</h1>
        <div className="header-buttons">
          <Link to="/create-post" className="create-post-btn">
            <i className="fas fa-plus"></i> New Post
          </Link>
        </div>
      </div>
  
      <PostsFilter filters={filters} onFilterChange={handleFilterChange} />
  
      <div className="posts-content-wrapper">
        <div className="posts-main">
          {loading ? (
            <div className="loading">Loading posts...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="no-posts">No posts match your criteria</div>
          ) : (
            <div className="posts-list">
              {filteredPosts.map(post => (
                <PostItem key={post.id} post={post} onLike={handleLike} />
              ))}
            </div>
          )}
        </div>
  
        <div className="trending-sidebar">
          <h3>🔥 Trending</h3>
          {trendingPosts.map(post => (
            <div
              key={post.id}
              className="trending-card"
              onClick={() => navigate(`/posts/${post.id}`)}
            >
              <h4 className="trending-title">{post.title}</h4>
              <div className="trending-meta">
                {post.company && <span>{post.company}</span>}
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <div className="trending-likes">
                <i className="far fa-thumbs-up"></i> {post.likes_count || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostsList;