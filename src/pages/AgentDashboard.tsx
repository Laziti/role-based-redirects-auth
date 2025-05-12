
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AgentSidebar from '@/components/agent/AgentSidebar';
import ListingTable from '@/components/agent/ListingTable';
import CreateListingForm from '@/components/agent/CreateListingForm';
import AccountInfo from '@/components/agent/AccountInfo';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const AgentDashboard = () => {
  const { user, userStatus, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('listings');
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure the user is approved
    if (userStatus && userStatus !== 'approved') {
      navigate('/pending');
      return;
    }

    // Fetch user's listings
    const fetchListings = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast.error('Failed to load your listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [user, userStatus, navigate]);

  const handleDeleteListing = async (listingId) => {
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      // Update listings state after successful deletion
      setListings(listings.filter(listing => listing.id !== listingId));
      toast.success('Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AgentSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-6">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Agent Dashboard</h1>
          <Button variant="outline" onClick={signOut}>Sign Out</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="create">Create New Listing</TabsTrigger>
            <TabsTrigger value="account">Account Info</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : (
              <ListingTable 
                listings={listings} 
                onDelete={handleDeleteListing} 
              />
            )}
          </TabsContent>

          <TabsContent value="create">
            <CreateListingForm 
              onSuccess={() => {
                setActiveTab('listings');
                toast.success('Listing created successfully');
              }} 
            />
          </TabsContent>

          <TabsContent value="account">
            <AccountInfo listings={listings} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AgentDashboard;
