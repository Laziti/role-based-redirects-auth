
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X, Plus } from 'lucide-react';

const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.coerce.number().positive('Price must be a positive number'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  phone_number: z.string().optional(),
  whatsapp_link: z.string().optional(),
  telegram_link: z.string().optional()
});

type ListingFormValues = z.infer<typeof listingSchema>;

interface CreateListingFormProps {
  onSuccess: () => void;
}

const CreateListingForm = ({ onSuccess }: CreateListingFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      price: undefined,
      location: '',
      phone_number: '',
      whatsapp_link: '',
      telegram_link: ''
    }
  });

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAdditionalImages(prev => [...prev, ...filesArray]);
      
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeMainImage = () => {
    setMainImage(null);
    setMainImagePreview(null);
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalImagePreviews(prev => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (values: ListingFormValues) => {
    if (!user) {
      toast.error('You must be logged in to create a listing');
      return;
    }

    if (!mainImage) {
      toast.error('Main image is required');
      return;
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Create New Listing</h2>
        <p className="text-gray-500">Fill out the form to create a new property listing</p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium mb-4">Images</h3>
          
          <div className="space-y-4">
            <div>
              <FormLabel className="block mb-2">Main Image <span className="text-red-500">*</span></FormLabel>
              {!mainImagePreview ? (
                <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <label className="cursor-pointer block">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload main image</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleMainImageChange}
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={mainImagePreview} 
                    alt="Main image preview" 
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeMainImage}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div>
              <FormLabel className="block mb-2">Additional Images</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {additionalImagePreviews.map((preview, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden">
                    <img 
                      src={preview} 
                      alt={`Additional image ${index + 1}`} 
                      className="w-full h-24 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeAdditionalImage(index)}
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {additionalImagePreviews.length < 5 && (
                  <label className="cursor-pointer border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-24">
                    <Plus className="h-6 w-6 text-gray-400" />
                    <span className="text-xs text-gray-500">Add image</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleAdditionalImagesChange}
                      disabled={isSubmitting}
                    />
                  </label>
                )}
              </div>
              <FormDescription className="mt-1 text-xs">
                Add up to 5 additional images (optional)
              </FormDescription>
            </div>
          </div>
        </div>
        
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Modern 2 Bedroom Apartment" 
                        {...field} 
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="e.g. 150000" 
                          {...field} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Addis Ababa" 
                          {...field}
                          disabled={isSubmitting} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the property..." 
                        className="min-h-[100px]" 
                        {...field}
                        disabled={isSubmitting} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. +2519XXXXXXXX" 
                            {...field}
                            disabled={isSubmitting} 
                          />
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
                          <Input 
                            placeholder="e.g. https://wa.me/2519XXXXXXXX" 
                            {...field}
                            disabled={isSubmitting} 
                          />
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
                          <Input 
                            placeholder="e.g. https://t.me/username" 
                            {...field}
                            disabled={isSubmitting} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Listing
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CreateListingForm;
