import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { createSlug, formatCurrency, formatDate } from '@/lib/formatters';
import ImageGallery from '@/components/public/ImageGallery';
import { Loader2, ArrowLeft, MapPin, Banknote, Calendar, ExternalLink, Phone, MessageCircle, Send, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// Define interfaces directly
interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  location?: string;
  created_at: string;
  main_image_url?: string;
  additional_image_urls?: string[];
  whatsapp_link?: string;
  telegram_link?: string;
  user_id?: string;
}

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  career?: string;
  phone_number?: string;
  avatar_url?: string;
  slug?: string;
}

const ListingDetail = () => {
  const { agentSlug, listingId } = useParams<{ agentSlug: string; listingId: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const shareUrlRef = useRef<HTMLInputElement>(null);

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

  const handleCopyLink = () => {
    const url = window.location.href;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => {
          setCopied(true);
          toast.success('Link copied to clipboard!');
          
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          toast.error('Failed to copy link');
        });
    } else {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
        toast.success('Link copied to clipboard!');
        
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
        toast.error('Failed to copy link');
      }
      
      document.body.removeChild(textarea);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--portal-bg)] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-12 w-12 text-gold-500 mx-auto mb-4" />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[var(--portal-text-secondary)] text-lg"
          >
            Loading property details...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error || !listing || !agent) {
    return (
      <div className="min-h-screen bg-[var(--portal-bg)]">
        <div className="container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
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
          </motion.div>
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

  const shareUrl = window.location.href;

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
        {/* Decorative elements */}
        <div className="fixed top-0 left-0 w-96 h-96 bg-gold-500/5 rounded-full -ml-48 -mt-48 blur-3xl pointer-events-none"></div>
        <div className="fixed bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full -mr-48 -mb-48 blur-3xl pointer-events-none"></div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-[var(--portal-text-secondary)] hover:text-gold-500 mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Listings
          </button>

          {/* Title Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-0">{listing.title}</h1>
              
              <div className="flex items-center space-x-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    className="bg-[var(--portal-card-bg)] border-[var(--portal-border)] hover:bg-[var(--portal-bg-hover)] transition-all flex items-center justify-center gap-2"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="text-green-500"
                        >
                          <Check className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                        >
                          <Copy className="h-4 w-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: listing.title,
                          text: listing.description,
                          url: window.location.href,
                        }).catch(err => {
                          console.error('Error sharing:', err);
                          handleCopyLink();
                        });
                      } else {
                        handleCopyLink();
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-[var(--portal-card-bg)] border-[var(--portal-border)] hover:bg-[var(--portal-bg-hover)] transition-all"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </motion.div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base text-[var(--portal-text-secondary)]">
              <div className="flex items-center bg-[var(--portal-card-bg)] p-2 rounded-lg">
                <MapPin className="h-4 w-4 mr-1 text-gold-500" />
                <span>{listing.location || 'Location not specified'}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center bg-[var(--portal-card-bg)] p-2 rounded-lg">
                <Banknote className="h-4 w-4 mr-1 text-gold-500" />
                <span>{formatCurrency(listing.price)}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center bg-[var(--portal-card-bg)] p-2 rounded-lg">
                <Calendar className="h-4 w-4 mr-1 text-gold-500" />
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
                <h2 className="text-xl font-bold mb-4 text-gold-500 flex items-center">
                  <div className="w-1 h-5 bg-gold-500 rounded-full mr-2"></div>
                  Description
                </h2>
                <div className="prose prose-gold dark:prose-invert max-w-none">
                  {listing.description ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{listing.description}</p>
                  ) : (
                    <p className="text-[var(--portal-text-secondary)]">No description provided.</p>
                  )}
                </div>
              </div>
            
              {/* Property Details */}
              <div className="bg-[var(--portal-card-bg)] border border-[var(--portal-border)] rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-gold-500 flex items-center">
                  <div className="w-1 h-5 bg-gold-500 rounded-full mr-2"></div>
                  Property Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="font-semibold mb-2 text-gold-500">Location</div>
                  <p className="text-[var(--portal-text-secondary)] bg-[var(--portal-bg-hover)]/50 p-3 rounded-lg">
                    {listing.location || 'Location not specified'}
                  </p>
                  <div className="font-semibold mb-2 text-gold-500">Price</div>
                  <p className="text-[var(--portal-text-secondary)] bg-[var(--portal-bg-hover)]/50 p-3 rounded-lg">
                    {formatCurrency(listing.price || 0)}
                  </p>
                  <div className="font-semibold mb-2 text-gold-500">Listed</div>
                  <p className="text-[var(--portal-text-secondary)] bg-[var(--portal-bg-hover)]/50 p-3 rounded-lg">
                    {formatDate(listing.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="lg:col-span-1">
              <div className="bg-[var(--portal-card-bg)] border border-[var(--portal-border)] rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4 text-gold-500 flex items-center">
                  <div className="w-1 h-5 bg-gold-500 rounded-full mr-2"></div>
                  Contact Agent
                </h2>

                <div className="mb-4 flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--portal-bg-hover)] overflow-hidden border-2 border-gold-500/20">
                    {agent.avatar_url ? (
                      <img
                        src={agent.avatar_url}
                        alt={`${agent.first_name} ${agent.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gold-500/20 text-gold-500 font-bold text-xl">
                        {agent.first_name?.[0]}{agent.last_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{agent.first_name} {agent.last_name}</h3>
                    {agent.career && (
                      <p className="text-sm text-[var(--portal-text-secondary)]">{agent.career}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {contactOptions.map((option, index) => (
                    <a
                      key={option.type}
                      href={option.href}
                      target={option.type !== 'phone' ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center py-3 px-4 rounded-lg w-full font-medium transition-all ${
                        option.type === 'phone'
                          ? 'bg-gold-500 text-black hover:bg-gold-600'
                          : 'bg-[var(--portal-bg-hover)] text-[var(--portal-text)] hover:bg-[var(--portal-border)]'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </a>
                  ))}
                  
                  <Link to={`/${agent.slug}`}>
                    <div className="flex items-center justify-center py-3 px-4 rounded-lg w-full bg-[var(--portal-bg-hover)]/50 text-[var(--portal-text-secondary)] hover:bg-[var(--portal-bg-hover)] transition-all mt-4 text-sm">
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      View All Listings from this Agent
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="flex justify-between mb-12">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="border-[var(--portal-border)] hover:bg-[var(--portal-bg-hover)] transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </Button>
            
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="border-[var(--portal-border)] hover:bg-[var(--portal-bg-hover)] transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Listing
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ListingDetail;
