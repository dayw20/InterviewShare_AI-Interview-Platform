// src/types/index.ts



export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}
  
  export interface Comment {
    id: number;
    user: User;
    content: string;
    created_at: string;
    replies: Comment[];
    parent_comment_id?: number;
  }

  export interface TimelineItem {
    id: number;
    title: string;
    round_number: number;
    round_type:string;
    interview_date: string;

    status?: 'pass' | 'fail' | 'pending';
  }
  

  export interface Post {
  id: number;
  user_id: number;
  username: string;
  user_avatar?: string;
  title: string;
  content: string;
  company?: string;
  position?: string;
  post_type: 'general' | 'interview';
  created_at: string;
  likes_count: number;
  comments_count: number;
  liked?: boolean;

  // Interview specific fields
  interview_date?: string;
  round_number?: number;
  round_type?: string;

  // Optional, loaded in detailed views
  comments?: Comment[];

  interview_details?: {
    round_number: number;
    round_type: string;
  };
}

export interface PostData {
  title: string;
  content: string;
  post_type: string;
  visibility: string;
  company: string | null;
  position: string | null;
  interview_date: string | null;
  interview_details?: {
    round_number: number;
    round_type: string;
  };
}

  export interface NewPost {
    id: number;
    [key: string]: any;
  }


  export interface PostDetailData extends Post {
    user: User; 
    comments: Comment[];
    timeline: TimelineItem[];
    visibility: string;
    interview_details?: {
      visibility: string;
      round_number: number;
      round_type: string;
      position: string;
      status?: 'pass' | 'fail' | 'pending';
    };
  }
  
  
  export interface FilterOptions {
    company: string;
    roundType: string;
    postType: string;
    searchQuery: string;
    roundNumber: string;
    orderBy: string;
  }
  
  export interface ApiResponse<T> {
    count?: number;
    next?: string | null;
    previous?: string | null;
    results: T[];
  }
  
  export interface LikeResponse {
    liked: boolean;
    likes_count: number;
  }
  
  export interface PostFormData {
    title: string;
    content: string;
    position: string;
    post_type: 'general' | 'interview';
    company: string;
    visibility: 'public' | 'private';
    interview_date: string;
    round_number: number;
    round_type: string;
  }