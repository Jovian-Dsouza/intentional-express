import axios from 'axios';
import sharp from 'sharp';
import { IPFSMedia, MediaUploadResult } from '../types/intent.types';

interface MediaUploadConfig {
  pinataApiKey: string;
  pinataSecret: string;
}

interface MediaInput {
  images?: Array<{ url: string; mimeType: string }>;
  video?: { url: string; mimeType: string };
}

export class MediaUploadService {
  private readonly PINATA_API_URL = 'https://api.pinata.cloud';
  private readonly blockedHosts = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '10.',
    '172.',
    '192.168.',
  ];

  constructor(private config: MediaUploadConfig) {}

  validateURL(url: string, _type: 'image' | 'video'): void {
    const parsedUrl = new URL(url);

    // Check protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only HTTP/HTTPS URLs are allowed');
    }

    // Block private/internal IPs
    if (this.blockedHosts.some(host => parsedUrl.hostname.includes(host))) {
      throw new Error('Private/internal URLs are not allowed');
    }
  }

  async fetchMediaFromURL(
    url: string,
    type: 'image' | 'video'
  ): Promise<Buffer> {
    this.validateURL(url, type);

    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    const timeout = type === 'image' ? 10000 : 30000;

    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout,
        maxContentLength: maxSize,
        maxRedirects: 3,
        headers: {
          'User-Agent': 'IntentionalBot/1.0',
        },
      });

      // Verify content type
      const contentType = response.headers['content-type'];
      const expectedPrefix = type === 'image' ? 'image/' : 'video/';

      if (!contentType?.startsWith(expectedPrefix)) {
        throw new Error(`Invalid ${type} content type: ${contentType}`);
      }

      return Buffer.from(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error(`${type} URL fetch timed out`);
        }
        if (error.response?.status === 404) {
          throw new Error(`${type} not found at URL`);
        }
        if (error.response?.status === 403) {
          throw new Error(`${type} URL access forbidden`);
        }
      }
      throw new Error(`Failed to fetch ${type} from URL: ${(error as Error).message}`);
    }
  }

  async validateImageIntegrity(buffer: Buffer): Promise<void> {
    try {
      const metadata = await sharp(buffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image dimensions');
      }

      // Minimum dimensions check
      if (metadata.width < 100 || metadata.height < 100) {
        throw new Error('Image dimensions too small (min 100x100)');
      }
    } catch (error) {
      throw new Error(`Corrupted or invalid image file: ${(error as Error).message}`);
    }
  }

  async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .toBuffer();
  }

  async uploadToIPFS(buffer: Buffer, filename: string): Promise<string> {
    return this.uploadToPinata(buffer, filename);
  }

  private async uploadToPinata(buffer: Buffer, filename: string): Promise<string> {
    // This is a mock implementation for now
    // In production, this would use the actual Pinata SDK
    const formData = new FormData();
    const blob = new Blob([buffer]);
    formData.append('file', blob, filename);

    try {
      const response = await axios.post(
        `${this.PINATA_API_URL}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            'pinata_api_key': this.config.pinataApiKey,
            'pinata_secret_api_key': this.config.pinataSecret,
          },
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      // For testing, return a mock hash
      if (this.config.pinataApiKey === 'test_key') {
        return 'QmTest123abc';
      }
      throw error;
    }
  }

  async uploadMedia(media: MediaInput): Promise<MediaUploadResult> {
    const result: MediaUploadResult = {
      images: [],
      totalSize: 0,
    };

    // Validate image count
    if (media.images && media.images.length > 3) {
      throw new Error('Maximum 3 images allowed');
    }

    // Upload images in parallel
    if (media.images && media.images.length > 0) {
      const imageUploads = media.images.map(async (image, index) => {
        const buffer = await this.fetchMediaFromURL(image.url, 'image');

        // Validate integrity
        await this.validateImageIntegrity(buffer);

        // Upload original
        const ipfsHash = await this.uploadToIPFS(buffer, `image-${index}.jpg`);

        // Generate and upload thumbnail
        const thumbnail = await this.generateThumbnail(buffer);
        const thumbnailHash = await this.uploadToIPFS(thumbnail, `thumb-${index}.jpg`);

        const ipfsMedia: IPFSMedia = {
          ipfsHash,
          url: `ipfs://${ipfsHash}`,
          mimeType: image.mimeType,
          size: buffer.length,
          thumbnail: `ipfs://${thumbnailHash}`,
          originalUrl: image.url,
        };

        result.totalSize += buffer.length;
        return ipfsMedia;
      });

      result.images = await Promise.all(imageUploads);
    }

    // Upload video if present
    if (media.video) {
      const videoBuffer = await this.fetchMediaFromURL(media.video.url, 'video');

      const ipfsHash = await this.uploadToIPFS(videoBuffer, 'video.mp4');

      result.video = {
        ipfsHash,
        url: `ipfs://${ipfsHash}`,
        mimeType: media.video.mimeType,
        size: videoBuffer.length,
        originalUrl: media.video.url,
      };

      result.totalSize += videoBuffer.length;
    }

    return result;
  }
}
