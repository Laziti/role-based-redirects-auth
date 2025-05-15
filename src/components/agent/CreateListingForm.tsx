import React, { useState, useEffect } from 'react';
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
import { Loader2, Upload, X, Plus, Info, Camera, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showFormTips, setShowFormTips] = useState(false);
  const [currentTipStep, setCurrentTipStep] = useState(1);
  const totalTipSteps = 3;

  useEffect(() => {
    // Check if this is the first time using the form
    const hasSeenFormTips = localStorage.getItem('hasSeenFormTips');
    if (!hasSeenFormTips && user) {
      setShowFormTips(true);
    }
  }, [user]);

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

  const handleNextTip = () => {
    if (currentTipStep < totalTipSteps) {
      setCurrentTipStep(prev => prev + 1);
    } else {
      setShowFormTips(false);
      localStorage.setItem('hasSeenFormTips', 'true');
    }
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
        .insert([
          {
          title: values.title,
          description: values.description,
          price: values.price,
          location: values.location,
          main_image_url: mainImagePublicUrl.publicUrl,
          additional_image_urls: additionalImageUrls.length > 0 ? additionalImageUrls : null,
            user_id: user.id,
            status: 'pending',
          phone_number: values.phone_number || null,
          whatsapp_link: values.whatsapp_link || null,
            telegram_link: values.telegram_link || null
          }
        ])
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

  // Form Tips Popup Component
  const FormTipsPopup = () => (
    <AnimatePresence>
      {showFormTips && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[var(--portal-card-bg)] rounded-xl shadow-xl border border-[var(--portal-border)] max-w-lg w-full overflow-hidden"
          >
            {/* Progress bar */}
            <div className="flex h-1.5 bg-[var(--portal-bg-hover)]">
              <motion.div 
                className="bg-gold-500"
                initial={{ width: `${(currentTipStep - 1) / totalTipSteps * 100}%` }}
                animate={{ width: `${currentTipStep / totalTipSteps * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            <div className="p-6">
              {currentTipStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key="step1"
                >
                  <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                      <Info className="h-8 w-8 text-amber-500" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-center text-[var(--portal-text)] mb-3">
                    Create Your First Listing
                  </h3>
                  <p className="text-[var(--portal-text-secondary)] text-center mb-6">
                    Here are some quick tips to help you create an attractive property listing.
                  </p>
                  
                  <div className="bg-[var(--portal-bg-hover)]/30 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-6 w-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                      <p className="text-[var(--portal-text)]">Use a clear and descriptive title</p>
                    </div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-6 w-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                      <p className="text-[var(--portal-text)]">Include key details like size and features</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                      <p className="text-[var(--portal-text)]">Be specific about the location</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {currentTipStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key="step2"
                >
                  <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-center text-[var(--portal-text)] mb-3">
                    Image Tips
                  </h3>
                  <p className="text-[var(--portal-text-secondary)] text-center mb-6">
                    Great photos can make your listing stand out to potential clients.
                  </p>
                  
                  <div className="bg-[var(--portal-bg-hover)]/30 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-6 w-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                      <p className="text-[var(--portal-text)]">Use high-quality, well-lit images</p>
                    </div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-6 w-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                      <p className="text-[var(--portal-text)]">Show multiple angles of the property</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                      <p className="text-[var(--portal-text)]">Include both interior and exterior shots</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {currentTipStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key="step3"
                >
                  <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-center text-[var(--portal-text)] mb-3">
                    You're Ready!
                  </h3>
                  <p className="text-[var(--portal-text-secondary)] text-center mb-6">
                    Your listing will be reviewed and published shortly after submission.
                  </p>
                  
                  <div className="bg-[var(--portal-bg-hover)]/30 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-6 w-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                      <p className="text-[var(--portal-text)]">Fill in all contact information for interested clients</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                      <p className="text-[var(--portal-text)]">Once approved, your listing will be visible on your profile page</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleNextTip}
                  className="bg-gold-500 hover:bg-gold-600 text-black flex items-center gap-2"
                >
                  {currentTipStep < totalTipSteps ? 'Next Tip' : 'Start Creating'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className="bg-[var(--portal-card-bg)] rounded-lg shadow-md border border-[var(--portal-border)]">
        <div className="border-b border-[var(--portal-border)] p-6 bg-gradient-to-r from-[var(--portal-bg)] to-[var(--portal-card-bg)]">
          <h2 className="text-2xl font-semibold text-[var(--portal-text)]">Create New Listing</h2>
          <p className="text-[var(--portal-text-secondary)] mt-1">Fill out the form to create a new property listing</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-8">
          <div className="space-y-10">
            {/* Property Details Section */}
            <div className="bg-[var(--portal-bg-hover)]/30 p-6 rounded-lg border border-[var(--portal-border)]/60">
              <h3 className="text-lg font-medium text-[var(--portal-text)] mb-6 flex items-center">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold-500 text-black mr-3 text-sm font-bold">1</span>
                Property Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-[var(--portal-label-text)] mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    placeholder="e.g. Modern 2 Bedroom Apartment"
                    className="w-full px-4 py-3 rounded-lg bg-[var(--portal-input-bg)] text-[var(--portal-input-text)] border border-[var(--portal-input-border)] focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all"
                    {...form.register('title')}
                  />
                  {form.formState.errors.title && (
                    <p className="mt-1 text-sm text-red-500">{form.formState.errors.title.message}</p>
                  )}
      </div>
      
        <div>
                  <label htmlFor="price" className="block text-sm font-medium text-[var(--portal-label-text)] mb-2">
                    Price (ETB) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="price"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    placeholder="e.g. 150000"
                    className="w-full px-4 py-3 rounded-lg bg-[var(--portal-input-bg)] text-[var(--portal-input-text)] border border-[var(--portal-input-border)] focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all"
                    {...form.register('price')}
                  />
                  {form.formState.errors.price && (
                    <p className="mt-1 text-sm text-red-500">{form.formState.errors.price.message}</p>
                  )}
                </div>
                
            <div>
                  <label htmlFor="location" className="block text-sm font-medium text-[var(--portal-label-text)] mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                    <input 
                    id="location"
                    type="text"
                    required
                    placeholder="e.g. Addis Ababa"
                    className="w-full px-4 py-3 rounded-lg bg-[var(--portal-input-bg)] text-[var(--portal-input-text)] border border-[var(--portal-input-border)] focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all"
                    {...form.register('location')}
                  />
                  {form.formState.errors.location && (
                    <p className="mt-1 text-sm text-red-500">{form.formState.errors.location.message}</p>
                  )}
                </div>
                
                <div className="col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-[var(--portal-label-text)] mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows={5}
                    required
                    placeholder="Describe the property..."
                    className="w-full px-4 py-3 rounded-lg bg-[var(--portal-input-bg)] text-[var(--portal-input-text)] border border-[var(--portal-input-border)] focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all resize-none"
                    {...form.register('description')}
                  />
                  {form.formState.errors.description && (
                    <p className="mt-1 text-sm text-red-500">{form.formState.errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="bg-[var(--portal-bg-hover)]/30 p-6 rounded-lg border border-[var(--portal-border)]/60">
              <h3 className="text-lg font-medium text-[var(--portal-text)] mb-6 flex items-center">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold-500 text-black mr-3 text-sm font-bold">2</span>
                Property Images
              </h3>
              
              <div className="mb-8">
                <label className="block text-sm font-medium text-[var(--portal-label-text)] mb-2">
                  Main Image <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-[var(--portal-border)] rounded-lg bg-[var(--portal-bg)]/40">
                  <div className="space-y-1 text-center">
                    {mainImagePreview ? (
                      <div className="relative">
                  <img 
                    src={mainImagePreview} 
                          alt="Property preview" 
                          className="mx-auto h-56 object-cover rounded-md shadow-sm" 
                  />
                        <button
                    type="button"
                    onClick={removeMainImage}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                  >
                    <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="mx-auto h-16 w-16 text-[var(--portal-text-secondary)]"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
                          <label
                            htmlFor="main-image-upload"
                            className="relative cursor-pointer bg-gold-500 hover:bg-gold-600 text-black font-medium rounded-md px-4 py-2 transition-colors focus-within:outline-none inline-flex items-center"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            <span>Upload main image</span>
                            <input
                              id="main-image-upload"
                              name="main-image-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleMainImageChange}
                              required={!mainImage}
                            />
                          </label>
                          <p className="text-sm text-[var(--portal-text-secondary)]">or drag and drop</p>
                        </div>
                        <p className="text-xs text-[var(--portal-text-secondary)] mt-2">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-[var(--portal-label-text)] mb-2">
                  Additional Images (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-2">
                  {/* Render existing additional images */}
                {additionalImagePreviews.map((preview, index) => (
                    <div key={index} className="relative h-36 border rounded-lg overflow-hidden shadow-sm bg-[var(--portal-bg)]/40">
                    <img 
                      src={preview} 
                      alt={`Additional image ${index + 1}`} 
                        className="w-full h-full object-cover"
                    />
                      <button
                      type="button"
                      onClick={() => removeAdditionalImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                    >
                      <X className="h-3 w-3" />
                      </button>
                  </div>
                ))}
                
                  {/* Add more images button */}
                  {additionalImages.length < 5 && (
                    <label
                      htmlFor="additional-image-upload"
                      className="h-36 border-2 border-dashed border-[var(--portal-border)] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--portal-bg-hover)] transition-colors bg-[var(--portal-bg)]/40"
                    >
                      <Plus className="h-8 w-8 text-gold-500" />
                      <span className="text-sm text-[var(--portal-text-secondary)] mt-2 font-medium">Add Image</span>
                    <input 
                        id="additional-image-upload"
                      type="file" 
                      accept="image/*" 
                        className="sr-only"
                      onChange={handleAdditionalImagesChange}
                    />
                  </label>
                )}
              </div>
                <p className="text-xs text-[var(--portal-text-secondary)] mt-3">
                  You can upload up to 5 additional images for better property presentation
                </p>
          </div>
        </div>
        
            {/* Contact Information */}
            <div className="bg-[var(--portal-bg-hover)]/30 p-6 rounded-lg border border-[var(--portal-border)]/60">
              <h3 className="text-lg font-medium text-[var(--portal-text)] mb-6 flex items-center">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold-500 text-black mr-3 text-sm font-bold">3</span>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-[var(--portal-label-text)] mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    type="tel"
                    placeholder="e.g. +251 91 234 5678"
                    className="w-full px-4 py-3 rounded-lg bg-[var(--portal-input-bg)] text-[var(--portal-input-text)] border border-[var(--portal-input-border)] focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all"
                    {...form.register('phone_number')}
                />
              </div>
              
              <div>
                  <label htmlFor="whatsapp_link" className="block text-sm font-medium text-[var(--portal-label-text)] mb-2">
                    WhatsApp Link
                  </label>
                  <input
                    id="whatsapp_link"
                    type="text"
                            placeholder="e.g. https://wa.me/2519XXXXXXXX" 
                    className="w-full px-4 py-3 rounded-lg bg-[var(--portal-input-bg)] text-[var(--portal-input-text)] border border-[var(--portal-input-border)] focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all"
                    {...form.register('whatsapp_link')}
                  />
                </div>
                
                <div>
                  <label htmlFor="telegram_link" className="block text-sm font-medium text-[var(--portal-label-text)] mb-2">
                    Telegram Link
                  </label>
                  <input
                    id="telegram_link"
                    type="text"
                            placeholder="e.g. https://t.me/username" 
                    className="w-full px-4 py-3 rounded-lg bg-[var(--portal-input-bg)] text-[var(--portal-input-text)] border border-[var(--portal-input-border)] focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all"
                    {...form.register('telegram_link')}
                  />
                </div>
              </div>
            </div>

            {/* Helpful Hints */}
            <div className="bg-blue-500/10 p-5 rounded-lg border border-blue-500/20">
              <h3 className="text-lg font-medium text-blue-500 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                Tips for a Great Listing
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-[var(--portal-text-secondary)]">
                <li>Use a clear, high-quality main image that showcases the property's best features</li>
                <li>Write a detailed description including key features, dimensions, and amenities</li>
                <li>Include accurate contact information so potential buyers can reach you easily</li>
                <li>Adding multiple images from different angles helps generate more interest</li>
              </ul>
                </div>
              </div>
              
          <div className="mt-12 pt-6 border-t border-[var(--portal-border)] flex justify-between items-center">
            <p className="text-sm text-[var(--portal-text-secondary)]">
              Your listing will be reviewed before being published
            </p>
            <button
                type="submit" 
                disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600 active:from-gold-800 active:to-gold-700 text-black font-medium rounded-lg shadow-md transition-all flex items-center justify-center text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Listing...
                </>
              ) : (
                <>Create Listing</>
              )}
            </button>
          </div>
            </form>
      </div>
      
      {/* Form Tips Popup */}
      <FormTipsPopup />
    </>
  );
};

export default CreateListingForm;
