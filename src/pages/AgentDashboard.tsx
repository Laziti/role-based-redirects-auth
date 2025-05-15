import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AgentSidebar from '@/components/agent/AgentSidebar';
import ListingTable from '@/components/agent/ListingTable';
import CreateListingForm from '@/components/agent/CreateListingForm';
import EditListingForm from '@/components/agent/EditListingForm';
import AccountInfo from '@/components/agent/AccountInfo';
import { Loader2, Plus, Briefcase, X, ArrowRight, Building, Home, DollarSign, Copy, CheckCircle, Link as LinkIcon, Share2, Check, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import '@/styles/portal-theme.css';
import { createSlug } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AgentDashboard = () => {
  const { user, userStatus, signOut, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState('listings');
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [currentListingId, setCurrentListingId] = useState(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showShareableLink, setShowShareableLink] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef(null);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const linkRef = useRef<HTMLInputElement>(null);

  // Function to create a shareable link
  const getShareableLink = () => {
    if (!profileData) return '';
    const baseUrl = window.location.origin;
    const slug = createSlug(`${profileData.first_name}-${profileData.last_name}`);
    return `${baseUrl}/${slug}`;
  };

  // Handle copy to clipboard
  const handleCopy = async (text) => {
    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          textArea.remove();
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
          textArea.remove();
          throw new Error('Copy failed');
        }
      }
      
      // Show success state
      setCopied(true);
      toast.success('Link copied to clipboard!');
      
      // Reset copied state after 2 seconds
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  useEffect(() => {
    // Ensure the user is approved
    if (userStatus && userStatus !== 'approved') {
      navigate('/pending');
      return;
    }

    // Fetch user profile and listings
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch user profile first
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfileData(profileData);

        // Fetch user's listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (listingsError) throw listingsError;
        setListings(listingsData || []);
        
        // Check if this is a first-time login after approval
        if (listingsData.length === 0) {
          // Check localStorage to see if welcome popup was shown before
          const welcomeShown = localStorage.getItem(`welcome_shown_${user.id}`);
          if (!welcomeShown) {
            setShowWelcomePopup(true);
            setShowShareableLink(true);
            // Mark as shown for this user
            localStorage.setItem(`welcome_shown_${user.id}`, 'true');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load your data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, userStatus, navigate]);

  // Detect first-time user
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome && user) {
      setShowWelcomePopup(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, [user]);

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove the deleted listing from state
      setListings(prevListings => prevListings.filter(listing => listing.id !== listingId));
      toast.success('Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };
  
  const handleEditListing = (listingId) => {
    setCurrentListingId(listingId);
    setActiveTab('edit');
  };
  
  const handleEditSuccess = () => {
    // Refresh listings
    setActiveTab('listings');
    // Refetch listings to get updated data
    const fetchListings = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Refresh auth session before fetching listings
        await refreshSession();
        
        console.log('[Dashboard] Starting listings refetch after edit');
        
        // Force fresh data with no caching
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .throwOnError();

        if (error) throw error;
        
        if (data) {
          // Log each listing's price
          console.log('[Dashboard] Fetched listings details:');
          data.forEach(listing => {
            console.log(`[Dashboard] Listing ${listing.id}:`, {
              price: listing.price,
              priceType: typeof listing.price,
              priceToString: listing.price.toString()
            });
          });
          
          setListings(data);
        }
        
        toast.success('Listing updated successfully');
      } catch (error) {
        console.error('[Dashboard] Error fetching listings:', error);
        toast.error('Failed to load your listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  };

  // Handle copy shareable link
  const copyShareableLink = () => {
    if (linkRef.current) {
      linkRef.current.select();
      navigator.clipboard.writeText(linkRef.current.value);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  // Handle welcome popup next step
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowWelcomePopup(false);
      setActiveTab('create');
    }
  };

  // Empty listings state
  const EmptyListingsState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-20 w-20 rounded-full bg-[var(--portal-bg-hover)] flex items-center justify-center mb-6">
        <Building className="h-10 w-10 text-[var(--portal-text-secondary)]" />
      </div>
      <h3 className="text-xl font-medium text-[var(--portal-text)] mb-2">No Listings Yet</h3>
      <p className="text-[var(--portal-text-secondary)] max-w-md mb-6">
        You haven't created any property listings yet. Create your first listing to showcase it to potential clients.
      </p>
      <Button 
        onClick={() => setActiveTab('create')}
        className="bg-gold-500 hover:bg-gold-600 text-black flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Create New Listing
      </Button>
    </div>
  );

  // Shareable Link component
  const ShareableLinkPopup = () => showShareableLink ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[var(--portal-card-bg)] rounded-xl shadow-xl border border-[var(--portal-border)] max-w-md w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gold-500/20 flex items-center justify-center">
              <Share2 className="h-4 w-4 text-gold-500" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--portal-text)]">Your Shareable Link</h3>
          </div>
          <button 
            onClick={() => setShowShareableLink(false)}
            className="text-[var(--portal-text-secondary)] hover:text-[var(--portal-text)] rounded-full h-8 w-8 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-[var(--portal-text-secondary)] mb-5">
          Share this link with your clients to showcase your property listings:
        </p>
        
        <div className="flex items-center gap-2 mb-6">
          <input
            ref={linkRef}
            type="text"
            readOnly
            value={getShareableLink()}
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--portal-bg)] text-[var(--portal-text)] border border-[var(--portal-border)] focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none"
          />
          <Button 
            onClick={() => {
              const link = getShareableLink();
              if (!link) {
                toast.error('Unable to generate shareable link');
                return;
              }
              handleCopy(link);
            }}
            className="bg-gold-500 hover:bg-gold-600 text-black flex items-center gap-2 whitespace-nowrap"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        {/* Social Media Sharing */}
        <div className="border-t border-[var(--portal-border)] pt-4 mb-6">
          <p className="text-[var(--portal-text-secondary)] text-sm mb-3 text-center">
            Share your profile on social media
          </p>
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 bg-[#1DA1F2] hover:bg-[#1a8cd8] border-none"
              onClick={() => {
                const text = `Check out my real estate listings!`;
                const url = getShareableLink();
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
              }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 bg-[#4267B2] hover:bg-[#365899] border-none"
              onClick={() => {
                const url = getShareableLink();
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
              }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 bg-[#0A66C2] hover:bg-[#004182] border-none"
              onClick={() => {
                const url = getShareableLink();
                const title = `Check out my real estate listings!`;
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
              }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 bg-[#25D366] hover:bg-[#128C7E] border-none"
              onClick={() => {
                const text = `Check out my real estate listings: ${getShareableLink()}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 bg-[#0088cc] hover:bg-[#006daa] border-none"
              onClick={() => {
                const text = `Check out my real estate listings!`;
                const url = getShareableLink();
                window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
              }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </Button>
          </div>
        </div>

        <div className="text-center">
          <Button 
            variant="outline"
            onClick={() => setShowShareableLink(false)}
            className="border-[var(--portal-border)] text-[var(--portal-text-secondary)] hover:bg-[var(--portal-bg-hover)]"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  ) : null;

  // Welcome popup component
  const WelcomePopup = () => showWelcomePopup ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[var(--portal-card-bg)] rounded-xl shadow-xl border border-[var(--portal-border)] max-w-lg w-full"
      >
        <div className="flex justify-end p-4">
          <button 
            onClick={() => setShowWelcomePopup(false)}
            className="text-[var(--portal-text-secondary)] hover:text-[var(--portal-text)] rounded-full h-8 w-8 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex h-1.5 bg-[var(--portal-bg-hover)]">
          <motion.div 
            className="bg-gold-500"
            initial={{ width: `${(currentStep - 1) / 3 * 100}%` }}
            animate={{ width: `${currentStep / 3 * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-gold-500/20 flex items-center justify-center">
            <Building className="h-10 w-10 text-gold-500" />
          </div>
        </div>
        
        {currentStep === 1 && (
          <>
            <h3 className="text-xl font-semibold text-center text-[var(--portal-text)] mb-3">
              Welcome to Estate Portal!
            </h3>
            <p className="text-[var(--portal-text-secondary)] text-center mb-6">
              Your account has been approved and you're ready to start showcasing your properties.
            </p>
            <div className="bg-[var(--portal-bg-hover)]/30 rounded-lg p-4 mb-6">
              <p className="text-[var(--portal-text)] text-center">
                Let's get you started with creating your first listing and sharing your profile with clients.
              </p>
            </div>
          </>
        )}
        
        {currentStep === 2 && (
          <>
            <h3 className="text-xl font-semibold text-center text-[var(--portal-text)] mb-3">
              Your Shareable Profile
            </h3>
            <p className="text-[var(--portal-text-secondary)] text-center mb-4">
              You have a unique URL that you can share with your clients:
            </p>
            <div className="bg-[var(--portal-bg-hover)]/30 rounded-lg p-4 mb-6">
              <p className="text-[var(--portal-text)] text-center break-all font-medium">
                {getShareableLink()}
              </p>
            </div>
            <p className="text-[var(--portal-text-secondary)] text-center mb-6">
              You can always access this link later from your dashboard.
            </p>
          </>
        )}
        
        {currentStep === 3 && (
          <>
            <h3 className="text-xl font-semibold text-center text-[var(--portal-text)] mb-3">
              Create Your First Listing
            </h3>
            <p className="text-[var(--portal-text-secondary)] text-center mb-4">
              Add your property details, upload photos, and publish your first listing.
            </p>
            <div className="bg-[var(--portal-bg-hover)]/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-6 w-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-black" />
                </div>
                <p className="text-[var(--portal-text)]">Add property details and location</p>
              </div>
              <div className="flex items-start gap-3 mb-3">
                <div className="h-6 w-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-black" />
                </div>
                <p className="text-[var(--portal-text)]">Upload high-quality images</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-black" />
                </div>
                <p className="text-[var(--portal-text)]">Add contact information for potential clients</p>
              </div>
            </div>
          </>
        )}
        
        <div className="flex justify-center">
          <Button 
            onClick={handleNextStep}
            className="bg-gold-500 hover:bg-gold-600 text-black flex items-center gap-2"
          >
            {currentStep < 3 ? 'Next' : 'Get Started'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  ) : null;

  return (
    <div className="flex min-h-screen portal-layout">
      <AgentSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
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
                 activeTab === 'create' ? 'Create New Listing' : 
                 activeTab === 'edit' ? 'Edit Listing' : 'Account Information'}
              </span>
            </div>
            
            {/* Share Link Button */}
            {profileData && activeTab === 'listings' && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-[var(--portal-text-secondary)] hover:text-[var(--portal-text)] border-[var(--portal-border)]"
                onClick={() => setShowShareableLink(true)}
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                My Public Profile
              </Button>
            )}
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
                <h2 className="portal-title text-[var(--portal-text)] text-2xl font-bold">My Properties</h2>
                <p className="portal-subtitle text-[var(--portal-text-secondary)]">Manage your property listings</p>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
                </div>
              ) : listings.length > 0 ? (
                <div className="portal-card">
                  <ListingTable 
                    listings={listings} 
                    onDelete={handleDeleteListing}
                    onEdit={handleEditListing}
                  />
                </div>
              ) : (
                <div className="portal-card">
                  <EmptyListingsState />
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
              className="w-full"
            >
              <CreateListingForm 
                onSuccess={() => {
                  setActiveTab('listings');
                  toast.success('Listing created successfully');
                  // Show share link popup after first listing creation
                  if (listings.length === 0) {
                    setTimeout(() => {
                      setShowShareableLink(true);
                    }, 1000);
                  }
                }} 
              />
            </motion.div>
          )}
          
          {activeTab === "edit" && currentListingId && (
            <motion.div 
              key="edit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="portal-card portal-animate-in"
            >
              <EditListingForm 
                listingId={currentListingId}
                onSuccess={handleEditSuccess}
                onCancel={() => setActiveTab('listings')}
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

      {/* Popups */}
      <AnimatePresence>
        {showWelcomePopup && <WelcomePopup />}
        {showShareableLink && <ShareableLinkPopup />}
      </AnimatePresence>
    </div>
  );
};

export default AgentDashboard;
