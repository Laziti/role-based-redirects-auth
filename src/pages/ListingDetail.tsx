import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { createSlug, formatCurrency, formatDate } from '@/lib/formatters';
import ImageGallery from '@/components/public/ImageGallery';
import { Loader2, ArrowLeft, MapPin, Banknote, Calendar, ExternalLink, Phone, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Listing, Agent } from '@/types';

const ListingDetail = () => {
  const { agentSlug, listingId } = useParams<{ agentSlug: string; listingId: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // Fetch the agent - first try by slug
        const { data: agentData, error: agentError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, career, phone_number, avatar_url, slug')
          .eq('id', listingData.user_id)
          .eq('status', 'approved')
          .single();
          
        if (agentError) throw agentError;
        
        if (!agentData) {
          navigate('/not-found');
          return;
        }
        
        // Check if the agent has a slug and if it matches the URL
        // If not, verify using the generated slug from name
        let verifiedSlug = agentSlug;
        
        if (agentData.slug && agentData.slug !== agentSlug) {
          navigate(`/${agentData.slug}/listing/${listingId}`, { replace: true });
          return;
        } else if (!agentData.slug) {
          // Generate slug from name
          const expectedSlug = createSlug(`${agentData.first_name} ${agentData.last_name}`);
          
          // Update agent profile with the slug
          if (expectedSlug === agentSlug) {
            await supabase
              .from('profiles')
              .update({ slug: expectedSlug })
              .eq('id', agentData.id);
            
            verifiedSlug = expectedSlug;
          } else if (expectedSlug !== agentSlug) {
            navigate(`/${expectedSlug}/listing/${listingId}`, { replace: true });
            return;
          }
        }
        
        setAgent({...agentData, slug: verifiedSlug});
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
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gold-500" />
          <p className="text-[var(--portal-text-secondary)]">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !listing || !agent) {
    return (
      <div className="min-h-screen bg-[var(--portal-bg)]">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Oops!</h2>
            <p className="text-[var(--portal-text-secondary)] mb-6">
              {error || 'This property listing could not be found.'}
            </p>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pageTitle = `${listing.title} - Property Listing`;
  const pageDescription = listing.description 
    ? listing.description.substring(0, 160) 
    : `View details for this property listed by ${agent.first_name} ${agent.last_name}`;

  const contactOptions = [
    { 
      type: 'phone',
      label: 'Call Agent',
      icon: <Phone className="h-4 w-4 mr-2" />,
      href: `tel:${agent.phone_number}`,
      link: agent.phone_number,
    },
    { 
      type: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle className="h-4 w-4 mr-2" />,
      href: listing.whatsapp_link,
      link: listing.whatsapp_link,
    },
    { 
      type: 'telegram',
      label: 'Telegram',
      icon: <Send className="h-4 w-4 mr-2" />,
      href: listing.telegram_link,
      link: listing.telegram_link,
    },
  ].filter(option => option.link);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={listing.description?.slice(0, 155) || `View details for ${listing.title}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={listing.description?.slice(0, 155) || `View details for ${listing.title}`} />
        {listing.main_image_url && (
          <meta property="og:image" content={listing.main_image_url} />
        )}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      
      <div className="min-h-screen bg-[var(--portal-bg)]">
      <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-[var(--portal-text-secondary)] hover:text-gold-500 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </button>

          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base text-[var(--portal-text-secondary)]">
                <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{listing.location || 'Location not specified'}</span>
                </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center">
                <Banknote className="h-4 w-4 mr-1" />
                <span>{formatCurrency(listing.price)}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Listed {formatDate(listing.created_at)}</span>
              </div>
            </div>
          </div>
          
          {/* Image Gallery */}
          <div className="mb-8">
          <ImageGallery 
            mainImage={listing.main_image_url || ''} 
              additionalImages={listing.additional_image_urls || []}
          />
          </div>
          
          {/* Listing Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              {/* Description */}
              <div className="bg-[var(--portal-card-bg)] border border-[var(--portal-border)] rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 text-gold-500">Description</h2>
                <div className="prose prose-gold dark:prose-invert max-w-none">
                {listing.description ? (
                    <p className="whitespace-pre-wrap">{listing.description}</p>
                ) : (
                  <p className="text-[var(--portal-text-secondary)]">No description provided.</p>
                )}
              </div>
            </div>
            
              {/* Property Details */}
              <div className="bg-[var(--portal-card-bg)] border border-[var(--portal-border)] rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-gold-500">Property Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Location</h3>
                    <p className="text-[var(--portal-text-secondary)]">
                      {listing.location || 'Location not specified'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Price</h3>
                    <p className="text-[var(--portal-text-secondary)]">
                      {formatCurrency(listing.price || 0)}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Listed</h3>
                    <p className="text-[var(--portal-text-secondary)]">
                      {formatDate(listing.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <div className="bg-[var(--portal-card-bg)] border border-[var(--portal-border)] rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4 text-gold-500">Contact Agent</h2>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 text-xl font-bold">
                    {agent.first_name?.charAt(0) || ''}{agent.last_name?.charAt(0) || ''}
                  </div>
                  <div>
                      <h3 className="font-semibold">{agent.first_name} {agent.last_name}</h3>
                    {agent.career && <p className="text-sm text-[var(--portal-text-secondary)]">{agent.career}</p>}
                  </div>
                </div>

                  <div className="space-y-3">
                    {contactOptions.map((option, index) => (
                      option.link && (
                        <a
                          key={option.type}
                          href={option.href}
                          target={option.type !== 'phone' ? '_blank' : undefined}
                          rel={option.type !== 'phone' ? 'noopener noreferrer' : undefined}
                          className="flex items-center justify-center w-full px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black rounded-lg transition-colors"
                        >
                          {option.icon}
                          {option.label}
                        </a>
                      )
                    ))}
                </div>
                
                <Link 
                  to={`/${agent.slug || agentSlug}`}
                    className="flex items-center justify-center w-full mt-4 text-gold-500 hover:text-gold-600"
                >
                  <span>View all listings</span>
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
                {/* Share Section */}
                <div className="bg-[var(--portal-card-bg)] border border-[var(--portal-border)] rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4 text-gold-500">Share Listing</h2>
                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Link copied to clipboard');
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ListingDetail;
