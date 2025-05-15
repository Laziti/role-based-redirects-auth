import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatCurrency } from '@/lib/formatters';
import { MapPin, Calendar } from 'lucide-react';

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  location?: string;
  mainImageUrl?: string;
  agentSlug: string;
  description?: string;
  createdAt?: string;
}

const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  location,
  mainImageUrl,
  agentSlug,
  description,
  createdAt
}) => {
  return (
    <Link to={`/${agentSlug}/listing/${id}`} className="block transition-transform hover:-translate-y-1">
      <Card className="h-full overflow-hidden bg-[var(--portal-card-bg)] border-[var(--portal-border)]">
        <div className="relative">
          <AspectRatio ratio={4/3}>
            {mainImageUrl ? (
              <img 
                src={mainImageUrl} 
                alt={title} 
                className="object-cover w-full h-full" 
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gold-900/10 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12 text-gold-500/30" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            )}
            <div className="absolute top-2 right-2 bg-gold-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
              {formatCurrency(price || 0)}
            </div>
          </AspectRatio>
        </div>
        
        <CardContent className="pt-4">
          <h3 className="font-semibold text-lg mb-2 text-gold-500 line-clamp-2">{title}</h3>
          
          <div className="space-y-2">
            {location && (
              <div className="flex items-center text-sm text-[var(--portal-text-secondary)]">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{location}</span>
              </div>
            )}
            
            {description && (
              <p className="text-sm text-[var(--portal-text-secondary)] line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 pb-4">
          {createdAt && (
            <div className="flex items-center text-xs text-[var(--portal-text-secondary)]">
              <Calendar className="h-3 w-3 mr-1" />
              <time dateTime={createdAt}>
                {new Date(createdAt).toLocaleDateString()}
              </time>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ListingCard;
