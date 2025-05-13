
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
import { Search, Eye } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type UserListing = {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  total_listings: number;
  pending_listings: number;
  active_listings: number;
  latest_listing_date: string | null;
};

type DetailedListing = {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  description: string | null;
  main_image_url: string | null;
  additional_image_urls: string[] | null;
  phone_number: string | null;
  whatsapp_link: string | null;
  telegram_link: string | null;
  created_at: string;
  status: string | null;
  user: {
    name: string;
    email: string;
    phone: string;
  };
};

const AdminListingsPage = () => {
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userListingDetails, setUserListingDetails] = useState<DetailedListing[]>([]);
  const [showListingDetails, setShowListingDetails] = useState(false);
  const [selectedListing, setSelectedListing] = useState<DetailedListing | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
      const userIds = [...new Set(listings.map(l => l.user_id))].filter(Boolean) as string[];
      
      if (userIds.length === 0) {
        setUserListings([]);
        setFilteredListings([]);
        setLoading(false);
        return;
      }
      
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone_number')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Get emails from auth.users
      const { data: authUsersData, error: authUsersError } = await supabase
        .rpc('get_auth_users_data');
      
      if (authUsersError) throw authUsersError;
      
      // Create a map of user data
      let userMap: Record<string, { name: string; email: string; phone: string }> = {};
      
      // Add profile data to user map
      if (profiles) {
        profiles.forEach(profile => {
          const authUser = authUsersData.find((u: any) => u.id === profile.id);
          userMap[profile.id] = {
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User',
            email: authUser?.email || 'Email not available',
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
          .filter(Boolean) as Date[];
        
        const latestDate = listingDates.length > 0 
          ? format(new Date(Math.max(...listingDates.map(d => d.getTime()))), 'MMM d, yyyy')
          : null;
        
        return {
          user_id: userId,
          user_name: userMap[userId]?.name || 'Unknown User',
          user_email: userMap[userId]?.email || 'Email not available',
          user_phone: userMap[userId]?.phone || 'N/A',
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

  const fetchUserListingDetails = async (userId: string) => {
    setLoadingDetails(true);
    setSelectedUserId(userId);
    
    try {
      // Get all listings for the selected user
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (listingsError) throw listingsError;
      
      if (!listings || listings.length === 0) {
        setUserListingDetails([]);
        setLoadingDetails(false);
        return;
      }
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone_number')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      // Get email
      const { data: authUsersData, error: authUsersError } = await supabase
        .rpc('get_auth_users_data');
      
      if (authUsersError) throw authUsersError;
      
      const userEmail = authUsersData.find((u: any) => u.id === userId)?.email || 'Email not available';
      
      const userName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown User';
      
      // Map listings to include user details
      const detailedListings = listings.map(listing => ({
        ...listing,
        user: {
          name: userName,
          email: userEmail,
          phone: profile?.phone_number || 'N/A'
        }
      }));
      
      setUserListingDetails(detailedListings);
    } catch (error: any) {
      toast.error(`Error loading user listings: ${error.message}`);
    } finally {
      setLoadingDetails(false);
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
                user.user_email.toLowerCase().includes(term) ||
                user.user_phone.toLowerCase().includes(term)
      );
      setFilteredListings(filtered);
    }
  }, [searchTerm, userListings]);

  const handleViewListingDetails = (listing: DetailedListing) => {
    setSelectedListing(listing);
    setShowListingDetails(true);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      maximumFractionDigits: 0
    }).format(value);
  };

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
                  placeholder="Search by user name, email or phone..."
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
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead>Latest Listing</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : filteredListings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">No listings found</TableCell>
                    </TableRow>
                  ) : (
                    filteredListings.map(user => (
                      <TableRow key={user.user_id}>
                        <TableCell>{user.user_name}</TableCell>
                        <TableCell>{user.user_email}</TableCell>
                        <TableCell>{user.user_phone}</TableCell>
                        <TableCell className="text-center">{user.total_listings}</TableCell>
                        <TableCell className="text-center">{user.pending_listings}</TableCell>
                        <TableCell className="text-center">{user.active_listings}</TableCell>
                        <TableCell>{user.latest_listing_date || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => fetchUserListingDetails(user.user_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View Listings
                          </Button>
                        </TableCell>
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
          
          {selectedUserId && (
            <div className="px-6 pb-6">
              <h2 className="text-lg font-semibold mb-4">
                Listings for {filteredListings.find(u => u.user_id === selectedUserId)?.user_name}
              </h2>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDetails ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading listings...</TableCell>
                      </TableRow>
                    ) : userListingDetails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No listings found for this user</TableCell>
                      </TableRow>
                    ) : (
                      userListingDetails.map(listing => (
                        <TableRow key={listing.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {listing.main_image_url ? (
                                <img 
                                  src={listing.main_image_url} 
                                  alt={listing.title}
                                  className="w-10 h-10 object-cover rounded-md mr-3"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded-md mr-3 flex items-center justify-center text-gray-400 text-xs">
                                  No img
                                </div>
                              )}
                              <span className="truncate max-w-[200px]">{listing.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>{listing.price ? formatCurrency(listing.price) : 'N/A'}</TableCell>
                          <TableCell>{listing.location || 'N/A'}</TableCell>
                          <TableCell>{format(new Date(listing.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Badge className={listing.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}>
                              {listing.status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewListingDetails(listing)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </SidebarInset>
      </div>
      
      {/* Listing Details Dialog */}
      <Dialog open={showListingDetails} onOpenChange={setShowListingDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Listing Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected listing
            </DialogDescription>
          </DialogHeader>
          
          {selectedListing && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="contact">Contact Info</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Title</h3>
                    <p className="text-base">{selectedListing.title}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Price</h3>
                    <p className="text-base">
                      {selectedListing.price ? formatCurrency(selectedListing.price) : 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p className="text-base">{selectedListing.location || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="text-base">
                      <Badge className={selectedListing.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {selectedListing.status || 'Unknown'}
                      </Badge>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created Date</h3>
                    <p className="text-base">{format(new Date(selectedListing.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Listing ID</h3>
                    <p className="text-base text-xs">{selectedListing.id}</p>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="text-base whitespace-pre-wrap">
                    {selectedListing.description || 'No description provided'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Owner Information</h3>
                  <Card className="mt-2">
                    <CardContent className="pt-4 space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">Name:</span>
                        <p>{selectedListing.user.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Email:</span>
                        <p>{selectedListing.user.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Phone:</span>
                        <p>{selectedListing.user.phone}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="images" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Main Image</h3>
                  {selectedListing.main_image_url ? (
                    <div className="border rounded overflow-hidden">
                      <img 
                        src={selectedListing.main_image_url} 
                        alt={selectedListing.title} 
                        className="w-full h-auto max-h-[400px] object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-500">No main image available</p>
                  )}
                </div>
                
                {selectedListing.additional_image_urls && 
                 selectedListing.additional_image_urls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedListing.additional_image_urls.map((url, idx) => (
                        <div key={idx} className="border rounded overflow-hidden">
                          <img 
                            src={url} 
                            alt={`Additional image ${idx + 1}`}
                            className="w-full h-40 object-cover" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                    <p className="text-base">
                      {selectedListing.phone_number || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">WhatsApp</h3>
                    {selectedListing.whatsapp_link ? (
                      <a 
                        href={selectedListing.whatsapp_link} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Open WhatsApp Link
                      </a>
                    ) : (
                      <p className="text-base">Not provided</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Telegram</h3>
                    {selectedListing.telegram_link ? (
                      <a 
                        href={selectedListing.telegram_link} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Open Telegram Link
                      </a>
                    ) : (
                      <p className="text-base">Not provided</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Agent Information</h3>
                  <Card className="mt-2">
                    <CardContent className="pt-4 space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">Name:</span>
                        <p>{selectedListing.user.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Email:</span>
                        <p>{selectedListing.user.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Phone:</span>
                        <p>{selectedListing.user.phone}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AdminListingsPage;
