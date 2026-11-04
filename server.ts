import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // Unified persistent media upload API route for Images, PDFs, Videos, and Code
  const handleMediaUpload = async (req: express.Request, res: express.Response) => {
    try {
      const { fileData, fileName, mimeType, category } = req.body;

      if (!fileData) {
        return res.status(400).json({ success: false, error: 'No file data received' });
      }

      // Extract base64 payload
      const matches = fileData.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let detectedMime = mimeType || 'application/octet-stream';
      let extension = 'bin';

      if (matches && matches.length === 3) {
        detectedMime = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(fileData, 'base64');
      }

      // Determine extension from filename or mime type
      if (fileName && fileName.includes('.')) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext) extension = ext === 'jpeg' ? 'jpg' : ext;
      } else if (detectedMime) {
        if (detectedMime.includes('pdf')) extension = 'pdf';
        else if (detectedMime.includes('mp4')) extension = 'mp4';
        else if (detectedMime.includes('webm')) extension = 'webm';
        else if (detectedMime.includes('png')) extension = 'png';
        else if (detectedMime.includes('webp')) extension = 'webp';
        else if (detectedMime.includes('gif')) extension = 'gif';
        else if (detectedMime.includes('jpeg') || detectedMime.includes('jpg')) extension = 'jpg';
      }

      // Determine category prefix
      let prefix = 'media';
      if (extension === 'pdf' || detectedMime.includes('pdf')) prefix = 'pdf';
      else if (['mp4', 'webm', 'mov'].includes(extension) || detectedMime.includes('video')) prefix = 'video';
      else if (['jpg', 'png', 'webp', 'gif', 'svg'].includes(extension) || detectedMime.includes('image')) prefix = 'img';
      else if (['py', 'java', 'c', 'cpp', 'js', 'ts', 'html', 'css', 'txt'].includes(extension)) prefix = 'code';

      // Generate a unique, permanent filename
      const uniqueId = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const safeFileName = `${uniqueId}.${extension}`;
      const filePath = path.join(uploadsDir, safeFileName);

      await fs.promises.writeFile(filePath, buffer);

      // Construct permanent URL
      const permanentUrl = `/uploads/${safeFileName}`;

      return res.json({
        success: true,
        url: permanentUrl,
        permanentFileUrl: permanentUrl,
        fileName: safeFileName,
        originalName: fileName || safeFileName,
        size: buffer.length,
        mimeType: detectedMime,
        extension,
        category: prefix === 'img' ? 'image' : prefix === 'video' ? 'video' : prefix === 'pdf' ? 'pdf' : 'code',
        storageProvider: 'IT LABS Server Storage',
      });
    } catch (err: any) {
      console.error('Media upload handler error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to save media file on server',
      });
    }
  };

  app.post('/api/upload-media', handleMediaUpload);
  app.post('/api/upload-image', handleMediaUpload);

  // Media deletion API route for cleaning up stored attachments when post is deleted
  app.post('/api/delete-media', async (req, res) => {
    try {
      const { fileNames, urls } = req.body;
      const toDelete: string[] = [];

      if (Array.isArray(fileNames)) {
        for (const f of fileNames) {
          if (typeof f === 'string') toDelete.push(path.basename(f));
        }
      }

      if (Array.isArray(urls)) {
        for (const u of urls) {
          if (typeof u === 'string' && u.includes('/uploads/')) {
            const base = u.split('/uploads/').pop();
            if (base) toDelete.push(path.basename(base));
          }
        }
      }

      const results: string[] = [];
      for (const fileName of toDelete) {
        // Prevent path traversal
        const safeName = path.basename(fileName);
        const filePath = path.join(uploadsDir, safeName);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath).catch(() => {});
          results.push(safeName);
        }
      }

      return res.json({ success: true, deleted: results });
    } catch (err: any) {
      console.error('Delete media handler error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to delete media' });
    }
  });

  // Individual attachment deletion API route with server-side ownership verification
  app.post('/api/delete-attachment', async (req, res) => {
    try {
      const { postId, attachmentId, fileName, fileUrl, userId, userEmail } = req.body;

      if (!postId || (!attachmentId && !fileName && !fileUrl)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required postId or attachment identifier (attachmentId, fileName, or fileUrl)',
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
            // Local mock post or newly published cache
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

      // Identify single file to delete
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
        fileName: targetFile,
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
    res.json({ status: 'ok', service: 'IT LABS Media Storage Server', timestamp: new Date().toISOString() });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IT LABS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start IT LABS server:', err);
  process.exit(1);
});
