import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, FileText, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { formatShortDate, formatUser } from "@/utils/formatters";

export function Dashboard() {
  const { data: layouts = [], isLoading: layoutsLoading } = useQuery({
    queryKey: ['layouts'],
    queryFn: () => apiService.getLayouts(),
  });

  const { data: runs = [], isLoading: runsLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => apiService.getRuns(),
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => apiService.getArticles(),
  });

  // Calculate stats
  const totalLayouts = layouts.length;
  const recentRuns = runs.filter(run => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(run.created_at) > twentyFourHoursAgo;
  });

  const successfulRuns = runs.filter(run => run.status === 'SUCCESS').length;
  const successRate = runs.length > 0 ? Math.round((successfulRuns / runs.length) * 100) : 0;

  const avgMergeLevel = layouts.length > 0 
    ? Math.round(layouts.reduce((acc, layout) => {
        const mergeLevel = layout.layout_json?.merge_level || 2;
        return acc + mergeLevel;
      }, 0) / layouts.length * 10) / 10
    : 2;

  const recentLayouts = layouts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentArticles = articles
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (layoutsLoading || runsLoading || articlesLoading) {
    return (
      <div className="content-container py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-muted rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-muted rounded-xl"></div>
            <div className="h-96 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container py-8 space-y-8">
      {/* Hero Section */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Monitor your layout extraction pipeline and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Layouts</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLayouts}</div>
            <p className="text-sm text-muted-foreground mt-1">Extracted layouts</p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">24h Runs</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recentRuns.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Pipeline executions</p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{successRate}%</div>
            <p className="text-sm text-muted-foreground mt-1">Pipeline success</p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Merge Level</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgMergeLevel}</div>
            <p className="text-sm text-muted-foreground mt-1">Configuration setting</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Layouts</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Latest extracted layouts</p>
            </div>
            <Link to="/admin/layouts">
              <Button variant="outline" size="sm" className="gap-2">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentLayouts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No layouts yet</h3>
                <p className="text-muted-foreground mb-6">Generate your first layout to get started</p>
                <Link to="/admin/generate">
                  <Button>Generate Your First Layout</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentLayouts.map((layout) => (
                  <Link
                    key={layout.layout_id}
                    to={`/admin/layouts/${layout.layout_id}`}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        Layout #{layout.layout_id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        by {formatUser(layout.created_by)} • {formatShortDate(layout.created_at)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Level {layout.layout_json?.merge_level || 2}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Articles */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Articles</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Latest magazine articles</p>
            </div>
            <Link to="/admin/articles">
              <Button variant="outline" size="sm" className="gap-2">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentArticles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No articles yet</h3>
                <p className="text-muted-foreground mb-6">Create your first article to get started</p>
                <Link to="/admin/articles">
                  <Button>Browse Articles</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentArticles.map((article) => (
                  <Link
                    key={article.article_id}
                    to={`/admin/articles/${article.article_id}`}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary/10 to-secondary/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {article.article_title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {article.magazine_title} • {formatShortDate(article.created_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-secondary/10 text-secondary">
                      {article.page_count} pages
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">Common workflow shortcuts</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/admin/generate" className="block">
              <Button className="w-full gap-2 h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                <FileText className="w-5 h-5" />
                Generate Layout
              </Button>
            </Link>
            <Link to="/admin/layouts" className="block">
              <Button variant="outline" className="w-full gap-2 h-12">
                <LayoutDashboard className="w-5 h-5" />
                Browse Layouts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
