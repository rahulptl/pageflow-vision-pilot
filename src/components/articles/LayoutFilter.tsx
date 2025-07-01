
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter, ArrowUpDown } from "lucide-react";

interface LayoutFilterProps {
  onFilterChange: (filters: LayoutFilters) => void;
  onSortChange: (sort: LayoutSort) => void;
}

export interface LayoutFilters {
  search: string;
  type: string;
  dateRange: string;
}

export interface LayoutSort {
  field: 'created_at' | 'layout_id';
  direction: 'asc' | 'desc';
}

export function LayoutFilter({ onFilterChange, onSortChange }: LayoutFilterProps) {
  const [filters, setFilters] = useState<LayoutFilters>({
    search: '',
    type: '',
    dateRange: '',
  });
  
  const [sort, setSort] = useState<LayoutSort>({
    field: 'created_at',
    direction: 'desc',
  });

  const updateFilter = (key: keyof LayoutFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const updateSort = (field: LayoutSort['field']) => {
    const newDirection = sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc';
    const newSort = { field, direction: newDirection };
    setSort(newSort);
    onSortChange(newSort);
  };

  const clearFilters = () => {
    const clearedFilters = { search: '', type: '', dateRange: '' };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter & Sort Layouts
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search Layouts</Label>
            <Input
              id="search"
              placeholder="Search by ID or metadata..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="type">Layout Type</Label>
            <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="one_pager">One Pager</SelectItem>
                <SelectItem value="two_pager">Two Pager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date">Date Range</Label>
            <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateSort('created_at')}
            className="gap-2"
          >
            <ArrowUpDown className="w-4 h-4" />
            Sort by Date {sort.field === 'created_at' && (sort.direction === 'desc' ? '↓' : '↑')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateSort('layout_id')}
            className="gap-2"
          >
            <ArrowUpDown className="w-4 h-4" />
            Sort by ID {sort.field === 'layout_id' && (sort.direction === 'desc' ? '↓' : '↑')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
