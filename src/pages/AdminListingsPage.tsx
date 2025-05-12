
import React, { useEffect, useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/AdminSidebar';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Search } from 'lucide-react';

type UserListing = {
  user_id: string;
  user_name: string;
  user_email: string;
  total_listings: number;
  pending_listings: number;
  active_listings: number;
  latest_listing_date: string | null;
};

const AdminListingsPage = () => {
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchListingStats = async () => {
    setLoading(true);
    try {
      // Get all listings grouped by user_id
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('user_id, title, status, created_at');
      
      if (listingsError) throw listingsError;
      
      if (!listings || listings.length === 0) {
        setUserListings([]);
        setFilteredListings([]);
        setLoading(false);
        return;
      }
      
      // Get unique user IDs from listings
      const userIds = [...new Set(listings.map(l => l.user_id))];
      
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone_number')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Create a map of user data
      let userMap: Record<string, { name: string; email: string; phone: string }> = {};
      
      // Add profile data to user map
      if (profiles) {
        profiles.forEach(profile => {
          userMap[profile.id] = {
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User',
            email: 'Email not available', // We'll set default email
            phone: profile.phone_number || 'N/A'
          };
        });
      }
      
      // Group listings by user and calculate stats
      const listingsByUser = userIds.map(userId => {
        const userListings = listings.filter(l => l.user_id === userId);
        const pendingListings = userListings.filter(l => l.status === 'pending');
        const activeListings = userListings.filter(l => l.status === 'active');
        
        // Find the latest listing date
        const listingDates = userListings
          .map(l => l.created_at ? new Date(l.created_at) : null)
          .filter(Boolean);
        
        const latestDate = listingDates.length > 0 
          ? format(new Date(Math.max(...listingDates.map(d => d ? d.getTime() : 0))), 'MMM d, yyyy')
          : null;
        
        return {
          user_id: userId,
          user_name: userMap[userId]?.name || 'Unknown User',
          user_email: userMap[userId]?.email || 'Email not available',
          total_listings: userListings.length,
          pending_listings: pendingListings.length,
          active_listings: activeListings.length,
          latest_listing_date: latestDate
        };
      });
      
      setUserListings(listingsByUser);
      setFilteredListings(listingsByUser);
    } catch (error: any) {
      toast.error(`Error loading listing stats: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListingStats();
  }, []);

  useEffect(() => {
    // Filter listings based on search term
    if (searchTerm.trim() === '') {
      setFilteredListings(userListings);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = userListings.filter(
        user => user.user_name.toLowerCase().includes(term) || 
                user.user_email.toLowerCase().includes(term)
      );
      setFilteredListings(filtered);
    }
  }, [searchTerm, userListings]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <SidebarInset>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="ml-4 text-xl font-semibold">Listings Overview</h1>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by user name or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Total Listings</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead>Latest Listing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : filteredListings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No listings found</TableCell>
                    </TableRow>
                  ) : (
                    filteredListings.map(user => (
                      <TableRow key={user.user_id}>
                        <TableCell>{user.user_name}</TableCell>
                        <TableCell>{user.user_email}</TableCell>
                        <TableCell className="text-center">{user.total_listings}</TableCell>
                        <TableCell className="text-center">{user.pending_listings}</TableCell>
                        <TableCell className="text-center">{user.active_listings}</TableCell>
                        <TableCell>{user.latest_listing_date || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={fetchListingStats}
                disabled={loading}
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminListingsPage;
