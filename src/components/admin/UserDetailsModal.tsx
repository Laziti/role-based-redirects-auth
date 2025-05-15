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
import { Loader2, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface User {
  id: string;
  email?: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  status: string;
  career?: string;
  created_at: string;
  listing_count: number;
  payment_receipt_url?: string;
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
  price?: number;
  location?: string;
}

const UserDetailsModal = ({ user, open, onOpenChange }: UserDetailsModalProps) => {
  const [listings, setListings] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(user.email);

  useEffect(() => {
    if (open && user.id) {
      fetchUserListings();
      fetchUserEmail();
    }
  }, [open, user.id]);

  const fetchUserEmail = async () => {
    if (user.email) {
      setUserEmail(user.email);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_auth_users_data');

      if (error) throw error;

      const userInfo = data?.find((u: any) => u.id === user.id);
      if (userInfo) {
        setUserEmail(userInfo.email);
      }
    } catch (error) {
      console.error('Error fetching user email:', error);
    }
  };

  const fetchUserListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, status, created_at, price, location')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
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
                <div className="font-medium">Email:</div>
                <div>{userEmail || 'Loading...'}</div>
                
                <div className="font-medium">Phone Number:</div>
                <div>{user.phone_number || 'Not provided'}</div>
                
                <div className="font-medium">Career/Profession:</div>
                <div>{user.career || 'Not provided'}</div>
                
                <div className="font-medium">Account Created:</div>
                <div>{format(new Date(user.created_at), 'MMM d, yyyy')}</div>
                
                <div className="font-medium">Total Listings:</div>
                <div>{user.listing_count}</div>
              </div>
            </div>

            {user.payment_receipt_url && (
              <div className="space-y-2">
                <h4 className="font-medium">Payment Receipt</h4>
                <div className="border rounded p-2">
                  <a
                    href={user.payment_receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View Receipt <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </div>
                {user.payment_receipt_url.endsWith('.jpg') || 
                 user.payment_receipt_url.endsWith('.jpeg') || 
                 user.payment_receipt_url.endsWith('.png') ? (
                  <div className="border rounded p-2">
                    <img 
                      src={user.payment_receipt_url} 
                      alt="Payment Receipt" 
                      className="max-h-48 mx-auto"
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">User Listings</h4>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : listings.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left text-sm font-medium">Title</th>
                      <th className="py-2 text-left text-sm font-medium">Price</th>
                      <th className="py-2 text-left text-sm font-medium">Status</th>
                      <th className="py-2 text-left text-sm font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map(listing => (
                      <tr key={listing.id} className="border-b">
                        <td className="py-2 text-sm font-medium">
                          <div className="truncate max-w-[150px]">{listing.title}</div>
                          <div className="text-xs text-gray-500">{listing.location || 'No location'}</div>
                        </td>
                        <td className="py-2 text-sm">{formatCurrency(listing.price)}</td>
                        <td className="py-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {listing.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-2 text-sm text-gray-500">
                          {format(new Date(listing.created_at), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
