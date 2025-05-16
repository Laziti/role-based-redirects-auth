import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import AgentProfileHeader from '@/components/public/AgentProfileHeader';
import ListingCard from '@/components/public/ListingCard';
import { Loader2, Building, ChevronRight, Home, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { createSlug } from '@/lib/formatters';

interface AgentProfile {
  id: string;
  first_name: string;
  last_name: string;
  career?: string;
  phone_number?: string;
  avatar_url?: string;
  slug?: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  location?: string;
  main_image_url?: string;
  description?: string;
  created_at?: string;
}

const AgentPublicProfile = () => {
  const { agentSlug } = useParams<{ agentSlug: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentAndListings = async () => {
      setLoading(true);
      try {
        // Find the agent with the matching slug directly
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, career, phone_number, avatar_url, status, slug')
          .eq('status', 'approved')
          .eq('slug', agentSlug)
          .single();
          
        console.log('Fetched agent profile data:', profileData);
        console.log('Profile fetch error:', profileError);

        if (profileError) {
          // If no match by slug field, try the legacy method using name
          const { data: profiles, error: backupError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, career, phone_number, avatar_url, status')
            .eq('status', 'approved');
            
        console.log('Fetched profiles for backup search:', profiles);
        console.log('Backup profile fetch error:', backupError);

          if (backupError) throw backupError;
          
          if (!profiles || profiles.length === 0) {
            navigate('/not-found');
            return;
          }
          
          // Find the agent whose name matches the slug
          const matchedAgent = profiles.find(profile => {
            const fullName = `${profile.first_name} ${profile.last_name}`;
            return createSlug(fullName) === agentSlug;
          });
          
          if (!matchedAgent) {
            navigate('/not-found');
            return;
          }
          
          setAgent(matchedAgent);
          
          // Update the profile with the slug for future use
          await supabase
            .from('profiles')
            .update({ slug: agentSlug })
            .eq('id', matchedAgent.id);
        } else {
          setAgent(profileData);
        }
        
        // Fetch the agent's listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, price, location, main_image_url, description, created_at')
          .eq('user_id', agent ? agent.id : profileData.id)
          .neq('status', 'hidden')
          .order('created_at', { ascending: false });
          
        console.log('Fetched listings data:', listingsData);
        console.log('Listings fetch error:', listingsError);

        if (listingsError) throw listingsError;
        
        setListings(listingsData || []);
      } catch (error) {
        console.error('Error fetching agent profile:', error);
        toast.error('Error loading profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentAndListings();
  }, [agentSlug, navigate, agent?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--portal-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-gold-500" />
          <p className="text-[var(--portal-text-secondary)] animate-pulse">Loading agent profile...</p>
        </div>
      </div>
    );
  }

  if (!agent) return null;

  const pageTitle = `${agent.first_name} ${agent.last_name} - Real Estate Listings`;
  const pageDescription = `Browse property listings by ${agent.first_name} ${agent.last_name}${agent.career ? `, ${agent.career}` : ''}`;

  return (
    <div className="min-h-screen bg-[var(--portal-bg)] text-[var(--portal-text)]">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>
      
      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-gold-500/5 to-transparent pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-gold-500/10 to-transparent rounded-full blur-3xl -mb-48 -mr-48 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Button 
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gold-500 hover:text-gold-600 hover:bg-[var(--portal-card-bg)/50] group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
          </motion.div>
          
          {/* Breadcrumb */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center text-sm text-[var(--portal-text-secondary)] mb-6"
          >
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className="h-3.5 w-3.5 mx-2" />
            <span>Agents</span>
            <ChevronRight className="h-3.5 w-3.5 mx-2" />
            <span className="text-[var(--portal-text)] font-medium">{agent.first_name} {agent.last_name}</span>
          </motion.div>
          
          {/* Agent Profile Header */}
          <div className="mb-12">
            <AgentProfileHeader 
              firstName={agent.first_name}
              lastName={agent.last_name}
              career={agent.career}
              phoneNumber={agent.phone_number}
              avatarUrl={agent.avatar_url}
            />
          </div>
          
          {/* Listings Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center mb-8">
              <div className="h-10 w-1 bg-gold-500 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold text-gold-500">
                {listings.length > 0 
                  ? `Properties Listed by ${agent.first_name}`
                  : 'No Properties Listed'}
              </h2>
            </div>
            
            <AnimatePresence>
              {listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {listings.map((listing, index) => (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (index % 3), duration: 0.4 }}
                    >
                      <ListingCard 
                        id={listing.id}
                        title={listing.title}
                        price={listing.price}
                        location={listing.location}
                        mainImageUrl={listing.main_image_url}
                        agentSlug={agentSlug}
                        description={listing.description}
                        createdAt={listing.created_at}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-12 bg-[var(--portal-card-bg)] rounded-xl border border-[var(--portal-border)] text-center"
                >
                  <Building className="h-16 w-16 text-[var(--portal-text-secondary)]/20 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gold-500">No Active Listings</h3>
                  <p className="text-[var(--portal-text-secondary)] max-w-md mx-auto">
                    This agent has no active listings at the moment. Please check back later or contact them directly for more information.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Contact Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-gradient-to-br from-[var(--portal-card-bg)] to-[var(--portal-card-bg)]/80 border border-[var(--portal-border)] rounded-xl p-8 text-center shadow-lg mb-12"
          >
            <div className="max-w-2xl mx-auto">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Phone className="h-8 w-8 text-gold-500" />
              </motion.div>
              
              <h3 className="text-2xl font-bold mb-3 text-gold-500">Interested in these properties?</h3>
              <p className="mb-6 text-[var(--portal-text-secondary)]">
                Contact {agent.first_name} directly for more information about any of the properties or to schedule a viewing.
              </p>
              
              {agent.phone_number && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-gold-500 hover:bg-gold-600 text-black py-6 px-8 rounded-xl font-semibold text-lg shadow-lg">
                    <Phone className="h-5 w-5 mr-3" />
                    Call {agent.first_name} at {agent.phone_number}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AgentPublicProfile;
