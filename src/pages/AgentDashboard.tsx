
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

  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      }
    }
  };

  const itemAnimation = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AgentSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 overflow-y-auto">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerAnimation}
          className="max-w-6xl mx-auto"
        >
          <motion.div 
            variants={itemAnimation}
            className="mb-8 flex justify-between items-center"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                {activeTab === 'listings' ? 'My Listings' : 
                 activeTab === 'create' ? 'Create New Listing' : 'Account Information'}
              </span>
            </h1>
            <Button variant="outline" onClick={signOut} className="hidden md:flex">Sign Out</Button>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full hidden">
            <TabsList className="hidden md:grid mb-6">
              <TabsTrigger value="listings">My Listings</TabsTrigger>
              <TabsTrigger value="create">Create New Listing</TabsTrigger>
              <TabsTrigger value="account">Account Info</TabsTrigger>
            </TabsList>

            {activeTab === "listings" && (
              <motion.div 
                key="listings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AccountInfo listings={listings} />
              </motion.div>
            )}
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AgentDashboard;
