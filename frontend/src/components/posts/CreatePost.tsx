import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostFormData, PostData, NewPost } from '../../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import PageHeader from '@/components/layout/PageHeader';
import { Bold, Italic, Code } from 'lucide-react';
import { DatePicker } from './DatePicker';

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    post_type: 'interview',
    company: '',
    position: '', 
    visibility: 'public',
    interview_date: '',
    round_number: 1,
    round_type: 'technical_interview',
  });

  const [companies, setCompanies] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    setCompanies(['Google', 'Amazon', 'Microsoft', 'Apple', 'Facebook']);
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      if (formData.content.trim() === '') {
        el.setAttribute('data-placeholder', 'Share your experience or thoughts...');
      } else {
        el.removeAttribute('data-placeholder');
      }
    }
  }, [formData.content]);
  

  const handleChange = (e: React.FormEvent<HTMLDivElement>) => {
    const contentElement = e.currentTarget as HTMLDivElement;
    setFormData({ ...formData, content: contentElement.innerText });
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData({ ...formData, [name]: value });
  };

    const applyFormatting = (format: 'bold' | 'italic') => {
    const contentElement = document.getElementById('content-field');
    if (contentElement) {
      document.execCommand(format, false, '');
      setFormData({ ...formData, content: contentElement.innerText });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.title.trim()) throw new Error('Title is required');
      if (!formData.content.trim()) throw new Error('Content is required');
      if (formData.post_type === 'interview' && !formData.company.trim()) throw new Error('Company is required for interview experiences');

      const postData: PostData = {
        title: formData.title,
        content: formData.content,
        post_type: formData.post_type,
        visibility: formData.visibility,
        company: formData.company || null,
        position: formData.position || null,
        interview_date: formData.interview_date || null,
      };

      if (formData.post_type === 'interview') {
        postData.interview_details = {
          round_number: formData.round_number,
          round_type: formData.round_type,
        };
      }

      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/posts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(postData),
        credentials: 'include',
      });

      if (!response.ok) {
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || 'Failed to create post');
        } catch (jsonError) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const newPost: NewPost = await response.json();
      navigate(`/posts/${newPost.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const preventEnterSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  return (
<div className="max-w-4xl w-full mx-auto">
      <Card className="w-full">
        <CardHeader>
          <PageHeader title="Create New Post" description="Share your experience with the community" />
        </CardHeader>

        {error && (
          <div className="px-6">
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

      <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-4">

              {/* Post Type Toggle */}
              <div className="mb-4">
                <ToggleGroup type="single" variant="outline" className="justify-start w-full" value={formData.post_type} onValueChange={(value) => value && handleSelectChange('post_type', value)}>
                  <ToggleGroupItem value="general" className={`flex-1 ${formData.post_type === 'general' ? 'bg-primary text-primary-foreground' : ''}`}>
                    General Post
                  </ToggleGroupItem>
                  <ToggleGroupItem value="interview" className={`flex-1 ${formData.post_type === 'interview' ? 'bg-primary text-primary-foreground' : ''}`}>
                    Interview Experience
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Title */}
              <div className="grid gap-2">
                <Label htmlFor="title">Post Title</Label>
                <Input id="title" name="title" value={formData.title} onChange={e => handleSelectChange('title', e.target.value)} onKeyDown={preventEnterSubmit} placeholder="Enter a descriptive title" maxLength={255} required />
              </div>

              {/* Interview-specific Fields */}
              {formData.post_type === 'interview' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" name="company" value={formData.company} onChange={e => handleSelectChange('company', e.target.value)} onKeyDown={preventEnterSubmit} placeholder="Enter company name" list="company-list" required />
                      <datalist id="company-list">
                        {companies.map(company => <option key={company} value={company} />)}
                      </datalist>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="position">Position</Label>
                      <Input id="position" name="position" value={formData.position} onChange={e => handleSelectChange('position', e.target.value)} onKeyDown={preventEnterSubmit} placeholder="Enter position (e.g., Software Engineer)" required />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="interview_date">Interview Date</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="interview_date"
                          name="interview_date"
                          value={formData.interview_date}
                          onChange={(e) => handleSelectChange('interview_date', e.target.value)}
                          onKeyDown={preventEnterSubmit}
                          placeholder="mm/dd/yyyy"
                          className="w-[240px]" 
                        />

                        {/* Date Picker Button */}
                        <DatePicker value={formData.interview_date} onChange={(date) => handleSelectChange('interview_date', date)} />
                      </div>
                    </div>
                    
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="round_number">Round</Label>
                      <Select value={formData.round_number.toString()} onValueChange={(value) => handleSelectChange('round_number', parseInt(value, 10))}>
                        <SelectTrigger><SelectValue placeholder="Select round number" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Application</SelectItem>
                          <SelectItem value="1">Online Assessment</SelectItem>
                          <SelectItem value="2">Technical Interview</SelectItem>
                          <SelectItem value="3">Behavioral Interview</SelectItem>
                          <SelectItem value="4">System Design</SelectItem>
                          <SelectItem value="5">HR Interview</SelectItem>
                          <SelectItem value="6">Team Match</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Content */}
              <div className="grid gap-2 mt-4">
                <Label htmlFor="content">Content</Label>

                {/* Toolbar for Bold and Italic */}
                <div className="bg-muted p-1 rounded-md flex flex-wrap gap-1 mb-2">
                  <Button
                    type="button"
                    variant={isBold ? "default" : "outline"}
                    size="icon"
                    onClick={() => applyFormatting('bold')}
                    className="h-8 w-8"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={isItalic ? "default" : "outline"}
                    size="icon"
                    onClick={() => applyFormatting('italic')}
                    className="h-8 w-8"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content Field with contentEditable */}
                <div
                  id="content-field"
                  ref={contentRef}
                  contentEditable
                  onInput={handleChange}
                  className="min-h-[200px] p-2 border rounded relative whitespace-pre-wrap before:content-[attr(data-placeholder)] before:text-gray-400 before:absolute before:top-2 before:left-2 empty:before:block"
                >
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Code className="h-3 w-3" /> You can use Markdown for formatting.
                </p>
              </div>

              {/* Visibility */}
              <div className="grid gap-4 pt-4">
                <Label>Post Visibility</Label>
                <RadioGroup
                  value={formData.visibility}
                  onValueChange={(value) => handleSelectChange('visibility', value)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="public"
                    className={`flex items-start space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent ${
                      formData.visibility === 'public' ? 'border-primary' : ''
                    }`}
                  >
                    <RadioGroupItem value="public" id="public" className="mt-1" />
                    <div className="grid gap-1">
                      <span className="font-medium">Public</span>
                      <p className="text-sm text-muted-foreground">Everyone can see this post</p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="private"
                    className={`flex items-start space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent ${
                      formData.visibility === 'private' ? 'border-primary' : ''
                    }`}
                  >
                    <RadioGroupItem value="private" id="private" className="mt-1" />
                    <div className="grid gap-1">
                      <span className="font-medium">Private</span>
                      <p className="text-sm text-muted-foreground">Only you can see this post</p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>


              {/* Buttons */}
              <div className="flex justify-between pt-6 gap-2">
                <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Publish Post'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePost;
