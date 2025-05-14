
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import AgentSidebar from '@/components/agent/AgentSidebar';
import ListingTable from '@/components/agent/ListingTable';
import CreateListingForm from '@/components/agent/CreateListingForm';
import AccountInfo from '@/components/agent/AccountInfo';
import { Loader2 } from 'lucide-react';
import '@/styles/portal-theme.css';

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
    <div className="flex min-h-screen portal-layout">
      <AgentSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="mb-8 flex justify-between items-center">
            <div className="portal-breadcrumb">
              <span className="portal-breadcrumb-item">Home</span>
              <span className="portal-breadcrumb-separator">/</span>
              <span className="portal-breadcrumb-item active">
                {activeTab === 'listings' ? 'My Listings' : 
                 activeTab === 'create' ? 'Create New Listing' : 'Account Information'}
              </span>
            </div>
          </div>

          {activeTab === "listings" && (
            <motion.div 
              key="listings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="portal-animate-in"
            >
              <div className="portal-card mb-6">
                <h2 className="portal-title">My Properties</h2>
                <p className="portal-subtitle">Manage your property listings</p>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--portal-accent)]" />
                </div>
              ) : (
                <div className="portal-card">
                  <ListingTable 
                    listings={listings} 
                    onDelete={handleDeleteListing} 
                  />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "create" && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="portal-card portal-animate-in"
            >
              <CreateListingForm 
                onSuccess={() => {
                  setActiveTab('listings');
                  toast.success('Listing created successfully');
                }} 
              />
            </motion.div>
          )}

          {activeTab === "account" && (
            <motion.div 
              key="account"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="portal-animate-in"
            >
              <AccountInfo listings={listings} />
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default AgentDashboard;
