import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { FilterOptions } from '../../types';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface PostsFilterProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: Partial<FilterOptions>) => void;
}

const PostsFilter: React.FC<PostsFilterProps> = ({ filters, onFilterChange }) => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [postTypes, setPostTypes] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState<string>('');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    setSearchInput(filters.searchQuery || '');
  }, [filters.searchQuery]);

  const fetchFilterOptions = async () => {
    try {
      setCompanies(['Google', 'Amazon', 'Microsoft', 'Apple', 'Facebook']);
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
    value && value !== 'all' && key !== 'orderBy' && key !== 'searchQuery'
  ).length;

  // Filter controls for desktop view
  const FilterControls = () => (
    <>
      {/* Company Select */}
      <Select
        value={filters.company || undefined}
        onValueChange={(value) => onFilterChange({ company: value })}
      >
        <SelectTrigger className="w-full md:w-[160px] h-9 shrink-0">
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
        value={filters.roundNumber || 'all'} 
        onValueChange={(value) => {
          const roundMapping: { [key: string]: string } = {
            'Application': '0',
            'Online Assessment': '1',
            'Technical Interview': '2',
            'Behavioral Interview': '3',
            'System Design': '4',
            'HR Interview': '5',
            'Team Match': '6',
          };

          onFilterChange({ roundNumber: roundMapping[value] || 'all' });
        }}
      >
        <SelectTrigger className="w-full md:w-[160px] h-9 shrink-0">
          <SelectValue placeholder="All Rounds">
            {filters.roundNumber !== 'all' ? 
              ['Application', 'Online Assessment', 'Technical Interview', 'Behavioral Interview', 'System Design', 'HR Interview', 'Team Match'][parseInt(filters.roundNumber)] : 'All Rounds'}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">Rounds</SelectItem>
          {['Application', 'Online Assessment', 'Technical Interview', 'Behavioral Interview', 'System Design', 'HR Interview', 'Team Match'].map((type, index) => (
            <SelectItem key={type} value={type}>
              {type} 
            </SelectItem>
          ))}
        </SelectContent>
      </Select>




      {/* Order Select */}
      <Select
        value={filters.orderBy || '-created_at'}
        onValueChange={(value) => onFilterChange({ orderBy: value })}
      >
        <SelectTrigger className="w-full md:w-[160px] h-9 shrink-0">
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
        className="w-full md:w-[160px] flex items-center gap-1 text-sm hover:bg-muted whitespace-nowrap shrink-0"
        onClick={clearFilters}
      >
        <X className="h-3 w-3" />
        <span>Clear Filters</span>
      </Button>
    </>
  );

  return (
    <div className="w-full border rounded-lg mb-6 bg-background">
      {/* Mobile View */}
      <div className="block md:hidden p-3">
        {/* Search Bar - Always visible on mobile */}
        <form onSubmit={handleSearch} className="w-full mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              className="pl-10 pr-16 w-full h-9"
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
        
        {/* Filter toggle button */}
        <div className="flex items-center justify-between w-full">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
            </div>
            {isFiltersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Collapsible filter controls */}
        {isFiltersExpanded && (
          <div className="mt-3 flex flex-col gap-3">
            <FilterControls />
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto p-3 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <div className="hidden lg:flex items-center gap-2">
          <FilterControls />
        </div>
        
        {/* Filter sheet for medium screens */}
        <div className="flex lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px]">
              <div className="py-6 flex flex-col gap-4">
                <h3 className="text-lg font-medium">Filters</h3>
                <FilterControls />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Search Bar - visible on all screen sizes */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
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
      </div>

      {/* Optional separator for style */}
      <Separator />
    </div>
  );
};

export default PostsFilter;