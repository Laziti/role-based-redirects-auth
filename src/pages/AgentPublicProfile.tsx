
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet';
import AgentProfileHeader from '@/components/public/AgentProfileHeader';
import ListingCard from '@/components/public/ListingCard';
import { Loader2, Building, ChevronRight, Home, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  career?: string;
  phone_number?: string;
  avatar_url?: string;
  slug?: string;
  status?: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  location?: string;
  city?: string;
  main_image_url?: string;
  description?: string;
  created_at?: string;
  progress_status?: 'excavation' | 'on_progress' | 'semi_finished' | 'fully_finished';
  bank_option?: boolean;
}

const AgentPublicProfile = () => {
  const { agentSlug } = useParams<{ agentSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(searchParams.get('city'));
  const [selectedProgress, setSelectedProgress] = useState<string | null>(searchParams.get('progress'));
  const [selectedBankOption, setSelectedBankOption] = useState<boolean | null>(
    searchParams.get('bank') ? searchParams.get('bank') === 'true' : null
  );
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    const fetchAgentAndListings = async () => {
      setLoading(true);
      try {
        // Find the agent with the matching slug
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name, career, phone_number, avatar_url, status, slug')
          .eq('status', 'approved')
          .eq('slug', agentSlug!)
          .single();
          
        if (profileError) {
          console.error('Error fetching agent profile:', profileError);
          setError('Agent not found');
          setLoading(false);
          navigate('/not-found');
          return;
        }

        setAgent(profileData);
        
        // Fetch the agent's listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, price, location, city, main_image_url, description, created_at, progress_status, bank_option')
          .eq('user_id', profileData.user_id)
          .order('created_at', { ascending: false });
          
        if (listingsError) {
          console.error('Error fetching listings:', listingsError);
          setListings([]);
        } else {
          setListings(listingsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (agentSlug) {
      fetchAgentAndListings();
    }
  }, [agentSlug, navigate]);

  useEffect(() => {
    if (listings.length > 0) {
      const cities = Array.from(new Set(listings.map(listing => listing.city).filter(Boolean)));
      setAvailableCities(cities as string[]);
    }
  }, [listings]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedCity) params.city = selectedCity;
    if (selectedProgress) params.progress = selectedProgress;
    if (selectedBankOption !== null) params.bank = selectedBankOption.toString();
    setSearchParams(params);
  }, [selectedCity, selectedProgress, selectedBankOption, setSearchParams]);

  const filteredListings = listings.filter(listing => {
    if (selectedCity && listing.city !== selectedCity) return false;
    if (selectedProgress && listing.progress_status !== selectedProgress) return false;
    if (selectedBankOption !== null && listing.bank_option !== selectedBankOption) return false;
    return true;
  });

  const resetFilters = () => {
    setSelectedCity(null);
    setSelectedProgress(null);
    setSelectedBankOption(null);
  };

  const handleCityFilter = (city: string) => {
    setSelectedCity(selectedCity === city ? null : city);
  };

  const handleProgressFilter = (progress: string) => {
    setSelectedProgress(selectedProgress === progress ? null : progress);
  };

  const handleBankOptionFilter = (hasBank: boolean) => {
    setSelectedBankOption(selectedBankOption === hasBank ? null : hasBank);
  };

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

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-[var(--portal-bg)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-[var(--portal-text-secondary)]">{error || "Agent not found"}</p>
          <Button 
            variant="default"
            onClick={() => navigate('/')}
            className="mt-4"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
  
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
          
          {/* Categories Section */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-[var(--portal-text)]">Categories</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-sm"
              >
                Reset Filters
              </Button>
            </div>

            {/* City Categories */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-[var(--portal-text)]">Cities</h3>
              <div className="flex flex-wrap gap-2">
                {availableCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCityFilter(city)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCity === city
                        ? 'bg-gold-500 text-black'
                        : 'bg-[var(--portal-card-bg)] text-[var(--portal-text)] hover:bg-[var(--portal-bg-hover)]'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Status Categories */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-[var(--portal-text)]">Progress Status</h3>
              <div className="flex flex-wrap gap-2">
                {['excavation', 'on_progress', 'semi_finished', 'fully_finished'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleProgressFilter(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedProgress === status
                        ? 'bg-gold-500 text-black'
                        : 'bg-[var(--portal-card-bg)] text-[var(--portal-text)] hover:bg-[var(--portal-bg-hover)]'
                    }`}
                  >
                    {status === 'excavation' ? 'Excavation (ቁፋሮ)' :
                     status === 'on_progress' ? 'On Progress' :
                     status === 'semi_finished' ? 'Semi-finished' :
                     'Fully Finished'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Option Categories */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-[var(--portal-text)]">Bank Option</h3>
              <div className="flex flex-wrap gap-2">
                {[true, false].map((hasBank) => (
                  <button
                    key={String(hasBank)}
                    onClick={() => handleBankOptionFilter(hasBank)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedBankOption === hasBank
                        ? 'bg-gold-500 text-black'
                        : 'bg-[var(--portal-card-bg)] text-[var(--portal-text)] hover:bg-[var(--portal-bg-hover)]'
                    }`}
                  >
                    {hasBank ? 'Bank Option Available' : 'No Bank Option'}
                  </button>
                ))}
              </div>
            </div>
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
                  {filteredListings.map((listing, index) => (
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
                    agentSlug={agentSlug!}
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
