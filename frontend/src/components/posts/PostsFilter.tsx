import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { FilterOptions } from '../../types';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PostsFilterProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: Partial<FilterOptions>) => void;
}

const PostsFilter: React.FC<PostsFilterProps> = ({ filters, onFilterChange }) => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [roundTypes, setRoundTypes] = useState<string[]>([]);
  const [postTypes, setPostTypes] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState<string>('');

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    setSearchInput(filters.searchQuery || '');
  }, [filters.searchQuery]);

  const fetchFilterOptions = async () => {
    try {
      setCompanies(['Google', 'Amazon', 'Microsoft', 'Apple', 'Facebook']);
      setRoundTypes(['Online Assessment', 'Technical Interview', 'HR Interview', 'System Design']);
      setPostTypes(['Interview Experience', 'Resume Submission', 'General Discussion']);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    onFilterChange({ searchQuery: searchInput });
  };

  const clearFilters = () => {
    onFilterChange({
      company: 'all',
      roundType: 'all',
      postType: 'all',
      searchQuery: '',
      roundNumber: 'all',
      orderBy: '-created_at',
    });
    setSearchInput('');
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) =>
    value && key !== 'orderBy' && key !== 'searchQuery'
  ).length;

  return (
    <div className="w-full border rounded-lg mb-6 bg-background">
      <div className="w-full flex items-center gap-2 overflow-x-auto p-3 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {/* Company Select */}
        <Select
          value={filters.company || undefined}
          onValueChange={(value) => onFilterChange({ company: value })}
        >
          <SelectTrigger className="w-[140px] h-9 shrink-0">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Company</SelectItem>
            {companies.map(company => (
              <SelectItem key={company} value={company}>{company}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Round Number Select */}
        <Select
          value={filters.roundNumber || undefined}
          onValueChange={(value) => onFilterChange({ roundNumber: value })}
        >
          <SelectTrigger className="w-[120px] h-9 shrink-0">
            <SelectValue placeholder="All Rounds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Rounds</SelectItem>
            {[1, 2, 3, 4, 5, 6].map(num => (
              <SelectItem key={num} value={num.toString()}>{`Round ${num}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Post Type Select */}
        <Select
          value={filters.postType || undefined}
          onValueChange={(value) => onFilterChange({ postType: value })}
        >
          <SelectTrigger className="w-[150px] h-9 shrink-0">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Types</SelectItem>
            {postTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              className="pl-10 pr-20 w-full h-9"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-0 top-0 h-full rounded-l-none"
            >
              Search
            </Button>
          </div>
        </form>

        {/* Order Select */}
        <Select
          value={filters.orderBy || '-created_at'}
          onValueChange={(value) => onFilterChange({ orderBy: value })}
        >
          <SelectTrigger className="w-[150px] h-9 shrink-0">
            <SelectValue placeholder="Newest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-created_at">Newest</SelectItem>
            <SelectItem value="created_at">Oldest</SelectItem>
            <SelectItem value="-likes_count">Most Liked</SelectItem>
            <SelectItem value="-comments_count">Most Commented</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 text-sm hover:bg-muted whitespace-nowrap shrink-0"
          onClick={clearFilters}
        >
          <X className="h-3 w-3" />
          <span>Clear Filters</span>
        </Button>
      </div>

      {/* Optional separator for style */}
      <Separator />
    </div>
  );
};

export default PostsFilter;
