import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createSlug } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ExternalLink, Clipboard, Check } from 'lucide-react';

type ListingLimitType = {
  type: string;
  value: number;
};

const AccountInfo = ({ listings }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [listingLimit, setListingLimit] = useState<ListingLimitType>({
    type: 'month',
    value: 5
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (error) throw error;
        setProfile(data);

        if (data.listing_limit) {
          // Make sure we properly parse and validate the listing_limit before setting it
          try {
            const limitData = data.listing_limit;
            if (limitData && typeof limitData === 'object' && 'type' in limitData && 'value' in limitData) {
              setListingLimit({
                type: String(limitData.type),
                value: Number(limitData.value)
              });
            }
          } catch (parseError) {
            console.error('Error parsing listing limit:', parseError);
          }
        }
      } catch (error) {
        console.error('Failed to load account information');
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const getUsagePercentage = () => {
    if (listingLimit.type === 'unlimited') return 0;
    
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

  const formatLimitType = (type) => {
    switch (type) {
      case 'day': return 'daily';
      case 'week': return 'weekly';
      case 'month': return 'monthly';
      case 'year': return 'yearly';
      case 'unlimited': return 'unlimited';
      default: return type;
    }
  };

  const getPublicProfileUrl = () => {
    if (!profile || !profile.first_name || !profile.last_name) return '';
    const slug = createSlug(`${profile.first_name} ${profile.last_name}`);
    return `${window.location.origin}/${slug}`;
  };

  const handleCopyUrl = () => {
    const url = getPublicProfileUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <Avatar className="w-24 h-24 border-2 border-gold-500">
                  <div className="bg-gold-900 text-white w-full h-full flex items-center justify-center text-3xl font-bold">
                    {profile.first_name?.charAt(0) || ''}{profile.last_name?.charAt(0) || ''}
                  </div>
                </Avatar>
                
                <div>
                  <h3 className="text-xl font-bold mb-1">
                    {profile.first_name} {profile.last_name}
                  </h3>
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
              
              {/* Public Profile URL */}
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
                      <Link to={`/${createSlug(`${profile.first_name} ${profile.last_name}`)}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-gold-500">Listing Limit</h4>
                <div className="bg-[var(--portal-bg)] border border-[var(--portal-border)] rounded-md p-4 space-y-3">
                  {listingLimit.type === 'unlimited' ? (
                    <p className="text-[var(--portal-text)]">You have unlimited listing privileges.</p>
                  ) : (
                    <>
                      <p className="text-[var(--portal-text-secondary)]">
                        Your {formatLimitType(listingLimit.type)} limit: 
                        <span className="font-semibold text-[var(--portal-text)]"> {listingLimit.value} listings</span>
                      </p>
                      <div className="w-full bg-[var(--portal-bg)]border border-[var(--portal-border)] rounded-full h-2.5">
                        <div 
                          className="bg-gold-500 h-2.5 rounded-full" 
                          style={{ width: `${getUsagePercentage()}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-xs text-[var(--portal-text-secondary)]">
                          {getUsagePercentage()}% used
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-500"></div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default AccountInfo;
