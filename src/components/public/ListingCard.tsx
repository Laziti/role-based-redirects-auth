import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, encodeListingId } from '@/lib/formatters';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { MapPin, ImageIcon, DollarSign, Clock, ExternalLink } from 'lucide-react';

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  location?: string;
  mainImageUrl?: string;
  agentSlug?: string;
  description?: string;
  createdAt?: string;
}

const createListingSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const ListingCard = ({
  id,
  title,
  price,
  location,
  mainImageUrl,
  agentSlug,
  description,
  createdAt
}: ListingCardProps) => {
  // Format the time ago
  const timeAgo = createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : '';

  // Format the description (limit to X characters)
  const shortDescription = description ? 
    description.length > 80 ? `${description.substring(0, 80)}...` : description 
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-xl border border-[var(--portal-border)] bg-[var(--portal-card-bg)] shadow-md hover:shadow-lg transition-all"
    >
      {/* Image section */}
      <div className="relative w-full h-48 overflow-hidden">
        {mainImageUrl ? (
          <img 
            src={mainImageUrl} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--portal-bg-hover)]">
            <ImageIcon className="h-12 w-12 text-[var(--portal-text-secondary)]" />
          </div>
        )}

        {/* Price tag */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg font-semibold flex items-center shadow-lg">
          <DollarSign className="h-4 w-4 mr-1 text-gold-500" />
          {formatCurrency(price)}
        </div>

        {/* Time chip */}
        {timeAgo && (
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {timeAgo}
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-[var(--portal-text)] mb-2 line-clamp-1">{title}</h3>
        
        {location && (
          <div className="flex items-start mb-3">
            <MapPin className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />
            <span className="ml-2 text-sm text-[var(--portal-text-secondary)] line-clamp-1">{location}</span>
          </div>
        )}
        
        {shortDescription && (
          <p className="text-sm text-[var(--portal-text-secondary)] mb-4 line-clamp-2">{shortDescription}</p>
        )}
        
        <Link 
          to={`/${agentSlug}/listing/${encodeListingId(id)}/${createListingSlug(title)}`}
          className="inline-flex items-center text-gold-500 hover:text-gold-600 font-medium text-sm group-hover:underline transition-colors"
        >
          View Details
          <ExternalLink className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </motion.div>
  );
};

export default ListingCard;
