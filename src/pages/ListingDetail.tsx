
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet';
import ImageGallery from '@/components/public/ImageGallery';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ChevronLeft, MapPin, Phone, Home, Building2, Check, Clock, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface ListingDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  city?: string;
  main_image_url?: string;
  additional_image_urls?: string[];
  whatsapp_link?: string;
  telegram_link?: string;
  phone_number?: string;
  progress_status?: 'excavation' | 'on_progress' | 'semi_finished' | 'fully_finished';
  bank_option?: boolean;
  down_payment_percent?: number;
  created_at: string;
  user_id: string;
}

interface AgentProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  career?: string;
  phone_number?: string;
  avatar_url?: string;
  slug?: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US').format(price);
};

const ListingDetail = () => {
  const { agentSlug, listingSlug } = useParams<{ agentSlug: string; listingSlug: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // First, fetch the agent profile using the slug
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name, career, phone_number, avatar_url, slug')
          .eq('slug', agentSlug)
          .eq('status', 'approved')
          .single();

        if (profileError) {
          console.error('Error fetching agent:', profileError);
          setError('Agent not found');
          setLoading(false);
          return;
        }

        setAgent(profileData);

        // Now fetch the listing by ID
        const [listingId] = listingSlug?.split('-').slice(-1) || [''];
        
        if (!listingId) {
          setError('Invalid listing ID');
          setLoading(false);
          return;
        }

        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .eq('user_id', profileData.user_id)
          .single();

        if (listingError) {
          console.error('Error fetching listing:', listingError);
          setError('Listing not found');
          setLoading(false);
          return;
        }

        setListing(listingData as ListingDetails);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError('An error occurred while loading the listing');
        setLoading(false);
      }
    };

    fetchData();
  }, [agentSlug, listingSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--portal-bg)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-[var(--portal-text-secondary)]">Loading listing details...</p>
        </div>
      </div>
    );
  }

  if (error || !listing || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--portal-bg)]">
        <div className="text-center max-w-md mx-auto p-6">
          <Building2 className="h-16 w-16 text-[var(--portal-text-secondary)]/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gold-500 mb-4">Listing Not Found</h1>
          <p className="text-[var(--portal-text-secondary)] mb-6">
            {error || "We couldn't find the listing you're looking for. It may have been removed or is no longer available."}
          </p>
          <Button 
            onClick={() => navigate(`/${agentSlug}`)}
            className="bg-gold-500 hover:bg-gold-600 text-black"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Agent Profile
          </Button>
        </div>
      </div>
    );
  }

  const images = [
    ...(listing.main_image_url ? [listing.main_image_url] : []),
    ...(listing.additional_image_urls || [])
  ];

  const formattedDate = new Date(listing.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getProgressStatusLabel = () => {
    switch (listing.progress_status) {
      case 'excavation': return 'Excavation (ቁፋሮ)';
      case 'on_progress': return 'On Progress';
      case 'semi_finished': return 'Semi-Finished';
      case 'fully_finished': return 'Fully Finished';
      default: return 'Not Specified';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--portal-bg)] text-[var(--portal-text)]">
      <Helmet>
        <title>{listing.title} | Real Estate Listing</title>
        <meta name="description" content={listing.description.substring(0, 160)} />
      </Helmet>
      
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-gold-500/5 to-transparent pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-gold-500/10 to-transparent rounded-full blur-3xl -mb-48 -mr-48 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Button 
              variant="ghost"
              onClick={() => navigate(`/${agentSlug}`)}
              className="text-gold-500 hover:text-gold-600 hover:bg-[var(--portal-card-bg)]/50 group mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to {agent.first_name}'s Listings
            </Button>
            
            <h1 className="text-3xl lg:text-4xl font-bold text-gold-500 mb-2">{listing.title}</h1>
            
            <div className="flex flex-wrap items-center gap-2 text-[var(--portal-text-secondary)] mb-4">
              {listing.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{listing.location}</span>
                </div>
              )}
              {listing.city && (
                <Badge variant="outline" className="ml-2">
                  {listing.city}
                </Badge>
              )}
              {listing.progress_status && (
                <Badge variant="outline" className="ml-2 bg-gold-500/10 text-gold-500 border-gold-500/20">
                  {getProgressStatusLabel()}
                </Badge>
              )}
            </div>
          </motion.div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-[var(--portal-card-bg)] rounded-xl overflow-hidden border border-[var(--portal-border)] mb-8">
                  <ImageGallery images={images} />
                </div>
                
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Home className="h-5 w-5 mr-2 text-gold-500" />
                    Property Details
                  </h2>
                  <div className="bg-[var(--portal-card-bg)] rounded-xl p-6 border border-[var(--portal-border)]">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      <p>{listing.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 mr-2 text-gold-500" />
                        <h3 className="font-semibold">Progress Status</h3>
                      </div>
                      <p className="text-[var(--portal-text-secondary)]">{getProgressStatusLabel()}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-5 w-5 mr-2 text-gold-500" />
                        <h3 className="font-semibold">Listed On</h3>
                      </div>
                      <p className="text-[var(--portal-text-secondary)]">{formattedDate}</p>
                    </CardContent>
                  </Card>
                  
                  {listing.bank_option && (
                    <Card className={listing.bank_option ? "bg-green-500/5 border-green-500/20" : ""}>
                      <CardContent className="pt-6">
                        <div className="flex items-center mb-2">
                          <Check className="h-5 w-5 mr-2 text-green-500" />
                          <h3 className="font-semibold">Bank Financing</h3>
                        </div>
                        <p className="text-[var(--portal-text-secondary)]">
                          Bank financing options available.
                          {listing.down_payment_percent && (
                            <> Down payment: {listing.down_payment_percent}%</>
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1 space-y-6"
            >
              <div className="bg-[var(--portal-card-bg)] rounded-xl p-6 border border-[var(--portal-border)] sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">
                    <DollarSign className="inline h-6 w-6 text-gold-500" />
                    {formatPrice(listing.price)} ETB
                  </h2>
                </div>
                
                <div className="border-t border-b border-[var(--portal-border)] py-4 my-4">
                  <div className="flex items-center mb-2">
                    <Building2 className="h-5 w-5 mr-2 text-gold-500" />
                    <p className="font-semibold">Listed by {agent.first_name} {agent.last_name}</p>
                  </div>
                  {agent.career && <p className="text-sm text-[var(--portal-text-secondary)] ml-7">{agent.career}</p>}
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold mb-2">Contact Agent</h3>
                  
                  {agent.phone_number && (
                    <a href={`tel:${agent.phone_number}`} className="w-full">
                      <Button className="w-full bg-gold-500 hover:bg-gold-600 text-black">
                        <Phone className="h-4 w-4 mr-2" />
                        Call {agent.phone_number}
                      </Button>
                    </a>
                  )}
                  
                  {listing.phone_number && listing.phone_number !== agent.phone_number && (
                    <a href={`tel:${listing.phone_number}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Listing: {listing.phone_number}
                      </Button>
                    </a>
                  )}
                  
                  {listing.whatsapp_link && (
                    <a href={listing.whatsapp_link} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className="w-full bg-green-600 hover:bg-green-700 text-white border-none">
                        WhatsApp
                      </Button>
                    </a>
                  )}
                  
                  {listing.telegram_link && (
                    <a href={listing.telegram_link} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className="w-full bg-blue-500 hover:bg-blue-600 text-white border-none">
                        Telegram
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
