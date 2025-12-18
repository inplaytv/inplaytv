'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';
import styles from './images.module.css';

interface PlatformImage {
  id: string;
  filename: string;
  category: string;
  public_url: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
  created_at: string;
}

export default function ImagesLibraryPage() {
  const [images, setImages] = useState<PlatformImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const categories = [
    { value: 'all', label: 'All Images' },
    { value: 'tournament_background', label: 'Tournament Backgrounds' },
    { value: 'tournament_card', label: 'Tournament Cards' },
    { value: 'hero', label: 'Hero Images' },
    { value: 'general', label: 'General' }
  ];

  useEffect(() => {
    fetchImages();
  }, [selectedCategory]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('platform_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      setMessage({ type: 'error', text: 'Failed to fetch images' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setMessage(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload images');
      }

      // Prompt for category
      const category = prompt('Select category:\n1. tournament_background\n2. tournament_card\n3. hero\n4. general');
      if (!category || !['tournament_background', 'tournament_card', 'hero', 'general'].includes(category)) {
        setMessage({ type: 'error', text: 'Invalid category selected' });
        return;
      }

      // Create unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${category}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('platform-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('platform-images')
        .getPublicUrl(fileName);

      // Get image dimensions
      const dimensions = await getImageDimensions(file);

      // Save to database
      const { data: imageData, error: dbError } = await supabase
        .from('platform_images')
        .insert({
          filename: file.name,
          category,
          storage_path: fileName,
          public_url: publicUrl,
          alt_text: file.name,
          width: dimensions.width,
          height: dimensions.height,
          file_size_bytes: file.size,
          mime_type: file.type,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      fetchImages();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to upload image' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDelete = async (image: PlatformImage) => {
    if (!confirm(`Delete "${image.filename}"?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('platform-images')
        .remove([image.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('platform_images')
        .delete()
        .eq('id', image.id);

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'Image deleted successfully' });
      fetchImages();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete image' });
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setMessage({ type: 'success', text: 'URL copied to clipboard!' });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Image Library</h1>
          <p>Manage all platform images in one place</p>
        </div>
        <button 
          onClick={handleFileSelect} 
          className={styles.uploadBtn}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : '+ Upload Image'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.filters}>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`${styles.filterBtn} ${selectedCategory === cat.value ? styles.active : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading images...</p>
        </div>
      ) : images.length === 0 ? (
        <div className={styles.empty}>
          <p>No images found in this category</p>
          <button onClick={handleFileSelect} className={styles.uploadBtn}>
            Upload First Image
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {images.map(image => (
            <div key={image.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                <img src={image.public_url} alt={image.alt_text || image.filename} />
                <div className={styles.overlay}>
                  <button 
                    onClick={() => copyUrl(image.public_url)}
                    className={styles.iconBtn}
                    title="Copy URL"
                  >
                    📋
                  </button>
                  <button 
                    onClick={() => handleDelete(image)}
                    className={styles.iconBtn}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className={styles.details}>
                <div className={styles.filename}>{image.filename}</div>
                <div className={styles.meta}>
                  {image.width && image.height && (
                    <span>{image.width}×{image.height}</span>
                  )}
                  <span>{formatFileSize(image.file_size_bytes)}</span>
                </div>
                <div className={styles.category}>{image.category.replace('_', ' ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
