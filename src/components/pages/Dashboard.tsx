
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, TrendingUp, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";

export function Dashboard() {
  const stats = [
    { title: "Total Layouts", value: "1,247", icon: FileText, trend: "+12%" },
    { title: "Last 24h Runs", value: "23", icon: Clock, trend: "+5%" },
    { title: "Active Creators", value: "8", icon: Users, trend: "+2" },
    { title: "Success Rate", value: "96.3%", icon: TrendingUp, trend: "+1.2%" },
  ];

  const recentActivity = [
    { id: "layout-001", name: "Magazine Cover - June", creator: "Sarah Johnson", time: "2 hours ago", status: "completed" },
    { id: "layout-002", name: "Product Catalog Page", creator: "Mike Chen", time: "4 hours ago", status: "completed" },
    { id: "layout-003", name: "Newsletter Template", creator: "Emma Davis", time: "6 hours ago", status: "processing" },
    { id: "layout-004", name: "Event Flyer Layout", creator: "Tom Wilson", time: "1 day ago", status: "completed" },
    { id: "layout-005", name: "Book Chapter Design", creator: "Lisa Park", time: "1 day ago", status: "failed" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your layout overview.</p>
        </div>
        <Link to="/generate">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Generate Layout
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {stat.trend}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <Link to={`/layouts/${activity.id}`} className="font-medium hover:text-primary transition-colors">
                    {activity.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">by {activity.creator} • {activity.time}</p>
                </div>
                <Badge variant={
                  activity.status === 'completed' ? 'default' :
                  activity.status === 'processing' ? 'secondary' : 'destructive'
                }>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/generate" className="block">
              <div className="p-4 rounded-lg border border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Generate New Layout</h3>
                    <p className="text-sm text-muted-foreground">Upload PDF and extract layout</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/layouts" className="block">
              <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/30 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">Browse All Layouts</h3>
                    <p className="text-sm text-muted-foreground">View and manage existing layouts</p>
                  </div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
