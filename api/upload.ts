import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Busboy from 'busboy';
import { createClient } from '@supabase/supabase-js';
import zlib from 'node:zlib';
import { promisify } from 'node:util';

const gzip = promisify(zlib.gzip);

// Initialize Supabase (User headers will be used to initialize the client per-request for RLS)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rldipcysrkxjkukgurzd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const config = {
  api: {
    bodyParser: false, // Required for Busboy
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const busboy = Busboy({ headers: req.headers });
  let fileBuffer: Buffer | null = null;
  let fileName = '';
  let contentType = '';
  let userId = '';

  // Extract User ID from Authorization header (or session)
  // For this example, we assume the user's ID or session token is available
  // In a real Vercel environment, you might use @supabase/auth-helpers-nextjs or similar
  const authHeader = req.headers.authorization;
  const supabase = createClient(supabaseUrl, supabaseServiceKey || '', {
    global: { headers: { Authorization: authHeader || '' } },
  });

  // Verify Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized', details: authError });
  }
  userId = user.id;

  return new Promise((resolve, reject) => {
    busboy.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      fileName = filename;
      contentType = mimeType;
      const chunks: Buffer[] = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', async () => {
      if (!fileBuffer) {
        res.status(400).json({ error: 'No file uploaded' });
        return resolve(null);
      }

      try {
        const originalSize = fileBuffer.length;

        // 1. Compress the file
        const compressedBuffer = await gzip(fileBuffer);
        const compressedSize = compressedBuffer.length;

        // 2. Upload to Vercel Blob
        // Vercel Blob will automatically use BLOB_READ_WRITE_TOKEN from env
        const blob = await put(fileName, compressedBuffer, {
          access: 'public',
          contentType: contentType,
        });

        // 3. Store metadata in Supabase
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            name: fileName,
            url: blob.url,
            size_original: originalSize,
            size_compressed: compressedSize,
            file_type: contentType,
            user_id: userId,
          });

        if (dbError) {
          throw dbError;
        }

        res.status(200).json({
          url: blob.url,
          originalSize,
          compressedSize,
          savings: Math.round(((originalSize - compressedSize) / originalSize) * 100),
        });
        resolve(null);
      } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
        resolve(null);
      }
    });

    req.pipe(busboy);
  });
}
