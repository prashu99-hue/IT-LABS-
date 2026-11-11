import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryConfigStatus {
  isConfigured: boolean;
  cloudName: string | null;
  maskedApiKey: string | null;
  hasSecret: boolean;
  missingFields: string[];
}

export interface ValidatedCloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Safely masks a sensitive credential string (e.g. API keys or secrets)
 * so it can be logged in diagnostic messages without leaking the actual secret.
 *
 * Example: "1234567890" -> "123...90"
 */
export function maskCredential(val: string | undefined | null, visibleHead = 3, visibleTail = 2): string | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length <= visibleHead + visibleTail) {
    return '***';
  }
  return `${trimmed.substring(0, visibleHead)}***${trimmed.slice(-visibleTail)}`;
}

/**
 * Validates and retrieves Cloudinary credentials from Node.js server environment variables.
 *
 * CRITICAL SECURITY RULES:
 * 1. CLOUDINARY_API_SECRET must never be prefixed with VITE_ (which would bundle it into frontend JS).
 * 2. Only accessed on the Node.js backend.
 * 3. Returns null if any of the three required credentials are missing or blank.
 */
export function getCloudinaryConfig(): ValidatedCloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
  };
}

/**
 * Returns a diagnostic status report of the Cloudinary configuration
 * without exposing the private API secret.
 */
export function getCloudinaryStatus(): CloudinaryConfigStatus {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';

  const missingFields: string[] = [];
  if (!cloudName) missingFields.push('CLOUDINARY_CLOUD_NAME');
  if (!apiKey) missingFields.push('CLOUDINARY_API_KEY');
  if (!apiSecret) missingFields.push('CLOUDINARY_API_SECRET');

  return {
    isConfigured: missingFields.length === 0,
    cloudName: cloudName || null,
    maskedApiKey: maskCredential(apiKey),
    hasSecret: Boolean(apiSecret),
    missingFields,
  };
}

/**
 * Configures the Cloudinary v2 SDK using validated server-side environment variables.
 * Enforces secure HTTPS URLs for all uploaded media assets.
 */
export function configureCloudinary(): {
  isConfigured: boolean;
  client: typeof cloudinary;
  status: CloudinaryConfigStatus;
} {
  const config = getCloudinaryConfig();
  const status = getCloudinaryStatus();

  if (config) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true, // Guarantees all returned URLs use HTTPS
    });

    console.log(
      `[Storage Security] Cloudinary initialized securely (Cloud: "${config.cloudName}", API Key: "${status.maskedApiKey}", API Secret: [PROTECTED]).`
    );
  } else {
    console.log(
      `[Storage Security] Cloudinary credentials not fully configured (Missing: ${status.missingFields.join(', ') || 'None'}). Operating with built-in persistent local storage (/uploads).`
    );
  }

  return {
    isConfigured: status.isConfigured,
    client: cloudinary,
    status,
  };
}
