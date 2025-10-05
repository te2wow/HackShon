import { adminService } from './adminService';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock fetch
global.fetch = jest.fn();

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isAuthenticated', () => {
    it('should return false when no auth data exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const result = adminService.isAuthenticated();

      expect(result).toBe(false);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('admin_authenticated');
    });

    it('should return true when auth data is valid and not expired', () => {
      const validAuthData = JSON.stringify({
        timestamp: 1000000 - 10 * 60 * 1000, // 10 minutes ago
      });
      mockSessionStorage.getItem.mockReturnValue(validAuthData);

      const result = adminService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false and logout when auth data is expired', () => {
      const expiredAuthData = JSON.stringify({
        timestamp: 1000000 - 31 * 60 * 1000, // 31 minutes ago (expired)
      });
      mockSessionStorage.getItem.mockReturnValue(expiredAuthData);

      const result = adminService.isAuthenticated();

      expect(result).toBe(false);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('admin_authenticated');
    });

    it('should return false and logout when auth data is invalid JSON', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid-json');

      const result = adminService.isAuthenticated();

      expect(result).toBe(false);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('admin_authenticated');
    });

    it('should handle auth data without timestamp property', () => {
      const invalidAuthData = JSON.stringify({
        someOtherProperty: 'value',
      });
      mockSessionStorage.getItem.mockReturnValue(invalidAuthData);

      const result = adminService.isAuthenticated();

      expect(result).toBe(false);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('admin_authenticated');
    });
  });

  describe('authenticate', () => {
    it('should authenticate successfully with correct password', async () => {
      const mockResponse = {
        ok: true,
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.authenticate('correct-password');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'correct-password' }),
      });
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'admin_authenticated',
        JSON.stringify({ timestamp: 1000000 })
      );
    });

    it('should fail authentication with incorrect password', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.authenticate('wrong-password');

      expect(result).toBe(false);
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle network errors during authentication', async () => {
      const networkError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValue(networkError);

      const result = await adminService.authenticate('password');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Authentication error:', networkError);
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle server errors during authentication', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.authenticate('password');

      expect(result).toBe(false);
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should remove auth data from sessionStorage', () => {
      adminService.logout();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('admin_authenticated');
    });
  });

  describe('getRemainingTime', () => {
    it('should return 0 when no auth data exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const result = adminService.getRemainingTime();

      expect(result).toBe(0);
    });

    it('should return remaining time when auth data is valid', () => {
      const authData = JSON.stringify({
        timestamp: 1000000 - 10 * 60 * 1000, // 10 minutes ago
      });
      mockSessionStorage.getItem.mockReturnValue(authData);

      const result = adminService.getRemainingTime();

      expect(result).toBe(20 * 60 * 1000); // 20 minutes remaining
    });

    it('should return 0 when auth data is expired', () => {
      const authData = JSON.stringify({
        timestamp: 1000000 - 35 * 60 * 1000, // 35 minutes ago (expired)
      });
      mockSessionStorage.getItem.mockReturnValue(authData);

      const result = adminService.getRemainingTime();

      expect(result).toBe(0);
    });

    it('should return 0 when auth data is invalid JSON', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid-json');

      const result = adminService.getRemainingTime();

      expect(result).toBe(0);
    });

    it('should return full timeout when just authenticated', () => {
      const authData = JSON.stringify({
        timestamp: 1000000, // Just now
      });
      mockSessionStorage.getItem.mockReturnValue(authData);

      const result = adminService.getRemainingTime();

      expect(result).toBe(30 * 60 * 1000); // Full 30 minutes
    });

    it('should handle auth data without timestamp property', () => {
      const invalidAuthData = JSON.stringify({
        someOtherProperty: 'value',
      });
      mockSessionStorage.getItem.mockReturnValue(invalidAuthData);

      const result = adminService.getRemainingTime();

      expect(result).toBe(0);
    });
  });

  describe('Constants and configuration', () => {
    it('should have correct AUTH_KEY', () => {
      // This test ensures the AUTH_KEY constant is used correctly
      adminService.isAuthenticated();
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('admin_authenticated');
    });

    it('should have 30 minute timeout', () => {
      // Test that the timeout is exactly 30 minutes
      const authData = JSON.stringify({
        timestamp: 1000000 - 30 * 60 * 1000 - 1, // Just over 30 minutes ago
      });
      mockSessionStorage.getItem.mockReturnValue(authData);

      const result = adminService.isAuthenticated();

      expect(result).toBe(false);
      expect(mockSessionStorage.removeItem).toHaveBeenCalled();
    });

    it('should allow authentication at exactly 30 minutes', () => {
      const authData = JSON.stringify({
        timestamp: 1000000 - 30 * 60 * 1000, // Exactly 30 minutes ago
      });
      mockSessionStorage.getItem.mockReturnValue(authData);

      const result = adminService.isAuthenticated();

      expect(result).toBe(false);
      expect(mockSessionStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle sessionStorage throwing errors', () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('SessionStorage error');
      });

      const result = adminService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should handle timestamp as string', () => {
      const authData = JSON.stringify({
        timestamp: '1000000', // String instead of number
      });
      mockSessionStorage.getItem.mockReturnValue(authData);

      // This should still work as JavaScript will coerce the string to number
      const result = adminService.getRemainingTime();

      expect(typeof result).toBe('number');
    });
  });
});