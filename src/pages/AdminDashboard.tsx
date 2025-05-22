import React, { useEffect, useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalAgents: number;
  totalListings: number;
  pendingUsers: number;
  activeListings: number;
  pendingListings: number;
}

interface RecentActivity {
  id: string;
  type: string; // 'user_registered' | 'listing_created'
  title: string;
  description: string;
  date: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    totalListings: 0,
    pendingUsers: 0,
    activeListings: 0,
    pendingListings: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get count of agents
        const { count: agentsCount, error: agentsError } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'agent');
        
        if (agentsError) throw agentsError;

        // Get count of pending users
        const { count: pendingCount, error: pendingError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending_approval');
        
        if (pendingError) throw pendingError;

        // Get count of all listings
        const { count: listingsCount, error: listingsError } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true });
        
        if (listingsError) throw listingsError;

        // Get count of active listings
        const { count: activeListingsCount, error: activeListingsError } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        
        if (activeListingsError) throw activeListingsError;

        // Get count of pending listings
        const { count: pendingListingsCount, error: pendingListingsError } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        if (pendingListingsError) throw pendingListingsError;

        setStats({
          totalAgents: agentsCount || 0,
          totalListings: listingsCount || 0,
          pendingUsers: pendingCount || 0,
          activeListings: activeListingsCount || 0,
          pendingListings: pendingListingsCount || 0
        });

        // Fetch recent activities (latest users and listings)
        await fetchRecentActivities();
      } catch (error: any) {
        console.error(`Error loading dashboard stats: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentActivities = async () => {
      try {
        // Get recent users
        const { data: recentUsers, error: usersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, status, updated_at')
          .order('updated_at', { ascending: false })
          .limit(3);
          
        if (usersError) throw usersError;

        // Get recent listings
        const { data: recentListings, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, status, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (listingsError) throw listingsError;
        
        // Get user ids from listings to fetch their names
        const userIds = recentListings.map(listing => listing.user_id);
        const { data: userProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);
          
        if (profilesError) throw profilesError;
        
        // Create a map of user ids to names
        const userMap = new Map();
        userProfiles?.forEach(profile => {
          userMap.set(profile.id, `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User');
        });

        // Format recent users
        const userActivities = recentUsers.map(user => ({
          id: `user-${user.id}`,
          type: 'user_registered',
          title: 'New User Registration',
          description: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'New user',
          date: user.updated_at
        }));

        // Format recent listings
        const listingActivities = recentListings.map(listing => ({
          id: `listing-${listing.id}`,
          type: 'listing_created',
          title: 'New Listing',
          description: `${listing.title} by ${userMap.get(listing.user_id) || 'Unknown User'}`,
          date: listing.created_at
        }));

        // Combine and sort by date
        const combinedActivities = [...userActivities, ...listingActivities]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        setRecentActivities(combinedActivities);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <SidebarInset>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="ml-4 text-xl font-semibold">Dashboard Overview</h1>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-5 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "Loading..." : stats.totalAgents}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "Loading..." : stats.totalListings}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "Loading..." : stats.pendingUsers}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "Loading..." : stats.activeListings}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "Loading..." : stats.pendingListings}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading recent activities...</div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No recent activities found</div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start">
                        <div className={`w-2 h-2 mt-2 rounded-full ${
                          activity.type === 'user_registered' 
                            ? 'bg-blue-500' 
                            : 'bg-green-500'
                        }`} />
                        <div className="ml-3">
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                          <p className="text-xs text-gray-400">{formatDate(activity.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
