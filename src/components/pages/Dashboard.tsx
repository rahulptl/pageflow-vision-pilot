
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, FileText, Clock, TrendingUp, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { formatShortDate, formatUser } from "@/utils/formatters";

export function Dashboard() {
  const { data: layouts = [], isLoading: layoutsLoading } = useQuery({
    queryKey: ['layouts'],
    queryFn: apiService.getLayouts,
  });

  const { data: runs = [], isLoading: runsLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: apiService.getRuns,
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

  if (layoutsLoading || runsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Intelligent Layout Designer</p>
        </div>
        <Link to="/generate">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Generate Layout
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Layouts</CardTitle>
            <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLayouts}</div>
            <p className="text-xs text-muted-foreground">Extracted layouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Runs</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentRuns.length}</div>
            <p className="text-xs text-muted-foreground">Pipeline executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">Pipeline success</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Merge Level</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMergeLevel}</div>
            <p className="text-xs text-muted-foreground">Configuration setting</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Layouts</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLayouts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No layouts yet</p>
                <Link to="/generate">
                  <Button className="mt-4">Generate Your First Layout</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLayouts.map((layout) => (
                  <Link
                    key={layout.layout_id}
                    to={`/layouts/${layout.layout_id}`}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        Layout #{layout.layout_id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        by {formatUser(layout.created_by)} • {formatShortDate(layout.created_at)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      Level {layout.layout_json?.merge_level || 2}
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
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/generate" className="block">
              <Button className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Generate Layout
              </Button>
            </Link>
            <Link to="/layouts" className="block">
              <Button variant="outline" className="w-full gap-2">
                <FileText className="w-4 h-4" />
                View All Layouts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
