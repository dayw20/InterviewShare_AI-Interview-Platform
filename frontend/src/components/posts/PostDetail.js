// src/components/posts/PostDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './PostDetail.css';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${id}/`);
      if (!response.ok) {
        throw new Error('Post not found');
      }
      const data = await response.json();
      setPost(data);
      setError(null);
    } catch (error) {
      setError(error.message);
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const response = await fetch(`/api/posts/${id}/add_comment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content: commentText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      // Refresh the post to show the new comment
      fetchPost();
      setCommentText('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo) return;

    try {
      const response = await fetch(`/api/posts/${id}/add_comment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content: replyText,
          parent_comment_id: replyingTo
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reply');
      }

      // Refresh the post to show the new reply
      fetchPost();
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/posts/${id}/like/`, {
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
  
      const data = await response.json();
      console.log('Liked post:', data);
  
      setPost(prevPost => ({
        ...prevPost,
        likes_count: data.likes_count
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  

  const startReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyText('');
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  if (loading) {
    return <div className="loading">Loading post...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!post) {
    return <div className="not-found">Post not found</div>;
  }

  return (
    <div className="post-detail-container">
      <div className="post-detail">
        <div className="post-header">
          <div className="post-metadata">
            <div className="post-company-info">
              {post.company && (
                <>
                  <span className="company-name">{post.company}</span>
                  {post.interview_details && (
                    <span className="interview-round">
                      Round {post.interview_details.round_number}: {post.interview_details.round_type_display}
                    </span>
                  )}
                </>
              )}
              <span className="post-date">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="post-author">
              <img 
                src={post.user.avatar || '/default-avatar.png'} 
                alt={post.user.username} 
                className="author-avatar" 
              />
              <span className="author-name">{post.user.username}</span>
            </div>
          </div>
          <h1 className="post-title">{post.title}</h1>
        </div>

        <div className="post-content">
          {post.content.split('\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        <div className="post-actions">
        <button className="action-button like-button" onClick={handleLike}>
          <i className="far fa-thumbs-up"></i> Like ({post.likes_count})
        </button>

          <button className="action-button share-button">
            <i className="far fa-share-square"></i> Share
          </button>
        </div>

        <div className="comments-section">
          <h3>Comments ({post.comments ? post.comments.length : 0})</h3>
          
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="comment-input"
            ></textarea>
            <button type="submit" className="comment-submit-btn">Post Comment</button>
          </form>
          
          {post.comments && post.comments.length > 0 ? (
            <div className="comments-list">
              {post.comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <img 
                      src={comment.user.avatar || '/default-avatar.png'} 
                      alt={comment.user.username} 
                      className="commenter-avatar" 
                    />
                    <div className="comment-info">
                      <span className="commenter-name">{comment.user.username}</span>
                      <span className="comment-date">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="comment-content">{comment.content}</div>
                  
                  <div className="comment-actions">
                    <button 
                      className="reply-button"
                      onClick={() => startReply(comment.id)}
                    >
                      Reply
                    </button>
                  </div>
                  
                  {replyingTo === comment.id && (
                    <form className="reply-form" onSubmit={handleReplySubmit}>
                      <textarea
                        placeholder={`Reply to ${comment.user.username}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="reply-input"
                      ></textarea>
                      <div className="reply-actions">
                        <button type="button" className="cancel-reply-btn" onClick={cancelReply}>
                          Cancel
                        </button>
                        <button type="submit" className="post-reply-btn">
                          Post Reply
                        </button>
                      </div>
                    </form>
                  )}
                  
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="comment-replies">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="comment-reply">
                          <div className="comment-header">
                            <img 
                              src={reply.user.avatar || '/default-avatar.png'} 
                              alt={reply.user.username} 
                              className="commenter-avatar" 
                            />
                            <div className="comment-info">
                              <span className="commenter-name">{reply.user.username}</span>
                              <span className="comment-date">
                                {new Date(reply.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="comment-content">{reply.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-comments">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </div>
      
      <div className="post-navigation">
        <Link to="/posts" className="back-to-posts">
          <i className="fas fa-arrow-left"></i> Back to Posts
        </Link>
      </div>
    </div>
  );
};

export default PostDetail;