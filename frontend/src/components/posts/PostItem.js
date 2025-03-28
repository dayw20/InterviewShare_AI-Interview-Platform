import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './PostItem.css';

const PostItem = ({ post, onLike }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/posts/${post.id}`);
  };

  return (
    <div className="post-item" onClick={handleClick}>
      <div className="post-header">
        <div className="post-user-info">
          <img 
            src={post.user_avatar || '/default-avatar.png'} 
            alt="user avatar" 
            className="user-avatar"
          />
          {/* Username link (this should not trigger post click) */}
          <Link
            to={`/users/${post.username}`}
            className="username"
            onClick={(e) => e.stopPropagation()}
          >
            {post.username}
          </Link>
        </div>

        <div className="post-metadata">
          <span className="post-company">{post.company}</span>
          <span className="post-round-type">{post.round_type}</span>
          <span className="post-date">
            {new Date(post.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <h2 className="post-title">{post.title}</h2>

      <div className="post-content-preview">
        {post.content.length > 200
          ? `${post.content.substring(0, 200)}...`
          : post.content}
      </div>

      <div className="post-actions">
        <button
          className={`action-button like-button ${post.liked ? 'liked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onLike(post.id);
          }}
        >
          <i className={`fa${post.liked ? 's' : 'r'} fa-thumbs-up`}></i> {post.likes_count || 0}
        </button>
        <button
          className="action-button comment-button"
          onClick={(e) => {
            e.stopPropagation();
            // handle comment section expand or focus
          }}
        >
          <i className="far fa-comment"></i> {post.comments_count || 0}
        </button>
        <button
          className="action-button share-button"
          onClick={(e) => {
            e.stopPropagation();
            // handle share modal or logic
          }}
        >
          <i className="far fa-share-square"></i>
        </button>
      </div>
    </div>
  );
};

export default PostItem;
