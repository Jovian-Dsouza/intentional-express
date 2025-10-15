import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MediaUploadService } from './media-upload.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock sharp
jest.mock('sharp', () => {
  return jest.fn().mockReturnValue({
    metadata: jest.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'jpeg',
    }),
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumbnail')),
  });
});

describe('MediaUploadService', () => {
  let service: MediaUploadService;

  beforeEach(() => {
    service = new MediaUploadService({
      pinataApiKey: 'test_key',
      pinataSecret: 'test_secret',
    });
    jest.clearAllMocks();
  });

  describe('validateURL', () => {
    it('should accept valid HTTP URL', () => {
      expect(() => service.validateURL('http://example.com/image.jpg', 'image')).not.toThrow();
    });

    it('should accept valid HTTPS URL', () => {
      expect(() => service.validateURL('https://example.com/image.jpg', 'image')).not.toThrow();
    });

    it('should reject non-HTTP(S) protocols', () => {
      expect(() => service.validateURL('ftp://example.com/image.jpg', 'image')).toThrow(
        'Only HTTP/HTTPS URLs are allowed'
      );
    });

    it('should reject localhost URLs', () => {
      expect(() => service.validateURL('http://localhost/image.jpg', 'image')).toThrow(
        'Private/internal URLs are not allowed'
      );
    });

    it('should reject 127.0.0.1', () => {
      expect(() => service.validateURL('http://127.0.0.1/image.jpg', 'image')).toThrow(
        'Private/internal URLs are not allowed'
      );
    });

    it('should reject private IPs (10.x.x.x)', () => {
      expect(() => service.validateURL('http://10.0.0.1/image.jpg', 'image')).toThrow(
        'Private/internal URLs are not allowed'
      );
    });

    it('should reject private IPs (192.168.x.x)', () => {
      expect(() => service.validateURL('http://192.168.1.1/image.jpg', 'image')).toThrow(
        'Private/internal URLs are not allowed'
      );
    });
  });

  describe('fetchMediaFromURL', () => {
    it('should fetch image from valid URL', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      mockedAxios.get.mockResolvedValue({
        data: mockImageBuffer,
        headers: { 'content-type': 'image/jpeg' },
      });

      const result = await service.fetchMediaFromURL(
        'https://example.com/image.jpg',
        'image'
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        expect.objectContaining({
          responseType: 'arraybuffer',
          timeout: 10000,
          maxContentLength: 5 * 1024 * 1024,
        })
      );
    });

    it('should fetch video with longer timeout', async () => {
      const mockVideoBuffer = Buffer.from('fake-video-data');
      mockedAxios.get.mockResolvedValue({
        data: mockVideoBuffer,
        headers: { 'content-type': 'video/mp4' },
      });

      await service.fetchMediaFromURL('https://example.com/video.mp4', 'video');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.com/video.mp4',
        expect.objectContaining({
          timeout: 30000,
          maxContentLength: 50 * 1024 * 1024,
        })
      );
    });

    it('should reject invalid content type for image', async () => {
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from('data'),
        headers: { 'content-type': 'text/html' },
      });

      await expect(
        service.fetchMediaFromURL('https://example.com/image.jpg', 'image')
      ).rejects.toThrow('Invalid image content type');
    });

    it('should reject invalid content type for video', async () => {
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from('data'),
        headers: { 'content-type': 'application/octet-stream' },
      });

      await expect(
        service.fetchMediaFromURL('https://example.com/video.mp4', 'video')
      ).rejects.toThrow('Invalid video content type');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout');
      (timeoutError as any).code = 'ECONNABORTED';
      mockedAxios.get.mockRejectedValue(timeoutError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(
        service.fetchMediaFromURL('https://example.com/image.jpg', 'image')
      ).rejects.toThrow('image URL fetch timed out');
    });

    it('should handle 404 errors', async () => {
      const error404 = {
        response: { status: 404 },
        isAxiosError: true,
      };
      mockedAxios.get.mockRejectedValue(error404);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(
        service.fetchMediaFromURL('https://example.com/image.jpg', 'image')
      ).rejects.toThrow('image not found at URL');
    });

    it('should handle 403 errors', async () => {
      const error403 = {
        response: { status: 403 },
        isAxiosError: true,
      };
      mockedAxios.get.mockRejectedValue(error403);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(
        service.fetchMediaFromURL('https://example.com/image.jpg', 'image')
      ).rejects.toThrow('image URL access forbidden');
    });
  });

  describe('validateImageIntegrity', () => {
    it('should validate valid image', async () => {
      const buffer = Buffer.from('valid-image');
      await expect(service.validateImageIntegrity(buffer)).resolves.not.toThrow();
    });

    it('should reject images below minimum dimensions', async () => {
      // Mock sharp to return small dimensions
      const sharp = require('sharp');
      sharp.mockReturnValueOnce({
        metadata: jest.fn().mockResolvedValue({
          width: 50,
          height: 50,
        }),
      });

      const buffer = Buffer.from('small-image');
      await expect(service.validateImageIntegrity(buffer)).rejects.toThrow(
        'Image dimensions too small'
      );
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail with correct dimensions', async () => {
      const buffer = Buffer.from('image-data');
      const thumbnail = await service.generateThumbnail(buffer);

      expect(thumbnail).toBeInstanceOf(Buffer);
      expect(thumbnail.toString()).toBe('thumbnail');
    });
  });

  describe('uploadToIPFS', () => {
    it('should upload buffer to IPFS and return hash', async () => {
      const mockHash = 'QmTest123abc';
      // Mock the pinata upload (will be implemented when we add pinata)
      jest.spyOn(service as any, 'uploadToPinata').mockResolvedValue(mockHash);

      const buffer = Buffer.from('test-data');
      const hash = await service.uploadToIPFS(buffer, 'test.jpg');

      expect(hash).toBe(mockHash);
    });
  });

  describe('uploadMedia', () => {
    it('should upload single image', async () => {
      const mockImageBuffer = Buffer.from('image-data');
      mockedAxios.get.mockResolvedValue({
        data: mockImageBuffer,
        headers: { 'content-type': 'image/jpeg' },
      });

      jest.spyOn(service as any, 'uploadToPinata')
        .mockResolvedValueOnce('QmImage123')
        .mockResolvedValueOnce('QmThumb123');

      const result = await service.uploadMedia({
        images: [{ url: 'https://example.com/image.jpg', mimeType: 'image/jpeg' }],
      });

      expect(result.images).toHaveLength(1);
      expect(result.images[0].ipfsHash).toBe('QmImage123');
      expect(result.images[0].thumbnail).toBe('ipfs://QmThumb123');
    });

    it('should upload multiple images in parallel', async () => {
      const mockImageBuffer = Buffer.from('image-data');
      mockedAxios.get.mockResolvedValue({
        data: mockImageBuffer,
        headers: { 'content-type': 'image/jpeg' },
      });

      jest.spyOn(service as any, 'uploadToPinata')
        .mockResolvedValue('QmHash');

      const result = await service.uploadMedia({
        images: [
          { url: 'https://example.com/image1.jpg', mimeType: 'image/jpeg' },
          { url: 'https://example.com/image2.jpg', mimeType: 'image/jpeg' },
          { url: 'https://example.com/image3.jpg', mimeType: 'image/jpeg' },
        ],
      });

      expect(result.images).toHaveLength(3);
    });

    it('should reject more than 3 images', async () => {
      await expect(
        service.uploadMedia({
          images: [
            { url: 'https://example.com/1.jpg', mimeType: 'image/jpeg' },
            { url: 'https://example.com/2.jpg', mimeType: 'image/jpeg' },
            { url: 'https://example.com/3.jpg', mimeType: 'image/jpeg' },
            { url: 'https://example.com/4.jpg', mimeType: 'image/jpeg' },
          ],
        })
      ).rejects.toThrow('Maximum 3 images allowed');
    });

    it('should upload image and video together', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('video')) {
          return Promise.resolve({
            data: Buffer.from('video-data'),
            headers: { 'content-type': 'video/mp4' },
          });
        }
        return Promise.resolve({
          data: Buffer.from('image-data'),
          headers: { 'content-type': 'image/jpeg' },
        });
      });

      jest.spyOn(service as any, 'uploadToPinata')
        .mockResolvedValue('QmHash');

      const result = await service.uploadMedia({
        images: [{ url: 'https://example.com/image.jpg', mimeType: 'image/jpeg' }],
        video: { url: 'https://example.com/video.mp4', mimeType: 'video/mp4' },
      });

      expect(result.images).toHaveLength(1);
      expect(result.video).toBeDefined();
      expect(result.video?.ipfsHash).toBe('QmHash');
    });
  });
});
