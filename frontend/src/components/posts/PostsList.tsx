// PostsList.tsx (with Load More Pagination)
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
      <div className="cursor-pointer" 
      onClick={() => {
        navigate(`/posts/${post.id}`, {
          state: { fromScrollY: window.scrollY },
        });
      }}
      >
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
        <div className="flex items-center gap-2">
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
          <div className="text-xs text-muted-foreground">
            <span>Comments: {post.comments_count || 0}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

const PostsList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    company: 'all',
    roundType: 'all',
    postType: 'all',
    searchQuery: '',
    roundNumber: 'all',
    orderBy: '-created_at'  
  });
  const [showFilterBar, setShowFilterBar] = useState(true);
  const navigate = useNavigate();
  const lastScrollY = useRef(window.scrollY);
  const trendingTimeoutRef = useRef<number | null>(null);
  const location = useLocation(); 

  useEffect(() => {
    fetchPosts();
  }, [location, filters.orderBy]);

  useEffect(() => {
    if (!loading) {
      const scrollY = sessionStorage.getItem('restoreScrollY');
      if (scrollY) {
        window.scrollTo({ top: parseInt(scrollY), behavior: 'instant' });
        sessionStorage.removeItem('restoreScrollY');
      }
    }
  }, [loading]);
  

  useEffect(() => {
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
      const token = sessionStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Token ${token}`;

      const response = await fetch(`/api/posts/?${params.toString()}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch posts');

      const data = await response.json();
      const postsArray: Post[] = data.results || [];
      setPosts(postsArray);
      setFilteredPosts(postsArray);
      setNextPageUrl(data.next || null);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!nextPageUrl) return;
    try {
      setLoadingMore(true);
      const token = sessionStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Token ${token}`;

      const response = await fetch(nextPageUrl, { headers });
      if (!response.ok) throw new Error('Failed to load more posts');
      const data = await response.json();
      const morePosts: Post[] = data.results || [];
      const updated = [...posts, ...morePosts];
      setPosts(updated);
      setFilteredPosts(updated);
      setNextPageUrl(data.next || null);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const applyFilters = () => {
    let result = [...posts];
    if (filters.company && filters.company !== 'all') {
      result = result.filter(post => post.company?.toLowerCase().includes(filters.company.toLowerCase()));
    }
    if (filters.roundNumber && filters.roundNumber !== 'all') {
      result = result.filter(post => Number(post.round_number) === Number(filters.roundNumber));
    }
    if (filters.postType && filters.postType !== 'all') {
      result = result.filter(post => post.post_type === filters.postType);
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(post => post.title.toLowerCase().includes(query) || post.content.toLowerCase().includes(query));
    }
    setFilteredPosts(result);
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleLike = async (postId: number) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return navigate('/login', { state: { from: location } });
      const response = await fetch(`/api/posts/${postId}/like/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to like');
      const data = await response.json();
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: data.likes_count, liked: data.liked } : p));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 pb-6">
      <div className="flex justify-between items-center mb-4">
        <PageHeader title="Interview Experiences" description="Browse all shared interview posts" />
      </div>
      <div className={`sticky top-[60px] z-40 mb-4 bg-background border-b transition-transform duration-300 ${showFilterBar ? 'translate-y-0 shadow-md' : '-translate-y-full'}`}>
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
            <>
              <div className="space-y-4">
                {filteredPosts.map(post => (
                  <StyledPostItem key={post.id} post={post} onLike={handleLike} />
                ))}
              </div>
              {nextPageUrl && (
                <div className="flex justify-center mt-6">
                  <Button onClick={loadMorePosts} disabled={loadingMore}>
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        <div className="order-first lg:order-last">
          <Card className="w-full bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl font-semibold text-gray-800">Trending</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {trendingPosts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No trending posts yet</p>
                </div>
              ) : (
                trendingPosts.map((post) => (
                  <div key={post.id} className="py-3 cursor-pointer hover:bg-muted/10 transition-colors rounded-lg p-3" onClick={() => navigate(`/posts/${post.id}`)}>
                    <h4 className="font-semibold text-base mb-2 text-gray-900 line-clamp-2">{post.title}</h4>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {post.company && <span className="font-medium text-gray-600">{post.company}</span>}
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
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
