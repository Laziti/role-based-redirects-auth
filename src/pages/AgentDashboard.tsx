import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import AgentSidebar from '@/components/agent/AgentSidebar';
import ListingTable from '@/components/agent/ListingTable';
import CreateListingForm from '@/components/agent/CreateListingForm';
import EditListingForm from '@/components/agent/EditListingForm';
import AccountInfo from '@/components/agent/AccountInfo';
import { Loader2, Plus, X, Building, Copy, Share2, Check, Rocket, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import '@/styles/portal-theme.css';
import { createSlug } from '@/lib/formatters';
import UpgradeSidebar from '@/components/agent/UpgradeSidebar';

const AgentDashboard = () => {
  const { user, userStatus, signOut, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState('listings');
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [currentListingId, setCurrentListingId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef(null);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const linkRef = useRef<HTMLInputElement>(null);
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [headerLinkCopied, setHeaderLinkCopied] = useState(false);
  const lastRefreshTime = useRef(0);
  const refreshCooldown = 10000; // 10 seconds cooldown between refreshes

  const fetchListings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Only refresh session if enough time has passed since last refresh
      const now = Date.now();
      if (now - lastRefreshTime.current >= refreshCooldown) {
        try {
          await refreshSession();
          lastRefreshTime.current = now;
        } catch (error) {
          // If we hit rate limit, continue with current session
          if (error?.message?.includes('rate limit')) {
            console.warn('Rate limit hit for session refresh, continuing with current session');
          } else {
            throw error;
          }
        }
      }
      
      // Force fresh data with no caching
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      // If we hit rate limit, show a user-friendly message
      if (error?.message?.includes('rate limit')) {
        // You might want to show this in the UI
        console.warn('Please wait a moment before refreshing again');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to get user's public profile URL
  const getPublicProfileUrl = () => {
    if (!profileData) return '';
    
    // Use the slug if available, otherwise create one from name
    const profileSlug = profileData.slug || createSlug(`${profileData.first_name} ${profileData.last_name}`);
    
    // Get base URL without any path segments
    const url = new URL(window.location.href);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Return the complete URL
    return `${baseUrl}/${profileSlug}`;
  };

  // Helper function for clipboard operations
  const copyToClipboard = (text, successCallback) => {
    try {
      // Try modern approach first
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(successCallback)
          .catch(err => {
            console.log('Clipboard API failed, trying fallback', err);
            // Fallback for browsers that don't support the Clipboard API
            fallbackCopyToClipboard(text, successCallback);
          });
      } else {
        console.log('Using fallback clipboard approach');
        // For non-secure contexts or older browsers
        fallbackCopyToClipboard(text, successCallback);
      }
    } catch (err) {
      console.error('Copy operation failed completely', err);
    }
  };

  // Fallback clipboard method
  const fallbackCopyToClipboard = (text, successCallback) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Style to prevent scrolling to bottom
    textArea.style.position = 'fixed';
    textArea.style.left = '0';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', 'readonly');
    
    document.body.appendChild(textArea);
    
    // Special handling for iOS devices
    const range = document.createRange();
    range.selectNodeContents(textArea);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    textArea.setSelectionRange(0, 999999);
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      successCallback();
    }
  };

  // Copy profile link to clipboard
  const copyProfileLink = () => {
    const link = getPublicProfileUrl();
    copyToClipboard(link, () => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };
  
  // Copy profile link from header button
  const copyProfileLinkFromHeader = () => {
    const link = getPublicProfileUrl();
    copyToClipboard(link, () => {
      setHeaderLinkCopied(true);
      setTimeout(() => setHeaderLinkCopied(false), 2000);
    });
  };

  useEffect(() => {
    // Ensure the user is approved
    if (userStatus && userStatus !== 'approved') {
      navigate('/pending');
      return;
    }

    // Add keyboard shortcut for developers (Ctrl+Shift+W)
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        resetWelcomeCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
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

        // Check if user is a first-time visitor
        const hasSeen = hasUserSeenWelcome();
        
        if (!hasSeen) {
          // This is a first-time user, show welcome card
          // Set a small delay to ensure profile data is loaded
          setTimeout(() => {
            setShowWelcomeCard(true);
          }, 300);
          
          // Save that user has seen welcome
          markUserAsSeenWelcome();
        }

        // Only fetch listings if we haven't recently fetched them
        const now = Date.now();
        if (now - lastRefreshTime.current >= refreshCooldown) {
          await fetchListings();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // If we hit rate limit, show a user-friendly message
        if (error?.message?.includes('rate limit')) {
          console.warn('Please wait a moment before refreshing again');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Cleanup event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, userStatus, navigate]);

  const handleEditListing = (listingId) => {
    setCurrentListingId(listingId);
    setActiveTab('edit');
  };
  
  const handleEditSuccess = () => {
    // Refresh listings
    setActiveTab('listings');
    // Refetch listings to get updated data
    fetchListings();
  };

  // Development-only function to reset welcome state and show card
  const resetWelcomeCard = () => {
    if (user) {
      // Clear the has seen welcome flag for this user
      localStorage.removeItem(`hasSeenWelcome-${user.id}`);
      // Force show the welcome card
      setShowWelcomeCard(true);
      console.log('[Dashboard] Welcome card has been reset and forced to show');
    }
  };

  // Helper function to check if user has seen welcome
  const hasUserSeenWelcome = () => {
    if (!user) return true; // Default to true if no user
    return localStorage.getItem(`hasSeenWelcome-${user.id}`) === 'true';
  };

  // Helper function to mark user as having seen welcome
  const markUserAsSeenWelcome = () => {
    if (!user) return;
    localStorage.setItem(`hasSeenWelcome-${user.id}`, 'true');
  };

  // Track welcome card visibility changes
  useEffect(() => {
    console.log('[Dashboard] Welcome card visibility changed:', { showWelcomeCard });
  }, [showWelcomeCard]);

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

  // Welcome popup component
  const WelcomeCard = () => {
    // Log for debugging whenever welcome card component renders
    console.log('[WelcomeCard] Rendering with state:', {
      showWelcomeCard,
      hasProfileData: !!profileData
    });
    
    if (!showWelcomeCard || !profileData) {
      return null;
    }
    
    // Function to handle closing the welcome card
    const handleClose = () => {
      console.log('[WelcomeCard] Closing welcome card');
      setShowWelcomeCard(false);
      // Ensure the user is marked as having seen the welcome
      markUserAsSeenWelcome();
    };
    
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="welcome-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
          onClick={(e) => {
            // Close when clicking the backdrop, but not when clicking the modal itself
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div className="min-h-screen py-6 px-3 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--portal-card-bg)] rounded-xl shadow-xl border border-[var(--portal-border)] p-5 md:p-6 max-w-xl w-full mx-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-3 right-3 md:top-4 md:right-4">
                <button
                  onClick={handleClose}
                  className="text-[var(--portal-text-secondary)] hover:text-[var(--portal-text)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex justify-center mb-4 md:mb-5 mt-2">
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center">
                  <Rocket className="h-7 w-7 md:h-8 md:w-8 text-amber-800" />
                </div>
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-center text-[var(--portal-text)] mb-1 md:mb-2">
                Welcome to Your Dashboard!
              </h2>
              <p className="text-[var(--portal-text-secondary)] text-center text-sm md:text-base mb-5 md:mb-7 px-1">
                Your account has been approved. Here's how to get started:
              </p>
              
              <div className="flex flex-col lg:flex-row gap-4 md:gap-6 max-h-[60vh] lg:max-h-none overflow-y-auto lg:overflow-visible pb-1">
                {/* Share profile card */}
                <div className="flex-1 rounded-lg border border-[var(--portal-border)] p-4 bg-[var(--portal-bg)]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Globe className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-[var(--portal-text)]">Your Public Profile</h3>
                  </div>
                  <p className="text-xs md:text-sm text-[var(--portal-text-secondary)] mb-3">
                    Share this link with clients to showcase your property listings:
                  </p>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={getPublicProfileUrl()}
                      readOnly
                      onClick={(e) => e.currentTarget.select()}
                      className="flex-1 px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm rounded bg-[var(--portal-bg-hover)] text-[var(--portal-text)] border border-[var(--portal-border)] cursor-text truncate select-all"
                    />
                    <Button
                      onClick={copyProfileLink}
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white flex gap-1 items-center text-xs h-8 px-2.5 whitespace-nowrap flex-shrink-0"
                    >
                      {linkCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {linkCopied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
                
                {/* Create listing card */}
                <div className="flex-1 rounded-lg border border-[var(--portal-border)] p-4 bg-[var(--portal-bg)]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Building className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-[var(--portal-text)]">Create Your First Listing</h3>
                  </div>
                  <p className="text-xs md:text-sm text-[var(--portal-text-secondary)] mb-3">
                    Get started by creating your first property listing to showcase to potential clients:
                  </p>
                  
                  <Button 
                    onClick={() => {
                      handleClose();
                      setActiveTab('create');
                    }}
                    className="w-full bg-gold-500 hover:bg-gold-600 text-black flex items-center justify-center gap-1.5 h-8 md:h-9 text-xs md:text-sm"
                  >
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Create New Listing
                  </Button>
                </div>
              </div>
              
              <div className="mt-5 md:mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-[var(--portal-border)] text-[var(--portal-text-secondary)] text-xs md:text-sm h-8 md:h-9"
                >
                  Explore Dashboard First
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="flex h-screen bg-[var(--portal-bg)]">
      <AgentSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--portal-border)]">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-[var(--portal-text)]">
              {activeTab === 'listings' && 'My Properties'}
              {activeTab === 'create' && 'Create New Listing'}
              {activeTab === 'edit' && 'Edit Listing'}
              {activeTab === 'account' && 'Account Information'}
              {activeTab === 'upgrade' && 'Upgrade to Pro'}
            </h1>
            </div>
            
          {/* Share Profile Button */}
              <Button 
                variant="outline" 
            className="border-[var(--portal-border)] text-[var(--portal-text-secondary)] hover:text-[var(--portal-text)] hover:bg-[var(--portal-bg-hover)]"
                onClick={copyProfileLinkFromHeader}
              >
            {headerLinkCopied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                Share My Profile
              </>
            )}
          </Button>
              </div>
              
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
                </div>
          ) : (
            <>
              {/* Welcome Card */}
              <AnimatePresence>
                {showWelcomeCard && <WelcomeCard />}
              </AnimatePresence>

              {/* Tab Content */}
              {activeTab === 'listings' && (
                listings.length > 0 ? (
                  <ListingTable 
                    listings={listings} 
                    onEdit={handleEditListing}
                  />
              ) : (
                  <EmptyListingsState />
                )
              )}
              
              {activeTab === 'create' && (
                <CreateListingForm onSuccess={() => {
                  setActiveTab('listings');
                  // Refetch listings after successful creation
                  fetchListings();
                }} />
              )}
              
              {activeTab === 'edit' && currentListingId && (
              <EditListingForm 
                listingId={currentListingId}
                onSuccess={handleEditSuccess}
                onCancel={() => setActiveTab('listings')}
              />
              )}
              
              {activeTab === 'account' && (
                <div className="grid grid-cols-1">
                  <AccountInfo listings={listings} profile={profileData} onRefresh={fetchListings} />
                </div>
              )}

              {activeTab === 'upgrade' && profileData?.subscription_status !== 'pro' && (
                <UpgradeSidebar />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;