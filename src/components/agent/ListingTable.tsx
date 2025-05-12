
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
import { Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
}

const ListingTable = ({ listings, onDelete }: ListingTableProps) => {
  const navigate = useNavigate();
  
  const handleEdit = (id: string) => {
    // For now just show a placeholder, we'll implement edit functionality later
    console.log(`Edit listing ${id}`);
  };

  return (
    <div className="bg-white rounded-md shadow">
      {listings.length === 0 ? (
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
          <p className="text-gray-500 mb-4">You haven't created any listings yet.</p>
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
                      <div className="w-12 h-12 bg-gray-200 rounded-md mr-3 flex items-center justify-center text-gray-400">
                        No img
                      </div>
                    )}
                    <span className="truncate max-w-[200px]">{listing.title}</span>
                  </div>
                </TableCell>
                <TableCell>{listing.price ? `$${listing.price.toLocaleString()}` : 'N/A'}</TableCell>
                <TableCell>{listing.location || 'N/A'}</TableCell>
                <TableCell>{format(new Date(listing.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(listing.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-red-500" onClick={() => onDelete(listing.id)}>
                      <Trash2 className="h-4 w-4" />
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
