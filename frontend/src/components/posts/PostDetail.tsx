// src/components/posts/PostDetail.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { LikeResponse, PostDetailData } from '../../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { XCircle } from 'lucide-react';

import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp } from 'lucide-react';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};


const roundTypeMap: Record<number, string> = {
  0: "Application",
  1: "Online Assessment",
  2: "Technical Interview",
  3: "Behavioral Interview",
  4: "System Design",
  5: "HR Interview",
  6: "Team Match",
};

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const location = useLocation();

  const storedUser = sessionStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : null;
  const isAuthor = post?.user?.username === currentUsername;
  


  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      const response = await fetch(`${backendUrl}/posts/${id}/`, { headers });
      if (!response.ok) throw new Error('Post not found');
      const data: PostDetailData = await response.json();
      setPost(data);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id) return;

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: `/posts/${id}` } });
        return;
      }
      
      await fetch(`${backendUrl}/posts/${id}/add_comment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        credentials: 'include',
        body: JSON.stringify({ content: commentText }),
      });
      fetchPost();
      setCommentText('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleReplySubmit = async (e: FormEvent, parentCommentId: number) => {
    e.preventDefault();
    if (!replyText.trim() || !id) return;

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: `/posts/${id}` } });
        return;
      }
      
      await fetch(`${backendUrl}/posts/${id}/add_comment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        body: JSON.stringify({ content: replyText, parent_comment_id: parentCommentId }),
        credentials: 'include',
        
      });
      fetchPost();
      setReplyText('');
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleLike = async () => {
    if (!id) return;
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: `/posts/${id}` } });
        return;
      }
      
      const response = await fetch(`${backendUrl}/posts/${id}/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to like the post');

      const data = await response.json() as LikeResponse;
      setPost(prev => prev ? { ...prev, likes_count: data.likes_count, liked: data.liked } : prev);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (loading) 
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
    
  if (error) 
    return (
      <div className="text-center p-8 text-destructive">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
    
  if (!post) 
    return (
      <div className="text-center p-8 text-muted-foreground">
        <h2 className="text-xl font-semibold mb-2">Not Found</h2>
        <p>Post not found</p>
      </div>
    );

    return (
      <div className="max-w-4xl w-full mx-auto">
        <Card className="w-full relative">
          {/* Sticky top bar */}
          <div className="sticky top-0 z-30 bg-background border-b flex items-center justify-between px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const fromScrollY = location.state?.fromScrollY ?? 0;
              sessionStorage.setItem('restoreScrollY', String(fromScrollY));
              navigate('/posts');
            }}
            className="gap-1"
          >
            ← Back to Posts
          </Button>


            <span className="text-sm text-muted-foreground">
              {post.company} - {post.position}
            </span>
          </div>
    
          <CardHeader className="space-y-4">
            {/* Post badges and meta */}
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {post.company && (
                <Badge variant="secondary" className="font-medium">
                  {post.company}
                </Badge>
              )}
              {post.post_type === 'interview' && post.interview_details?.round_number !== undefined && (
                <Badge variant="outline" className="font-medium">
                  {roundTypeMap[post.interview_details.round_number]}
                </Badge>
              )}
      
              {post.visibility && (
                <Badge variant="secondary" className="font-medium capitalize">
                  {post.visibility}
                </Badge>
              )}
              {post.interview_date && (
                <span>Interview: {new Date(post.interview_date).toLocaleDateString()}</span>
              )}
              <span className="ml-auto">Posted: {new Date(post.created_at).toLocaleDateString()}</span>
            </div>
    
            {/* Post title */}
            <CardTitle className="text-2xl font-bold">{post.title}</CardTitle>
    
            {/* Author */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.user.avatar || '/default-avatar.png'} alt={post.user.username} />
                <AvatarFallback>{post.user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <Link to={`/users/${post.user.id}`} className="font-medium hover:underline">
                {post.user.username}
              </Link>
            </div>
          </CardHeader>
    
          <CardContent>
            {/* Post content */}
            <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
              {post.content.trim() ? (
                post.content.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))
              ) : (
                <p className="text-muted-foreground italic">No content for application submission.</p>
              )}
            </div>
    
            {/* Action row */}
            <div className="flex flex-wrap gap-4 items-center mb-6">
              <Button
                variant={post.liked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className="gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{post.likes_count || 0}</span>
              </Button>

    
              {isAuthor && post?.interview_details && (
                <div className="bg-muted rounded-md p-2 flex items-center space-x-2">
                  <Label htmlFor="status" className="text-sm">Update Status:</Label>
                  <Select
                    value={post.interview_details.status || 'pending'}
                    onValueChange={async (value) => {
                      setIsUpdatingStatus(true);
                      try {
                        const token = sessionStorage.getItem('token');
                        const response = await fetch(`${backendUrl}/posts/${post.id}/`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${token}`,
                            'X-CSRFToken': getCookie('csrftoken') || '',
                          },
                          body: JSON.stringify({
                            interview_details: { status: value },
                          }),
                          credentials: 'include',
                        });
                        if (!response.ok) throw new Error('Failed to update status');
                        const data = await response.json();
                        setPost(data);
                        toast.success('Status updated successfully', {
                          className: 'bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center space-x-2',
                          icon: <ThumbsUp className="w-5 h-5 mr-2 text-white" />, 
                        });
                      } catch (error) {
                        console.error(error);
                        toast.error('Failed to update status', {
                          className: 'bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center space-x-2',
                          icon: <XCircle className="w-5 h-5 mr-2 text-white" />, 
                        });
                      } finally {
                        setIsUpdatingStatus(false);
                      }
                    }}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
    
            {/* Timeline */}
            {post.timeline && post.timeline.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-6 text-muted-foreground">
                  Timeline for {post.company} - {post.position}
                </h3>
    
                <div className="relative border-l-2 border-muted pl-6 space-y-8" ref={timelineRef => {
                  if (timelineRef) {
                    const activeItem = timelineRef.querySelector('.active-step');
                    if (activeItem && activeItem.scrollIntoView) {
                      activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                }}>
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 to-transparent animate-pulse" />
                  {post.timeline.map(item => {
                    const isActive = item.id === post.id;
                    const statusColors: Record<string, string> = {
                      pass: 'bg-green-500',
                      fail: 'bg-red-500',
                      pending: 'bg-yellow-500',
                    };
                    const statusColor = statusColors[item.status as keyof typeof statusColors] || 'bg-muted-foreground';

    
                    return (
                      <div key={item.id} className={`relative transition-all group ${isActive ? 'active-step' : ''}`}>
                        {/* Dot */}
                        <span className={`absolute -left-[18px] top-1 w-4 h-4 rounded-full border-2 transition-colors ${isActive
                          ? 'bg-primary border-primary'
                          : `${statusColor} border-background group-hover:border-primary group-hover:bg-primary/80`
                        }`} />
    
                        {/* Content */}
                        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 ${isActive
                          ? 'text-primary font-semibold'
                          : 'text-muted-foreground group-hover:text-primary'
                        }`}>
                          <div className="flex flex-col text-sm">
                          <span className="capitalize">
                            {roundTypeMap[item.round_number] || 'Unknown Round'}
                            {item.interview_date && ` • ${new Date(item.interview_date).toLocaleDateString()}`}
                          </span>

                            <span className="text-xs capitalize">
                              {item.status || 'pending'}
                            </span>
                          </div>
    
                          {item.id !== post.id ? (
                            <a href={`/posts/${item.id}`} className="text-sm text-blue-600 hover:underline transition-colors">
                              View Post →
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">(You are here)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
    
          <Separator />
        
        
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Comments ({post.comments?.length || 0})</h3>
          
          <form className="mb-8" onSubmit={handleCommentSubmit}>
            <Textarea
              value={commentText}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="mb-2"
              required
            />
            <div className="flex justify-end">
              <Button type="submit">Post Comment</Button>
            </div>
          </form>
          
          <div className="space-y-6">
            {post.comments && post.comments
              .filter(comment => !comment.parent_comment_id)
              .map(comment => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={comment.user.avatar || '/default-avatar.png'} alt={comment.user.username} />
                      <AvatarFallback>{comment.user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      <Link to={`/users/${comment.user.id}`} className="font-medium hover:underline">
                        {comment.user.username}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2">{comment.content}</div>
                  
                  <div className="flex mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-xs h-7"
                    >
                      Reply
                    </Button>
                  </div>
                  
                  {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-6 space-y-4 border-l-2 pl-4">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="bg-muted/50 rounded-md p-3">
                        {/* Reply content */}
                      </div>
                    ))}
                  </div>
                )}

                {replyingTo === comment.id && (
                  <form className="mb-4 ml-6 border-l-2 pl-4" onSubmit={(e) => handleReplySubmit(e, comment.id)}>
                    <Textarea
                      value={replyText}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="mb-2"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm">Reply</Button>
                    </div>
                  </form>
                )}
                  
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-6 space-y-4 border-l-2 pl-4">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="bg-muted/50 rounded-md p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={reply.user.avatar || '/default-avatar.png'} alt={reply.user.username} />
                              <AvatarFallback>{reply.user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                              <Link to={`/users/${reply.user.id}`} className="font-medium text-sm hover:underline">
                                {reply.user.username}
                              </Link>
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-sm">{reply.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostDetail;