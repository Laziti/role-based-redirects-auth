
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Define form schema
const profileSchema = z.object({
  phone_number: z.string().optional(),
  career: z.string().min(1, 'Career information is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ListingLimit {
  type: string;
  value?: number;
}

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  career: string | null;
  listing_limit: ListingLimit | null;
}

interface AccountInfoProps {
  listings: any[];
}

const AccountInfo = ({ listings }: AccountInfoProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone_number: '',
      career: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone_number, career, listing_limit')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        // Convert the JSON listing_limit to the expected type
        const listingLimit = data.listing_limit ? {
          type: typeof data.listing_limit === 'object' ? 
            (data.listing_limit.type as string) : 'month',
          value: typeof data.listing_limit === 'object' ? 
            (data.listing_limit.value as number) : 5
        } : { type: 'month', value: 5 };
        
        setProfile({
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number,
          career: data.career,
          listing_limit: listingLimit
        });
        
        form.reset({
          phone_number: data.phone_number || '',
          career: data.career || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone_number: values.phone_number,
          career: values.career,
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast.success('Profile updated successfully');
      
      // Update local state
      setProfile(prev => 
        prev ? { 
          ...prev, 
          phone_number: values.phone_number || null,
          career: values.career 
        } : null
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate usage metrics
  const getListingUsageInfo = () => {
    if (!profile || !profile.listing_limit) return null;
    
    const limit = profile.listing_limit;
    
    if (limit.type === 'unlimited') {
      return {
        current: listings.length,
        max: 'Unlimited',
        percent: 0,
      };
    }
    
    // Filter listings based on time period
    const now = new Date();
    let startDate;
    
    switch (limit.type) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        const day = now.getDay();
        startDate = new Date(now.setDate(now.getDate() - day));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const filteredListings = listings.filter(
      listing => new Date(listing.created_at) >= startDate
    );
    
    return {
      current: filteredListings.length,
      max: limit.value || 0,
      percent: limit.value ? (filteredListings.length / limit.value) * 100 : 0,
    };
  };
  
  const usageInfo = getListingUsageInfo();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            View and update your profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Name</h3>
              <p className="text-gray-600 mt-1">
                {profile?.first_name} {profile?.last_name}
              </p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 123 456 7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="career"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Career</FormLabel>
                      <FormControl>
                        <Input placeholder="Real Estate Agent" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Profile
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listing Information</CardTitle>
          <CardDescription>
            Your listing limits and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Listing Plan</h3>
              <p className="text-gray-600 mt-1">
                {profile?.listing_limit?.type === 'unlimited'
                  ? 'Unlimited listings'
                  : `${profile?.listing_limit?.value || 'N/A'} listings per ${profile?.listing_limit?.type || 'month'}`}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Total Listings</h3>
              <p className="text-gray-600 mt-1">{listings.length} listings created</p>
            </div>
            
            {usageInfo && profile?.listing_limit?.type !== 'unlimited' && (
              <div>
                <h3 className="font-medium">Current Usage ({profile?.listing_limit?.type})</h3>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{usageInfo.current} of {usageInfo.max}</span>
                    <span>{Math.round(usageInfo.percent)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-2 rounded-full ${
                        usageInfo.percent > 90 ? 'bg-red-500' : 
                        usageInfo.percent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, usageInfo.percent)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountInfo;
