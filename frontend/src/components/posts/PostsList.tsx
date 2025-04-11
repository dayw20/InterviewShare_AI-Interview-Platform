// src/components/posts/PostsList.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PostsFilter from './PostsFilter'; 
import { Post, FilterOptions, LikeResponse, ApiResponse } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Plus, Search, ThumbsUp } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

const StyledPostItem: React.FC<{
  post: Post;
  onLike: (postId: number) => void;
}> = ({ post, onLike }) => {
  const navigate = useNavigate();

  return (
    <Card className="mb-4 overflow-hidden hover:shadow-md transition-shadow">
      <div className="cursor-pointer" onClick={() => navigate(`/posts/${post.id}`)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="line-clamp-2">{post.title}</CardTitle>
              <CardDescription className="flex flex-wrap gap-2">
                {post.company && (
                  <Badge variant="secondary" className="text-xs">
                    {post.company}
                  </Badge>
                )}
                {post.post_type === 'interview' && post.round_type && (
                  <Badge variant="outline" className="text-xs">
                    {post.round_type.replace(/_/g, ' ')}
                  </Badge>
                )}
                {post.interview_date && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.interview_date).toLocaleDateString()}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          <p className="line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
        </CardContent>
      </div>
      
      <CardFooter className="pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Posted {new Date(post.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <Button 
          variant={post.liked ? "default" : "ghost"} 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onLike(post.id);
          }}
          className="gap-1"
        >
          <ThumbsUp className="h-3 w-3" />
          <span className="text-xs">{post.likes_count || 0}</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

const PostsList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const trendingTimeoutRef = useRef<number | null>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    company: 'all',
    roundType: 'all',
    postType: 'all',
    searchQuery: '',
    roundNumber: 'all',
    orderBy: '-created_at'  
  });
  const [showFilterBar, setShowFilterBar] = useState(true);
  const lastScrollY = useRef(window.scrollY);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down
        setShowFilterBar(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up
        setShowFilterBar(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  
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
      if (!response.ok) throw new Error('Failed to fetch trending posts');
      
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
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }

      const response = await fetch(`/api/posts/?${params.toString()}`, { headers });

      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const data = await response.json();
      
      // Handle both array response and paginated object response
      const postsArray: Post[] = Array.isArray(data) 
        ? data 
        : ((data as ApiResponse<Post>).results || []);
        
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
    if (filters.company && filters.company !== 'all') {
      result = result.filter(post =>
        post.company &&
        post.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }
    
    // Apply round number filter
    if (filters.roundNumber && filters.roundNumber !== 'all') {
      result = result.filter(post => {
        // Assuming post has a 'round_number' property that might be a string or number
        const postRoundNumber = typeof post.round_number === 'number' 
          ? post.round_number 
          : parseInt(post.round_number as unknown as string);
        
        return postRoundNumber === parseInt(filters.roundNumber);
      });
    }
    
    // Apply post type filter
    if (filters.postType && filters.postType !== 'all') {
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

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters({ ...filters, ...newFilters });
  };
  
  const handleLike = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Redirect to login or show login prompt
        navigate('/login', { state: { from: location } });
        return;
      }
      
      const response = await fetch(`/api/posts/${postId}/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error('Failed to like the post');
      }
  
      const data = await response.json() as LikeResponse;
  
      // Update posts state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, likes_count: data.likes_count, liked: data.liked }
            : post
        )
      );
  
      // Re-fetch trending if needed
      if (trendingTimeoutRef.current) {
        window.clearTimeout(trendingTimeoutRef.current);
      }
  
      trendingTimeoutRef.current = window.setTimeout(() => {
        fetchTrendingPosts();
      }, 500);
  
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <PageHeader title="Interview Experiences" description="Browse all shared interview posts" />
      </div>
  
      <div
        className={`sticky top-[60px] z-40 bg-background border-b transition-transform duration-300 ${
          showFilterBar ? 'translate-y-0 shadow-md' : '-translate-y-full'
        }`}        
      >
        <PostsFilter filters={filters} onFilterChange={handleFilterChange} />
      </div>

  
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No posts found</h3>
                <p className="text-muted-foreground">No posts match your current filter criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <StyledPostItem key={post.id} post={post} onLike={handleLike} />
              ))}
            </div>
          )}
        </div>
  
        <div className="order-first lg:order-last">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                Trending
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {trendingPosts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No trending posts yet</p>
                </div>
              ) : (
                trendingPosts.map(post => (
                  <div
                    key={post.id}
                    className="py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/posts/${post.id}`)}
                  >
                    <h4 className="font-medium line-clamp-1 mb-1">{post.title}</h4>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {post.company && <span>{post.company}</span>}
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{post.likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PostsList;