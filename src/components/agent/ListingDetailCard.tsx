import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Phone, MessageCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';

interface ListingDetailCardProps {
  listing: {
    title: string;
    price?: number;
    location?: string;
    description?: string;
    created_at: string;
    main_image_url?: string;
    phone_number?: string;
    whatsapp_link?: string;
    telegram_link?: string;
    status?: string;
  };
  onClose: () => void;
}

const ListingDetailCard = ({ listing, onClose }: ListingDetailCardProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[var(--portal-card-bg)] rounded-lg shadow-xl w-full max-w-2xl my-4">
        {/* Header - Fixed */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-[var(--portal-border)] bg-[var(--portal-card-bg)]">
          <h3 className="text-xl font-semibold text-[var(--portal-text)]">Listing Details</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image */}
            <div>
              {listing.main_image_url ? (
                <img 
                  src={listing.main_image_url} 
                  alt={listing.title}
                  className="w-full h-48 md:h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 md:h-64 bg-[var(--portal-highlight)] rounded-lg flex items-center justify-center text-[var(--portal-text-secondary)]">
                  No image available
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-[var(--portal-text)]">{listing.title}</h4>
                <p className="text-sm text-[var(--portal-text-secondary)]">
                  Created on {format(new Date(listing.created_at), 'MMMM d, yyyy')}
                </p>
              </div>

              <div>
                <div className="text-xl md:text-2xl font-bold text-[var(--portal-text)]">
                  {listing.price ? formatCurrency(listing.price) : 'Price not specified'}
                </div>
                <div className="text-[var(--portal-text-secondary)]">{listing.location || 'Location not specified'}</div>
              </div>

              <div>
                <div className="font-medium text-[var(--portal-text)] mb-1">Status</div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {listing.status || 'pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <h4 className="font-medium text-[var(--portal-text)] mb-2">Description</h4>
            <p className="text-[var(--portal-text-secondary)] whitespace-pre-wrap">{listing.description || 'No description provided'}</p>
          </div>

          {/* Contact Information */}
          <div className="mt-6">
            <h4 className="font-medium text-[var(--portal-text)] mb-3">Contact Information</h4>
            <div className="space-y-2">
              {listing.phone_number && (
                <div className="flex items-center gap-2 text-[var(--portal-text)]">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span className="break-all">{listing.phone_number}</span>
                </div>
              )}
              {listing.whatsapp_link && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 h-auto py-2 px-3"
                  onClick={() => window.open(listing.whatsapp_link, '_blank')}
                >
                  <MessageCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="break-all">Open WhatsApp Chat</span>
                </Button>
              )}
              {listing.telegram_link && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 h-auto py-2 px-3"
                  onClick={() => window.open(listing.telegram_link, '_blank')}
                >
                  <MessageCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="break-all">Open Telegram Chat</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="sticky bottom-0 z-10 flex justify-end gap-2 p-4 border-t border-[var(--portal-border)] bg-[var(--portal-card-bg)]">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailCard; 