import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createSlug } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ExternalLink, Clipboard, Check, AlertCircle } from 'lucide-react';
import type { Database } from '@/types/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ListingLimitType = NonNullable<Profile['listing_limit']>;

interface AccountInfoProps {
  listings?: any[];
  profile?: Profile;
  onRefresh?: () => Promise<void>;
}

const PLAN_DETAILS = {
  'free': {
    name: 'Free Tier',
    listingsPerMonth: 5,
    price: 0,
  },
  'monthly-basic': {
    name: 'Monthly Basic',
    listingsPerMonth: 20,
    price: 800,
  },
  'monthly-premium': {
    name: 'Monthly Premium',
    listingsPerMonth: 50,
    price: 1500,
  },
  'semi-annual': {
    name: 'Semi-Annual',
    listingsPerMonth: 100,
    price: 4000,
  }
};

const AccountInfo = ({ listings = [], profile: initialProfile, onRefresh }: AccountInfoProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [listingLimit, setListingLimit] = useState<ListingLimitType>({
    type: 'month',
    value: 5
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (initialProfile) {
        setProfile(initialProfile);
        if (initialProfile.listing_limit) {
          setListingLimit(initialProfile.listing_limit);
        }
        return;
      }

      if (!user?.id) {
        setProfile(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          setError('Failed to load profile');
          setProfile(null);
          return;
        }

        if (!data) {
          console.error('No profile found for user');
          setError('Profile not found');
          setProfile(null);
          return;
        }

        setProfile(data);
        if (data.listing_limit) {
          setListingLimit(data.listing_limit);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('An unexpected error occurred');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

      fetchProfile();
  }, [user, initialProfile]);

  const getUsagePercentage = () => {
    let count = 0;
    const now = new Date();
    
    switch (listingLimit.type) {
      case 'day':
        count = listings.filter(l => {
          const listingDate = new Date(l.created_at);
          return listingDate.toDateString() === now.toDateString();
        }).length;
        break;
      case 'week':
        count = listings.filter(l => {
          const listingDate = new Date(l.created_at);
          const diffTime = Math.abs(now.getTime() - listingDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        }).length;
        break;
      case 'month':
        count = listings.filter(l => {
          const listingDate = new Date(l.created_at);
          return (
            listingDate.getMonth() === now.getMonth() &&
            listingDate.getFullYear() === now.getFullYear()
          );
        }).length;
        break;
      case 'year':
        count = listings.filter(l => {
          const listingDate = new Date(l.created_at);
          return listingDate.getFullYear() === now.getFullYear();
        }).length;
        break;
      default:
        return 0;
    }
    
    return Math.min(Math.round((count / listingLimit.value) * 100), 100);
  };

  const formatLimitType = (type: string) => {
    switch (type) {
      case 'day': return 'daily';
      case 'week': return 'weekly';
      case 'month': return 'monthly';
      case 'year': return 'yearly';
      default: return type;
    }
  };

  const getPublicProfileUrl = () => {
    if (!profile) return '';
    
    // Use the slug if available, otherwise create one from name
    const profileSlug = profile.slug || createSlug(`${profile.first_name || ''} ${profile.last_name || ''}`);
    
    // Get base URL without any path segments
    const url = new URL(window.location.href);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Return the complete URL
    return `${baseUrl}/${profileSlug}`;
  };

  const handleCopyUrl = () => {
    const url = getPublicProfileUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDaysUntilPayment = () => {
    if (!profile) return null;
    
    const endDate = profile.subscription_end_date || profile.subscription_details?.end_date;
    if (!endDate) return null;
    
    const paymentDate = new Date(endDate);
    const today = new Date();
    
    // Reset time parts for accurate day calculation
    today.setHours(0, 0, 0, 0);
    paymentDate.setHours(0, 0, 0, 0);
    
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const isPaymentSoon = () => {
    const daysLeft = getDaysUntilPayment();
    return daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  };

  const getSubscriptionStatus = () => {
    if (!profile) return null;
    
    const daysLeft = getDaysUntilPayment();
    if (daysLeft === null) return null;

    if (daysLeft < 0) {
      return {
        type: 'expired',
        message: 'Your subscription has expired',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20'
      };
    } else if (daysLeft <= 3) {
      return {
        type: 'critical',
        message: `Your subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}! Please renew now to avoid service interruption.`,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20'
      };
    } else if (daysLeft <= 7) {
      return {
        type: 'warning',
        message: `Your subscription expires in ${daysLeft} days. Please renew soon.`,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20'
      };
    } else if (daysLeft <= 14) {
      return {
        type: 'info',
        message: `Your subscription will expire in ${daysLeft} days`,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20'
      };
    }
    
    return null;
  };

  return (
    <>
      <Card className="bg-[var(--portal-card-bg)] border-[var(--portal-border)] mb-6">
        <CardHeader>
          <CardTitle className="text-gold-500">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="space-y-6">
              {profile.subscription_status === 'pro' && (
                <>
                  {/* Subscription Status Alert */}
                  {getSubscriptionStatus() && (
                    <Alert className={`${getSubscriptionStatus()?.bgColor} border-${getSubscriptionStatus()?.borderColor} ${getSubscriptionStatus()?.color}`}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {getSubscriptionStatus()?.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
              
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <Avatar className="w-24 h-24 border-2 border-gold-500">
                  <div className="bg-gold-900 text-white w-full h-full flex items-center justify-center text-3xl font-bold">
                    {profile.first_name?.charAt(0) || ''}{profile.last_name?.charAt(0) || ''}
                  </div>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">
                    {profile.first_name} {profile.last_name}
                  </h3>
                    {profile.subscription_status === 'pro' && (
                      <span className="bg-gold-500/10 text-gold-500 text-xs font-semibold px-2 py-1 rounded-full border border-gold-500/20">
                        PRO
                      </span>
                    )}
                  </div>
                  {profile.career && (
                    <p className="text-[var(--portal-text-secondary)] mb-2">
                      {profile.career}
                    </p>
                  )}
                  {profile.phone_number && (
                    <p className="text-[var(--portal-text-secondary)]">
                      Phone: {profile.phone_number}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Subscription Details */}
              <div className="bg-[var(--portal-bg)] border border-[var(--portal-border)] rounded-md p-4 space-y-4">
                <h4 className="font-semibold text-gold-500">Subscription Details</h4>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-[var(--portal-border)]">
                    <span className="text-[var(--portal-text-secondary)]">Status</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${profile.subscription_status === 'pro' ? 'text-gold-500' : 'text-[var(--portal-text)]'}`}>
                        {profile.subscription_status === 'pro' ? 'PRO' : 'Free Tier'}
                      </span>
                      {profile.subscription_status === 'pro' && getDaysUntilPayment() !== null && (
                        <span className="text-xs text-[var(--portal-text-secondary)]">
                          ({getDaysUntilPayment()} day{getDaysUntilPayment() === 1 ? '' : 's'} remaining)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--portal-border)]">
                    <span className="text-[var(--portal-text-secondary)]">Plan</span>
                    <span className="font-semibold text-[var(--portal-text)]">
                      {PLAN_DETAILS[profile.subscription_status === 'pro' ? 'monthly-basic' : 'free'].name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--portal-border)]">
                    <span className="text-[var(--portal-text-secondary)]">Monthly Price</span>
                    <span className="font-semibold text-[var(--portal-text)]">
                      {PLAN_DETAILS[profile.subscription_status === 'pro' ? 'monthly-basic' : 'free'].price} ETB
                    </span>
                  </div>
                  {(profile.subscription_end_date || profile.subscription_details?.end_date) && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-[var(--portal-border)]">
                        <span className="text-[var(--portal-text-secondary)]">Next Payment Due</span>
                        <span className="font-semibold text-[var(--portal-text)]">
                          {new Date(profile.subscription_end_date || profile.subscription_details?.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      {profile.subscription_status === 'pro' && (
                        <div className="flex justify-between items-center py-2 border-b border-[var(--portal-border)]">
                          <span className="text-[var(--portal-text-secondary)]">Subscription Period</span>
                          <span className="font-semibold text-[var(--portal-text)]">
                            {new Date(profile.subscription_details?.start_date || '').toLocaleDateString()} - {new Date(profile.subscription_end_date || profile.subscription_details?.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Listing Limit Section */}
              <div className="bg-[var(--portal-bg)] border border-[var(--portal-border)] rounded-md p-4 space-y-3">
                <h4 className="font-semibold text-gold-500">Listing Allowance</h4>
                <p className="text-[var(--portal-text-secondary)]">
                  Your {formatLimitType(listingLimit.type)} limit: 
                  <span className="font-semibold text-[var(--portal-text)]"> {listingLimit.value} listings</span>
                </p>
                <div className="w-full bg-[var(--portal-bg)] border border-[var(--portal-border)] rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      getUsagePercentage() >= 90 
                        ? 'bg-red-500' 
                        : getUsagePercentage() >= 75 
                          ? 'bg-yellow-500' 
                          : 'bg-gold-500'
                    }`}
                    style={{ width: `${getUsagePercentage()}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--portal-text-secondary)]">
                    {listings.length} used of {listingLimit.value} listings
                  </span>
                  <span className="text-xs text-[var(--portal-text-secondary)]">
                    {getUsagePercentage()}% used
                  </span>
                </div>
                {getUsagePercentage() >= 75 && (
                  <div className={`text-sm mt-2 ${getUsagePercentage() >= 90 ? 'text-red-500' : 'text-yellow-500'}`}>
                    {getUsagePercentage() >= 90 
                      ? "You're almost at your listing limit! Consider upgrading your plan."
                      : "You're approaching your listing limit."}
                  </div>
                )}
              </div>

              {/* Public Profile URL Section */}
              <div className="bg-[var(--portal-bg)] border border-[var(--portal-border)] rounded-md p-4">
                <h4 className="text-sm font-semibold mb-2 text-gold-500">Your Public Profile URL</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex-1 text-[var(--portal-text-secondary)] text-sm font-mono bg-[var(--portal-card-bg)] border border-[var(--portal-border)] rounded px-3 py-2 truncate">
                    {getPublicProfileUrl()}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleCopyUrl}
                      className="whitespace-nowrap"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Clipboard className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="whitespace-nowrap"
                      asChild
                    >
                      <Link to={`/${profile.slug || createSlug(`${profile.first_name || ''} ${profile.last_name || ''}`)}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-[var(--portal-text-secondary)]">
              Loading account information...
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default AccountInfo;
