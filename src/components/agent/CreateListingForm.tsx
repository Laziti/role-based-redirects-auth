
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
