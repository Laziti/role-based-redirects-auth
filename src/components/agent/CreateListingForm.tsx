
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ImagePlus, X } from 'lucide-react';

// Define form schema with Zod
const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  price: z.coerce.number().min(1, 'Price must be greater than 0'),
  location: z.string().min(3, 'Location must be specified'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  phone_number: z.string().optional(),
  whatsapp_link: z.string().optional(),
  telegram_link: z.string().optional(),
});

type ListingFormValues = z.infer<typeof listingSchema>;

interface ListingLimit {
  type: string;
  value?: number;
}

type CreateListingFormProps = {
  onSuccess: () => void;
};

const CreateListingForm = ({ onSuccess }: CreateListingFormProps) => {
  const { user } = useAuth();
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userListingLimit, setUserListingLimit] = useState<ListingLimit | null>(null);
  const [currentListingCount, setCurrentListingCount] = useState(0);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      price: undefined,
      location: '',
      description: '',
      phone_number: '',
      whatsapp_link: '',
      telegram_link: '',
    },
  });

  // Fetch user's listing limit and current count
  useEffect(() => {
    const fetchUserListingInfo = async () => {
      if (!user) return;

      try {
        // Fetch user's listing limit from profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('listing_limit')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        
        // Parse the listing limit from the JSON data
        let limitData: ListingLimit = { type: 'month', value: 5 };
        
        if (profileData.listing_limit) {
          const rawLimit = profileData.listing_limit;
          if (typeof rawLimit === 'object' && rawLimit !== null) {
            limitData = {
              type: rawLimit.type?.toString() || 'month',
              value: typeof rawLimit.value === 'number' ? rawLimit.value : 5
            };
          }
        }
        
        setUserListingLimit(limitData);

        // Count user's current listings based on the limit type
        if (limitData.type !== 'unlimited') {
          const timeConstraint = getTimeConstraint(limitData.type);
          
          const { count, error: countError } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .filter('created_at', 'gte', timeConstraint);
          
          if (countError) throw countError;
          setCurrentListingCount(count || 0);
        }
      } catch (error) {
        console.error('Error fetching user listing info:', error);
      }
    };

    fetchUserListingInfo();
  }, [user]);

  // Helper function to get time constraint based on limit type
  const getTimeConstraint = (timeFrame: string): string => {
    const now = new Date();
    switch(timeFrame) {
      case 'day':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case 'week': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        return new Date(now.setDate(diff)).toISOString();
      }
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMainImage(file);
    const preview = URL.createObjectURL(file);
    setMainImagePreview(preview);
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setAdditionalImages(prev => [...prev, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(additionalImagePreviews[index]);
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: ListingFormValues) => {
    if (!user) {
      toast.error('You must be logged in to create a listing');
      return;
    }
    
    // Check if main image is provided
    if (!mainImage) {
      toast.error('Main image is required');
      return;
    }
    
    // Check if user has reached their limit
    if (userListingLimit && userListingLimit.type !== 'unlimited' && userListingLimit.value) {
      if (currentListingCount >= userListingLimit.value) {
        toast.error(`You've reached your limit of ${userListingLimit.value} listings per ${userListingLimit.type}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Upload main image
      const mainImageFileName = `${user.id}/${Date.now()}-${mainImage.name}`;
      const { data: mainImageData, error: mainImageError } = await supabase.storage
        .from('listing-images')
        .upload(mainImageFileName, mainImage);

      if (mainImageError) throw mainImageError;

      // Get the public URL for the main image
      const { data: mainImagePublicUrl } = supabase.storage
        .from('listing-images')
        .getPublicUrl(mainImageFileName);

      // 2. Upload additional images if any
      const additionalImageUrls: string[] = [];
      
      for (let i = 0; i < additionalImages.length; i++) {
        const file = additionalImages[i];
        const fileName = `${user.id}/${Date.now()}-${i}-${file.name}`;
        
        const { data: additionalImageData, error: additionalImageError } = await supabase.storage
          .from('listing-images')
          .upload(fileName, file);
          
        if (additionalImageError) {
          console.error(`Error uploading additional image ${i}:`, additionalImageError);
          continue;
        }
        
        const { data: publicUrl } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);
          
        additionalImageUrls.push(publicUrl.publicUrl);
      }

      // 3. Create the listing record in the database
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert([{
          title: values.title,
          description: values.description,
          price: values.price,
          location: values.location,
          main_image_url: mainImagePublicUrl.publicUrl,
          additional_image_urls: additionalImageUrls.length > 0 ? additionalImageUrls : null,
          phone_number: values.phone_number || null,
          whatsapp_link: values.whatsapp_link || null,
          telegram_link: values.telegram_link || null,
          user_id: user.id,
          status: 'active'
        }])
        .select()
        .single();

      if (listingError) throw listingError;

      toast.success('Listing created successfully!');
      form.reset();
      setMainImage(null);
      setMainImagePreview(null);
      setAdditionalImages([]);
      setAdditionalImagePreviews([]);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating listing:', error);
      toast.error(`Failed to create listing: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Create New Listing</h2>
            {userListingLimit && userListingLimit.type !== 'unlimited' && (
              <div className="text-sm text-gray-500">
                {currentListingCount} / {userListingLimit.value} listings used this {userListingLimit.type}
              </div>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload Section */}
            <div className="space-y-4">
              <div>
                <FormLabel>Main Image (required)</FormLabel>
                <div className="mt-2">
                  {mainImagePreview ? (
                    <div className="relative">
                      <img 
                        src={mainImagePreview} 
                        alt="Property preview" 
                        className="h-48 w-full rounded-md object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          URL.revokeObjectURL(mainImagePreview);
                          setMainImage(null);
                          setMainImagePreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-center rounded-md border border-dashed border-gray-300 px-6 py-10">
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-12 w-12 text-gray-300" />
                        <div className="mt-4 flex text-sm leading-6">
                          <label
                            htmlFor="main-image-upload"
                            className="relative cursor-pointer rounded-md bg-white font-semibold text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-primary"
                          >
                            <span>Upload a file</span>
                            <input
                              id="main-image-upload"
                              name="main-image-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleMainImageChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <FormLabel>Additional Images (optional)</FormLabel>
                <div className="mt-2">
                  {additionalImagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                      {additionalImagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Additional image ${index + 1}`}
                            className="h-24 w-full rounded-md object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => removeAdditionalImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-center rounded-md border border-dashed border-gray-300 px-6 py-8">
                    <div className="text-center">
                      <div className="flex text-sm leading-6">
                        <label
                          htmlFor="additional-images-upload"
                          className="relative cursor-pointer rounded-md bg-white font-semibold text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-primary"
                        >
                          <span>Upload additional images</span>
                          <input
                            id="additional-images-upload"
                            name="additional-images-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={handleAdditionalImagesChange}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Listing Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Beautiful apartment in downtown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1000" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? undefined : Number(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your property..." 
                      className="min-h-32" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Channels */}
            <div>
              <h3 className="font-medium mb-3">Contact Channels</h3>
              <div className="grid gap-4 md:grid-cols-3">
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
                  name="whatsapp_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://wa.me/1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telegram_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telegram Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://t.me/username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Listing
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateListingForm;
