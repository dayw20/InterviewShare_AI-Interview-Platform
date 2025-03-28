import React, { useState, useEffect } from 'react';
import './Posts.css';

const PostsFilter = ({ filters, onFilterChange }) => {
  const [companies, setCompanies] = useState([]);
  const [roundTypes, setRoundTypes] = useState([]);
  const [postTypes, setPostTypes] = useState([]);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      setCompanies(['Google', 'Amazon', 'Microsoft', 'Apple', 'Facebook']);
      setRoundTypes(['Online Assessment', 'Technical Interview', 'HR Interview', 'System Design']);
      setPostTypes(['Interview Experience', 'Resume Submission', 'General Discussion']);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onFilterChange({ searchQuery: searchInput });
  };

  const clearFilters = () => {
    onFilterChange({
      company: '',
      roundType: '',
      postType: '',
      searchQuery: '',
      roundNumber: '',
      orderBy: '-created_at',
    });
    setSearchInput('');
  };
  
  return (
    <div className="posts-filter">
      <div className="search-container">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            <i className="fas fa-search"></i>
          </button>
        </form>
      </div>
      
      <div className="filters-container">
        <div className="filter-group">
          <label>Company:</label>
          <select 
            value={filters.company}
            onChange={(e) => onFilterChange({ company: e.target.value })}
          >
            <option value="">All Companies</option>
            {companies.map(company => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Round Number:</label>
          <select 
            value={filters.roundNumber || ''}
            onChange={(e) => onFilterChange({ roundNumber: e.target.value })}
          >
            <option value="">All Rounds</option>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        
        <div className="filter-group">
          <label>Post Type:</label>
          <select 
            value={filters.postType}
            onChange={(e) => onFilterChange({ postType: e.target.value })}
          >
            <option value="">All Types</option>
            {postTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select 
            value={filters.orderBy}
            onChange={(e) => onFilterChange({ orderBy: e.target.value })}
          >
            <option value="-created_at">Newest</option>
            <option value="created_at">Oldest</option>
            <option value="-likes_count">Most Liked</option>
            <option value="-comments_count">Most Commented</option>
          </select>
        </div>
        
        <button className="clear-filters-button" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default PostsFilter;