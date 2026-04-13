import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import busboy from 'busboy';
import { createClient } from '@supabase/supabase-js';
import zlib from 'zlib';
import { promisify } from 'util';
import { Readable } from 'stream';

const gzip = promisify(zlib.gzip);

// Environment setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

export const config = {
  api: {
    bodyParser: false, // Required for manual stream consumption
  },
};

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log(`[Upload] New Request: ${req.method} | Content-Type: ${req.headers['content-type']} | Content-Length: ${req.headers['content-length']}`);

  // 1. Initial Validation
  if (!supabaseUrl || !supabaseServiceKey || !blobToken) {
    return res.status(500).json({ error: 'System configuration missing. Check environment variables.' });
  }

  try {
    // 2. ROBUST BUFFER-FIRST STRATEGY
    // We use a traditional promise to handle the stream to avoid for-await pitfalls
    const fullBodyBuffer: Buffer = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let len = 0;
      const MAX_SIZE = 4.5 * 1024 * 1024;

      req.on('data', (chunk) => {
        len += chunk.length;
        if (len > MAX_SIZE) {
          req.destroy();
          reject(new Error('LIMIT_REACHED'));
        }
        chunks.push(chunk);
      });

      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', (err) => reject(err));
    });

    if (fullBodyBuffer.length === 0) {
      console.warn('[Upload] Received an empty body buffer.');
      return res.status(400).json({ error: 'Empty request body', details: 'Stream yielded no data' });
    }

    // 3. AUTH CHECK (Post-Buffering)
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', details: 'No Authorization header found.' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[Upload] Auth Error:', authError);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        details: authError?.message || 'Invalid session',
        tip: 'Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Vercel Environment Variables.' 
      });
    }

    const userId = user.id;

    // 4. MULTIPART PARSING
    return new Promise((resolve) => {
      const bb = busboy({ 
        headers: req.headers,
        limits: { fileSize: 4.5 * 1024 * 1024 } 
      });

      let fileFound = false;
      let fileBuffer: Buffer | null = null;
      let fileName = '';
      let contentType = '';

      bb.on('file', (name, file, info) => {
        fileFound = true;
        fileName = info.filename;
        contentType = info.mimeType;
        const fileChunks: Buffer[] = [];
        file.on('data', (data) => fileChunks.push(data));
        file.on('end', () => { fileBuffer = Buffer.concat(fileChunks); });
      });

      bb.on('finish', async () => {
        if (!fileFound || !fileBuffer) {
          res.status(400).json({ error: 'No file found in request' });
          return resolve(null);
        }

        try {
          const compressedBuffer = await gzip(fileBuffer);
          
          // UPLOAD TO BLOB
          const blob = await put(fileName, compressedBuffer, {
            access: 'private',
            contentType: contentType,
            token: blobToken
          });

          // PERSIST TO SUPABASE
          const { error: dbError } = await supabase
            .from('documents')
            .insert({
              name: fileName,
              url: blob.url,
              size_original: fileBuffer.length,
              size_compressed: compressedBuffer.length,
              file_type: contentType,
              user_id: userId,
            });

          if (dbError) throw dbError;

          res.status(200).json({
            url: blob.url,
            originalSize: fileBuffer.length,
            compressedSize: compressedBuffer.length,
            savings: Math.round(((fileBuffer.length - compressedBuffer.length) / fileBuffer.length) * 100),
          });
        } catch (err: any) {
          console.error('[Upload] Processing error:', err);
          if (!res.headersSent) res.status(500).json({ error: 'Processing failed', details: err.message });
        } finally {
          resolve(null);
        }
      });

      bb.on('error', (err) => {
        console.error('[Upload] Busboy error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Form parsing failed', details: err.message });
        resolve(null);
      });

      Readable.from(fullBodyBuffer).pipe(bb);
    });
  } catch (error: any) {
    if (error.message === 'LIMIT_REACHED') {
      return res.status(413).json({ error: 'Payload too large. limit is 4.5MB.' });
    }
    console.error('[Upload] Internal Error:', error);
    return res.status(500).json({ error: 'Internal server error during data transfer', details: error.message });
  }
}
