
import React, { useState, useEffect } from 'react';
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
import { Loader2, ExternalLink, Phone, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface UserInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  career: string | null;
  email?: string;
}

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  status: string | null;
  main_image_url: string | null;
  additional_image_urls: string[] | null;
  phone_number: string | null;
  whatsapp_link: string | null;
  telegram_link: string | null;
  user_id: string | null;
  user?: UserInfo;
}

interface ListingDetailsModalProps {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: () => void;
}

const ListingDetailsModal = ({ listing, open, onOpenChange, onStatusChange }: ListingDetailsModalProps) => {
  const [owner, setOwner] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(listing.main_image_url);

  useEffect(() => {
    if (open && listing.user_id) {
      fetchOwnerInfo();
    }
    
    // Set the main image when opening
    if (open && listing.main_image_url) {
      setSelectedImage(listing.main_image_url);
    }
  }, [open, listing]);

  const fetchOwnerInfo = async () => {
    if (!listing.user_id) return;
    
    setLoading(true);
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', listing.user_id)
        .single();
        
      if (profileError) throw profileError;
      
      // Fetch email from auth.users using the RPC function
      const { data: authData, error: authError } = await supabase
        .rpc('get_auth_users_data');
        
      if (authError) throw authError;
      
      const userEmail = authData?.find((u: any) => u.id === listing.user_id)?.email;
      
      setOwner({
        id: profileData.id,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone_number: profileData.phone_number,
        career: profileData.career,
        email: userEmail
      });
    } catch (error) {
      console.error('Error fetching owner info:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleListingStatus = async () => {
    if (!listing.id) return;
    
    setUpdating(true);
    try {
      const newStatus = listing.status === 'active' ? 'hidden' : 'active';
      
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listing.id);
        
      if (error) throw error;
      
      toast.success(`Listing is now ${newStatus}`);
      
      // Call the callback to refresh the listings list
      if (onStatusChange) {
        onStatusChange();
      }
      
      // Close the modal
      onOpenChange(false);
      
    } catch (error: any) {
      toast.error(`Error updating listing: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };
  
  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null) return 'Not specified';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{listing.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: Images */}
          <div className="space-y-4">
            {/* Main image display */}
            <div className="bg-gray-100 rounded-lg overflow-hidden h-64 flex items-center justify-center">
              {selectedImage ? (
                <img 
                  src={selectedImage} 
                  alt={listing.title}
                  className="object-contain h-full w-full"
                />
              ) : (
                <div className="text-gray-400">No image available</div>
              )}
            </div>
            
            {/* Thumbnails for all images */}
            <div className="flex overflow-x-auto gap-2 pb-2">
              {listing.main_image_url && (
                <button
                  className={`flex-shrink-0 h-16 w-16 rounded overflow-hidden border-2 ${
                    selectedImage === listing.main_image_url ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedImage(listing.main_image_url)}
                >
                  <img 
                    src={listing.main_image_url} 
                    alt="Main" 
                    className="h-full w-full object-cover"
                  />
                </button>
              )}
              
              {listing.additional_image_urls?.map((imgUrl, index) => (
                <button
                  key={index}
                  className={`flex-shrink-0 h-16 w-16 rounded overflow-hidden border-2 ${
                    selectedImage === imgUrl ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedImage(imgUrl)}
                >
                  <img 
                    src={imgUrl} 
                    alt={`Additional ${index + 1}`} 
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
          
          {/* Right column: Details */}
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold">{formatCurrency(listing.price)}</h2>
                <p className="text-gray-500">{listing.location || 'No location specified'}</p>
              </div>
              
              <Badge className={
                listing.status === 'active' ? 'bg-green-500' : 
                listing.status === 'hidden' ? 'bg-gray-500' : 'bg-yellow-500'
              }>
                {listing.status || 'pending'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {listing.description || 'No description provided'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="font-medium">Listed on:</div>
              <div>{formatDate(listing.created_at)}</div>
              
              <div className="font-medium">Last updated:</div>
              <div>{formatDate(listing.updated_at)}</div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Contact Information</h3>
              <div className="flex flex-wrap gap-2">
                {listing.phone_number && (
                  <a 
                    href={`tel:${listing.phone_number}`}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <Phone className="h-3 w-3" /> Call
                  </a>
                )}
                
                {listing.whatsapp_link && (
                  <a 
                    href={listing.whatsapp_link}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    <MessageSquare className="h-3 w-3" /> WhatsApp
                  </a>
                )}
                
                {listing.telegram_link && (
                  <a 
                    href={listing.telegram_link}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <MessageSquare className="h-3 w-3" /> Telegram
                  </a>
                )}
              </div>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Listed by</h3>
                {loading ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  </div>
                ) : owner ? (
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {owner.first_name} {owner.last_name} 
                      {(!owner.first_name && !owner.last_name) && 'Unknown User'}
                    </p>
                    {owner.email && <p className="text-sm">{owner.email}</p>}
                    {owner.phone_number && <p className="text-sm">{owner.phone_number}</p>}
                    {owner.career && <p className="text-sm text-gray-500">{owner.career}</p>}
                  </div>
                ) : (
                  <p className="text-gray-500">Owner information not available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button
            variant={listing.status === 'active' ? "destructive" : "default"}
            onClick={toggleListingStatus}
            disabled={updating}
          >
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {listing.status === 'active' ? 'Hide Listing' : 'Show Listing'}
          </Button>
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ListingDetailsModal;
