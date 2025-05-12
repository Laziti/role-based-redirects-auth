
import React, { useEffect, useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalListings: 0,
    pendingUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
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

        // Get count of listings
        const { count: listingsCount, error: listingsError } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true });
        
        if (listingsError) throw listingsError;

        setStats({
          totalAgents: agentsCount || 0,
          totalListings: listingsCount || 0,
          pendingUsers: pendingCount || 0
        });
      } catch (error: any) {
        toast.error(`Error loading dashboard stats: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
