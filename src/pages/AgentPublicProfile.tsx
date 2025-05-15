
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import AgentProfileHeader from '@/components/public/AgentProfileHeader';
import ListingCard from '@/components/public/ListingCard';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          
        if (profileError) {
          // If no match by slug field, try the legacy method using name
          const { data: profiles, error: backupError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, career, phone_number, avatar_url, status')
            .eq('status', 'approved');
            
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
          .select('id, title, price, location, main_image_url')
          .eq('user_id', agent ? agent.id : profileData.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });
          
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
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2">
            <Button 
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gold-500 hover:text-gold-600 hover:bg-[var(--portal-card-bg)/50]"
            >
              &larr; Back to Home
            </Button>
          </div>
          
          {/* Agent Profile Header */}
          <div className="mb-8">
            <AgentProfileHeader 
              firstName={agent.first_name}
              lastName={agent.last_name}
              career={agent.career}
              phoneNumber={agent.phone_number}
              avatarUrl={agent.avatar_url}
            />
          </div>
          
          {/* Listings Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-6 text-gold-500">
              {listings.length > 0 
                ? `Properties Listed by ${agent.first_name}`
                : 'No Properties Listed'}
            </h2>
            
            {listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(listing => (
                  <ListingCard 
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    price={listing.price}
                    location={listing.location}
                    mainImageUrl={listing.main_image_url}
                    agentSlug={agentSlug}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-[var(--portal-card-bg)] rounded-lg border border-[var(--portal-border)]">
                <p className="text-[var(--portal-text-secondary)]">This agent has no active listings at the moment.</p>
              </div>
            )}
          </div>
          
          {/* Contact Section */}
          <div className="bg-[var(--portal-card-bg)] border border-[var(--portal-border)] rounded-lg p-6 text-center">
            <h3 className="font-semibold text-lg mb-2 text-gold-500">Interested in these properties?</h3>
            <p className="mb-4 text-[var(--portal-text-secondary)]">Contact {agent.first_name} directly for more information.</p>
            {agent.phone_number && (
              <Button className="bg-gold-500 hover:bg-gold-600 text-black">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-2" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Call Agent
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPublicProfile;

import { createSlug } from '@/lib/formatters';
