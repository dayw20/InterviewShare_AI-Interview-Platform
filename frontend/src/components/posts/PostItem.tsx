import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Post } from '../../types';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PostItemProps {
  post: Post;
  onLike: (id: number) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onLike }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/posts/${post.id}`);
  };

  // Extract initials for avatar fallback
  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <Card className="w-full mb-4 hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={handleClick}>
      <CardHeader className="p-4 pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user_avatar || '/default-avatar.png'} alt="user avatar" />
              <AvatarFallback>{getInitials(post.username)}</AvatarFallback>
            </Avatar>
            <Link
              to={`/users/${post.username}`}
              className="font-medium text-sm hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {post.username}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {post.company && (
              <Badge variant="outline" className="font-normal">
                {post.company}
              </Badge>
            )}
            {post.round_type && (
              <Badge variant="secondary" className="font-normal">
                {post.round_type}
              </Badge>
            )}
            <span className="text-xs">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
        <p className="text-sm text-muted-foreground">
          {post.content.length > 200
            ? `${post.content.substring(0, 200)}...`
            : post.content}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t flex justify-between">
        <TooltipProvider>
          <div className="flex space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={post.liked ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center gap-1 ${post.liked ? 'text-white' : 'text-muted-foreground'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(post.id);
                  }}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{post.likes_count || 0}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Like</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    // handle comment section expand or focus
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments_count || 0}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Comment</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    // handle share modal or logic
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default PostItem;