
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatCurrency } from '@/lib/formatters';

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  location?: string;
  mainImageUrl?: string;
  agentSlug: string;
}

const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  location,
  mainImageUrl,
  agentSlug
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
          </AspectRatio>
        </div>
        
        <CardContent className="pt-4">
          <h3 className="font-semibold text-lg mb-1 text-gold-500 line-clamp-1">{title}</h3>
          {location && (
            <p className="text-sm text-[var(--portal-text-secondary)] line-clamp-1">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-3 w-3 inline-block mr-1" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {location}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="pt-0 pb-4">
          <div className="font-bold text-xl text-[var(--portal-text)]">
            {formatCurrency(price || 0)}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ListingCard;
