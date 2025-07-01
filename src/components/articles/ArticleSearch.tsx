
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { ArticleSearchParams } from "@/services/api";

interface ArticleSearchProps {
  onSearch: (params: ArticleSearchParams) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function ArticleSearch({ onSearch, onClear, isLoading }: ArticleSearchProps) {
  const [searchParams, setSearchParams] = useState<ArticleSearchParams>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    onSearch(searchParams);
  };

  const handleClear = () => {
    setSearchParams({});
    onClear();
  };

  const updateParam = (key: keyof ArticleSearchParams, value: string | number | undefined) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const hasActiveFilters = Object.values(searchParams).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Articles
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {showAdvanced ? 'Simple' : 'Advanced'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Article Title</Label>
            <Input
              id="title"
              placeholder="Search by title..."
              value={searchParams.article_title || ''}
              onChange={(e) => updateParam('article_title', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="magazine">Magazine Name</Label>
            <Input
              id="magazine"
              placeholder="Search by magazine..."
              value={searchParams.magazine_name || ''}
              onChange={(e) => updateParam('magazine_name', e.target.value)}
            />
          </div>
        </div>

        {/* Advanced Search */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="words">Approximate Words</Label>
                <Input
                  id="words"
                  type="number"
                  placeholder="Number of words..."
                  value={searchParams.approximate_number_of_words || ''}
                  onChange={(e) => updateParam('approximate_number_of_words', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label htmlFor="images">Number of Images</Label>
                <Input
                  id="images"
                  type="number"
                  placeholder="Number of images..."
                  value={searchParams.number_of_images || ''}
                  onChange={(e) => updateParam('number_of_images', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={searchParams.article_category || ''}
                  onValueChange={(value) => updateParam('article_category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="author">Created By</Label>
              <Input
                id="author"
                placeholder="Search by author..."
                value={searchParams.created_by || ''}
                onChange={(e) => updateParam('created_by', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSearch} disabled={isLoading} className="gap-2">
            <Search className="w-4 h-4" />
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClear} className="gap-2">
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
