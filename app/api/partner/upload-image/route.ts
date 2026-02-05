import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'hero' or 'logo'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Neplatný typ súboru: ${file.type}. Povolené: JPEG, PNG, WebP, GIF` },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Súbor je príliš veľký. Maximum je 5MB' },
        { status: 400 }
      );
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process with sharp - resize and convert to WebP
    let processedImage: Buffer;

    if (type === 'hero') {
      // Hero images: max 1920x1080, quality 80
      processedImage = await sharp(buffer)
        .resize(1920, 1080, {
          fit: 'cover',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();
    } else if (type === 'logo') {
      // Logos: max 400x400, quality 85
      processedImage = await sharp(buffer)
        .resize(400, 400, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } else if (type === 'gallery') {
      // Gallery images: max 1200x800, quality 80
      processedImage = await sharp(buffer)
        .resize(1200, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();
    } else {
      // Default: max 1200px, quality 80
      processedImage = await sharp(buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const filename = `${user.id}/${type || 'image'}-${timestamp}-${randomId}.webp`;
    const thumbFilename = `${user.id}/${type || 'image'}-${timestamp}-${randomId}-thumb.webp`;

    // Generate thumbnail for gallery images (200x200 cover crop)
    let thumbnailBuffer: Buffer | null = null;
    if (type === 'gallery') {
      thumbnailBuffer = await sharp(buffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 75 })
        .toBuffer();
    }

    // Upload main image to Supabase Storage
    const { data, error } = await supabase.storage
      .from('partner-images')
      .upload(filename, processedImage, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year cache
      });

    if (error) {
      console.error('[upload-image] Storage error:', error.message);
      return NextResponse.json(
        { error: 'Chyba pri nahrávaní: ' + error.message },
        { status: 500 }
      );
    }

    // Upload thumbnail if generated
    if (thumbnailBuffer) {
      await supabase.storage
        .from('partner-images')
        .upload(thumbFilename, thumbnailBuffer, {
          contentType: 'image/webp',
          cacheControl: '31536000', // 1 year cache
        });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('partner-images')
      .getPublicUrl(data.path);

    // Get thumbnail URL if available
    let thumbnailUrl: string | undefined;
    if (thumbnailBuffer) {
      const { data: thumbUrlData } = supabase.storage
        .from('partner-images')
        .getPublicUrl(thumbFilename);
      thumbnailUrl = thumbUrlData.publicUrl;
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      thumbnailUrl,
      path: data.path,
      size: processedImage.length,
    });
  } catch (error) {
    console.error('[upload-image] Error:', error instanceof Error ? error.message : error);
    const errorMessage = error instanceof Error ? error.message : 'Neznáma chyba';
    return NextResponse.json(
      { error: `Chyba servera: ${errorMessage}` },
      { status: 500 }
    );
  }
}
