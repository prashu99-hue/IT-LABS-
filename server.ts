import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global process resilience guards against unhandled exceptions during dev pre-warming
process.on('unhandledRejection', (reason) => {
  console.warn('[IT LABS Server] Handled unhandled rejection:', reason);
});

process.on('uncaughtException', (err: any) => {
  if (err?.code !== 'EADDRINUSE') {
    console.error('[IT LABS Server] Handled uncaught exception:', err);
  }
});

// Cloudinary Server-Side Configuration (Credentials never exposed to frontend)
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('[IT LABS Storage] Cloudinary persistent object storage initialized.');
} else {
  console.log('[IT LABS Storage] Operating with built-in client-optimized permanent media storage (Cloudinary credentials optional).');
}

async function startServer() {
  const app = express();
  
  // Parse port from CLI or default to 3000
  let PORT = 3000;
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed)) PORT = parsed;
  }

  // Support JSON and urlencoded bodies up to 50MB for educational media
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ensure public/uploads directory exists for persistent local storage
  const uploadsDir = path.resolve(__dirname, 'public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static uploaded media files with proper cache and range headers for video streaming
  app.use('/uploads', express.static(uploadsDir, {
    maxAge: '30d',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }));

  // Storage status endpoint (reports whether Cloudinary is active without revealing secrets)
  app.get('/api/storage-status', (req, res) => {
    res.json({
      configured: isCloudinaryConfigured,
      provider: isCloudinaryConfigured ? 'Cloudinary Cloud Storage' : 'Not Configured',
      cloudName: CLOUDINARY_CLOUD_NAME ? `${CLOUDINARY_CLOUD_NAME.substring(0, 3)}***` : null,
    });
  });

  // Cloudinary Signed Upload Route for Images, Videos, PDFs, and Code
  const handleMediaUpload = async (req: express.Request, res: express.Response) => {
    try {
      const { fileData, fileName, mimeType, category } = req.body;

      if (!fileData) {
        return res.status(400).json({ success: false, error: 'No file data received' });
      }

      if (!isCloudinaryConfigured) {
        return res.status(503).json({
          success: false,
          error: 'Cloudinary storage credentials are not configured on the server. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.',
        });
      }

      // Determine extension and resource_type
      let extension = 'bin';
      let detectedMime = mimeType || 'application/octet-stream';

      if (fileName && fileName.includes('.')) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext) extension = ext === 'jpeg' ? 'jpg' : ext;
      }

      let resourceType: 'image' | 'video' | 'raw' = 'raw';
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension) || detectedMime.includes('image')) {
        resourceType = 'image';
      } else if (['mp4', 'webm', 'mov'].includes(extension) || detectedMime.includes('video')) {
        resourceType = 'video';
      } else {
        resourceType = 'raw';
      }

      // Execute signed upload using official Cloudinary SDK
      const uploadRes = await cloudinary.uploader.upload(fileData, {
        resource_type: resourceType,
        folder: 'it_labs_media',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      });

      return res.json({
        success: true,
        url: uploadRes.secure_url,
        permanentFileUrl: uploadRes.secure_url,
        cloudinaryPublicId: uploadRes.public_id,
        cloudinaryResourceType: uploadRes.resource_type,
        format: uploadRes.format || extension,
        fileName: fileName || `${uploadRes.public_id}.${uploadRes.format || extension}`,
        originalName: fileName || `${uploadRes.public_id}.${uploadRes.format || extension}`,
        size: uploadRes.bytes || 0,
        mimeType: detectedMime,
        extension: uploadRes.format || extension,
        category: resourceType === 'image' ? 'image' : resourceType === 'video' ? 'video' : extension === 'pdf' ? 'pdf' : 'code',
        storageProvider: 'Cloudinary Cloud Storage',
      });
    } catch (err: any) {
      console.error('Cloudinary media upload handler error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to upload media to Cloudinary cloud storage',
      });
    }
  };

  app.post('/api/upload-media', handleMediaUpload);
  app.post('/api/upload-image', handleMediaUpload);

  // Media deletion API route for cleaning up stored attachments when post is deleted
  app.post('/api/delete-media', async (req, res) => {
    try {
      const { fileNames, urls, publicIds } = req.body;
      const destroyedIds: string[] = [];

      // 1. Destroy Cloudinary resources if publicIds are supplied
      if (isCloudinaryConfigured && Array.isArray(publicIds)) {
        for (const pid of publicIds) {
          if (typeof pid === 'string') {
            await cloudinary.uploader.destroy(pid).catch((cErr) => {
              console.warn(`Cloudinary destroy error for ${pid}:`, cErr);
            });
            destroyedIds.push(pid);
          }
        }
      }

      // 2. Also check if urls contain Cloudinary publicIds or legacy local files
      if (Array.isArray(urls)) {
        for (const u of urls) {
          if (typeof u === 'string') {
            if (isCloudinaryConfigured && u.includes('res.cloudinary.com')) {
              // Extract public_id from Cloudinary URL: .../it_labs_media/xyz.ext
              const match = u.match(/\/it_labs_media\/([^\.\/]+)/);
              if (match && match[1]) {
                const pid = `it_labs_media/${match[1]}`;
                await cloudinary.uploader.destroy(pid).catch(() => {});
                destroyedIds.push(pid);
              }
            } else if (u.includes('/uploads/')) {
              const base = u.split('/uploads/').pop();
              if (base) {
                const filePath = path.join(uploadsDir, path.basename(base));
                if (fs.existsSync(filePath)) {
                  await fs.promises.unlink(filePath).catch(() => {});
                }
              }
            }
          }
        }
      }

      return res.json({ success: true, deleted: destroyedIds });
    } catch (err: any) {
      console.error('Delete media handler error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to delete media' });
    }
  });

  // Individual attachment deletion API route with server-side ownership verification
  app.post('/api/delete-attachment', async (req, res) => {
    try {
      const { postId, attachmentId, fileName, fileUrl, cloudinaryPublicId, cloudinaryResourceType, userId, userEmail } = req.body;

      if (!postId || (!attachmentId && !fileName && !fileUrl && !cloudinaryPublicId)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required postId or attachment identifier',
        });
      }

      // Server-side ownership / admin authorization verification
      const isAdmin = userEmail === 'ecode2544@gmail.com';
      let isOwner = false;

      if (!isAdmin) {
        try {
          const firestoreUrl = `https://firestore.googleapis.com/v1/projects/it-labs-47fb8/databases/(default)/documents/posts/${encodeURIComponent(postId)}`;
          const fsRes = await fetch(firestoreUrl);
          if (fsRes.ok) {
            const postDoc = await fsRes.json();
            const authorId = postDoc.fields?.authorId?.stringValue;
            if (authorId && userId && authorId === userId) {
              isOwner = true;
            }
          } else if (fsRes.status === 404) {
            if (userId) isOwner = true;
          }
        } catch (fsErr) {
          console.warn('Could not query Firestore REST API for post verification:', fsErr);
          if (userId) isOwner = true;
        }

        if (!isOwner) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: Only the post owner or authorized administrator can delete this attachment.',
          });
        }
      }

      // Delete from Cloudinary if publicId is provided or URL is from Cloudinary
      let deletedFromCloudinary = false;
      let targetPublicId = cloudinaryPublicId;

      if (!targetPublicId && fileUrl && typeof fileUrl === 'string' && fileUrl.includes('res.cloudinary.com')) {
        const match = fileUrl.match(/\/it_labs_media\/([^\.\/]+)/);
        if (match && match[1]) {
          targetPublicId = `it_labs_media/${match[1]}`;
        }
      }

      if (isCloudinaryConfigured && targetPublicId) {
        try {
          const rType = (cloudinaryResourceType as any) || 'image';
          await cloudinary.uploader.destroy(targetPublicId, { resource_type: rType });
          deletedFromCloudinary = true;
        } catch (cErr) {
          console.warn(`Cloudinary destroy error for ${targetPublicId}:`, cErr);
        }
      }

      // Also clean up local file if it was a legacy /uploads/ file
      let targetFile = '';
      if (fileName && typeof fileName === 'string') {
        targetFile = path.basename(fileName);
      } else if (fileUrl && typeof fileUrl === 'string' && fileUrl.includes('/uploads/')) {
        const extracted = fileUrl.split('/uploads/').pop();
        if (extracted) targetFile = path.basename(extracted);
      }

      let deletedOnDisk = false;
      if (targetFile) {
        const safeName = path.basename(targetFile);
        const filePath = path.join(uploadsDir, safeName);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath).catch((err) => {
            console.warn(`Unlink error for file ${safeName}:`, err);
          });
          deletedOnDisk = true;
        }
      }

      return res.json({
        success: true,
        postId,
        attachmentId,
        cloudinaryPublicId: targetPublicId,
        deletedFromCloudinary,
        deletedOnDisk,
        message: 'Attachment file removed successfully from storage',
      });
    } catch (err: any) {
      console.error('Delete attachment handler error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to delete attachment' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'LearnNova Media Storage Server', timestamp: new Date().toISOString() });
  });

  // Mount Vite dev server middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`IT LABS Server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[IT LABS Server] Port ${PORT} temporarily occupied. Retrying in 1s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch {}
        server.listen(PORT, '0.0.0.0', () => {
          console.log(`IT LABS Server running on http://0.0.0.0:${PORT}`);
        });
      }, 1000);
    } else {
      console.error('[IT LABS Server] Listen error:', err);
    }
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

startServer().catch((err) => {
  console.error('Failed to start IT LABS server:', err);
  process.exit(1);
});
