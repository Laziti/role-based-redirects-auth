
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import { createSlug, formatCurrency, formatDate } from '@/lib/formatters';
import ImageGallery from '@/components/public/ImageGallery';
import AgentProfileHeader from '@/components/public/AgentProfileHeader';
import { Loader2, ArrowLeft, MapPin, Banknote, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  career?: string;
  phone_number?: string;
  avatar_url?: string;
}

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  location?: string;
  main_image_url?: string;
  additional_image_urls?: string[];
  created_at: string;
  phone_number?: string;
  whatsapp_link?: string;
  telegram_link?: string;
  user_id: string;
}

const ListingDetail = () => {
  const { agentSlug, listingId } = useParams<{ agentSlug: string; listingId: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListingAndAgent = async () => {
      setLoading(true);
      try {
        // Fetch the listing
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single();
          
        if (listingError) throw listingError;
        
        if (!listingData) {
          navigate('/not-found');
          return;
        }
        
        setListing(listingData);
        
        // Fetch the agent
        const { data: agentData, error: agentError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, career, phone_number, avatar_url')
          .eq('id', listingData.user_id)
          .eq('status', 'approved')
          .single();
          
        if (agentError) throw agentError;
        
        if (!agentData) {
          navigate('/not-found');
          return;
        }
        
        // Verify the agent slug matches
        const expectedSlug = createSlug(`${agentData.first_name} ${agentData.last_name}`);
        if (expectedSlug !== agentSlug) {
          navigate('/not-found');
          return;
        }
        
        setAgent(agentData);
      } catch (error) {
        console.error('Error fetching listing details:', error);
        toast.error('Error loading listing data');
        navigate('/not-found');
      } finally {
        setLoading(false);
      }
    };

    if (listingId && agentSlug) {
      fetchListingAndAgent();
    }
  }, [listingId, agentSlug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--portal-bg)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!listing || !agent) return null;

  const pageTitle = `${listing.title} - Property Listing`;
  const pageDescription = listing.description 
    ? listing.description.substring(0, 160) 
    : `View details for this property listed by ${agent.first_name} ${agent.last_name}`;

  const contactOptions = [
    { 
      type: 'phone',
      label: 'Call',
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      ),
      link: listing.phone_number || agent.phone_number,
      href: `tel:${listing.phone_number || agent.phone_number}`,
    },
    { 
      type: 'whatsapp',
      label: 'WhatsApp',
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      ),
      link: listing.whatsapp_link,
      href: listing.whatsapp_link,
    },
    { 
      type: 'telegram',
      label: 'Telegram',
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-16.54 6.618a2.24 2.24 0 0 0-.24 3.986l4.155 1.781 1.522 4.564a2.241 2.241 0 0 0 1.581 1.533 2.24 2.24 0 0 0 2.401-.777l1.057-1.26 5.262 3.874a2.242 2.242 0 0 0 3.504-1.082l3.366-16.54a2.24 2.24 0 0 0-1.046-2.912z"></path>
          <line x1="8" y1="9" x2="13" y2="14"></line>
          <line x1="14" y1="13" x2="16" y2="11"></line>
        </svg>
      ),
      link: listing.telegram_link,
      href: listing.telegram_link,
    },
  ].filter(option => option.link);

  return (
    <div className="min-h-screen bg-[var(--portal-bg)] text-[var(--portal-text)]">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {listing.main_image_url && <meta property="og:image" content={listing.main_image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {listing.main_image_url && <meta name="twitter:image" content={listing.main_image_url} />}
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <Link 
              to={`/${agentSlug}`}
              className="inline-flex items-center text-gold-500 hover:text-gold-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to all listings
            </Link>
          </div>
          
          {/* Listing Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gold-500">{listing.title}</h1>
            
            <div className="flex flex-wrap gap-4 text-[var(--portal-text-secondary)]">
              {listing.location && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-1 text-gold-500" />
                  <span>{listing.location}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <Banknote className="h-5 w-5 mr-1 text-gold-500" />
                <span className="font-semibold">{formatCurrency(listing.price || 0)}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-1 text-gold-500" />
                <span>Listed on {formatDate(listing.created_at)}</span>
              </div>
            </div>
          </div>
          
          {/* Image Gallery */}
          <ImageGallery 
            mainImage={listing.main_image_url || ''} 
            additionalImages={listing.additional_image_urls} 
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Listing Description */}
            <div className="lg:col-span-2">
              <div className="bg-[var(--portal-card-bg)] border border-[var(--portal-border)] rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 text-gold-500">Description</h2>
                {listing.description ? (
                  <div className="whitespace-pre-wrap">
                    {listing.description}
                  </div>
                ) : (
                  <p className="text-[var(--portal-text-secondary)]">No description provided.</p>
                )}
              </div>
            </div>
            
            {/* Sidebar - Agent Info & Contact */}
            <div className="space-y-6">
              {/* Agent Card */}
              <div className="bg-[var(--portal-card-bg)] border border-[var(--portal-border)] rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4 text-gold-500">Listed by:</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 text-xl font-bold">
                    {agent.first_name?.charAt(0) || ''}{agent.last_name?.charAt(0) || ''}
                  </div>
                  <div>
                    <h4 className="font-semibold">{agent.first_name} {agent.last_name}</h4>
                    {agent.career && <p className="text-sm text-[var(--portal-text-secondary)]">{agent.career}</p>}
                  </div>
                </div>
                
                <Link 
                  to={`/${agentSlug}`}
                  className="flex items-center justify-center w-full text-gold-500 hover:text-gold-600"
                >
                  <span>View all listings</span>
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              {/* Contact Options */}
              {contactOptions.length > 0 && (
                <div className="bg-[var(--portal-card-bg)] border border-[var(--portal-border)] rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4 text-gold-500">Contact about this property</h3>
                  <div className="space-y-3">
                    {contactOptions.map((option, index) => (
                      <a
                        key={index}
                        href={option.href}
                        target={option.type !== 'phone' ? '_blank' : undefined}
                        rel={option.type !== 'phone' ? 'noopener noreferrer' : undefined}
                        className="flex items-center justify-center w-full p-2.5 bg-gold-500 hover:bg-gold-600 text-black rounded-md font-medium"
                      >
                        {option.icon}
                        {option.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
