import { supabase } from './lib/supabase';

export const uploadReviewImage = async (uri) => {
  // 1. Prepare file metadata
  const ext = uri.split('.').pop().toLowerCase() || 'jpeg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  
  // 2. Create FormData (Specific to React Native)
  const formData = new FormData();
  formData.append('file', {
    uri: uri,
    name: fileName,
    type: `image/${ext}` 
  });

  // 3. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('review_content') // Ensure this bucket exists in your Supabase
    .upload(fileName, formData, { upsert: false });

  if (error) {
    throw new Error('Image upload failed: ' + error.message);
  }

  // 4. Get Public URL
  const { data: publicData } = supabase.storage
    .from('review_content')
    .getPublicUrl(data.path);

  return publicData.publicUrl;
};