import React from 'react';
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Edit, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatters';

interface Listing {
  id: string;
  title: string;
  price?: number;
  location?: string;
  created_at: string;
  main_image_url?: string;
}

interface ListingTableProps {
  listings: Listing[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

const ListingTable = ({ listings, onDelete, onEdit }: ListingTableProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-[var(--portal-card-bg)] rounded-md shadow border border-[var(--portal-border)]">
      {listings.length === 0 ? (
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium text-[var(--portal-text)] mb-2">No listings found</h3>
          <p className="text-[var(--portal-text-secondary)] mb-4">You haven't created any listings yet.</p>
          <Button onClick={() => navigate('/agent?tab=create')}>Create Your First Listing</Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {listing.main_image_url ? (
                      <img 
                        src={listing.main_image_url} 
                        alt={listing.title}
                        className="w-12 h-12 object-cover rounded-md mr-3"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[var(--portal-highlight)] rounded-md mr-3 flex items-center justify-center text-[var(--portal-text-secondary)]">
                        No img
                      </div>
                    )}
                    <span className="truncate max-w-[200px] text-[var(--portal-text)]">{listing.title}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[var(--portal-text)]">{listing.price ? formatCurrency(listing.price) : 'N/A'}</TableCell>
                <TableCell className="text-[var(--portal-text)]">{listing.location || 'N/A'}</TableCell>
                <TableCell className="text-[var(--portal-text)]">{format(new Date(listing.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="icon" onClick={() => onEdit(listing.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-red-500" onClick={() => onDelete(listing.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ListingTable;
