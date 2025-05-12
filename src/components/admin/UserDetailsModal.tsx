
import React, { useEffect, useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  status: string;
  career?: string;
  created_at: string;
  listing_count: number;
}

interface UserDetailsModalProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserListing {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

const UserDetailsModal = ({ user, open, onOpenChange }: UserDetailsModalProps) => {
  const [listings, setListings] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user.id) {
      fetchUserListings();
    }
  }, [open, user.id]);

  const fetchUserListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching user listings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {user.first_name} {user.last_name}
            </h3>
            <div className={`px-2 py-1 rounded text-xs inline-block ${
              user.status === 'approved' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {user.status === 'approved' ? 'Approved' : 'Pending'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="font-medium">Phone Number:</div>
              <div>{user.phone_number || 'N/A'}</div>
              
              <div className="font-medium">Career/Profession:</div>
              <div>{user.career || 'N/A'}</div>
              
              <div className="font-medium">Account Created:</div>
              <div>{format(new Date(user.created_at), 'MMM d, yyyy')}</div>
              
              <div className="font-medium">Total Listings:</div>
              <div>{user.listing_count}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Recent Listings</h4>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : listings.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {listings.map(listing => (
                  <li key={listing.id} className="border-b pb-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{listing.title}</span>
                      <span className={`text-xs ${
                        listing.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {listing.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(listing.created_at), 'MMM d, yyyy')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No listings found</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
