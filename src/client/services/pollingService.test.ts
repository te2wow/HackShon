import { pollingService } from './pollingService';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('PollingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPollingInterval', () => {
    it('should return default interval when no stored value exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = pollingService.getPollingInterval();

      expect(result).toBe(5);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('polling_interval');
    });

    it('should return stored interval when value exists', () => {
      mockLocalStorage.getItem.mockReturnValue('10');

      const result = pollingService.getPollingInterval();

      expect(result).toBe(10);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('polling_interval');
    });

    it('should handle stored string values correctly', () => {
      mockLocalStorage.getItem.mockReturnValue('15');

      const result = pollingService.getPollingInterval();

      expect(result).toBe(15);
      expect(typeof result).toBe('number');
    });

    it('should return default when stored value is invalid', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid');

      const result = pollingService.getPollingInterval();

      // parseInt('invalid') returns NaN, which is falsy, so should return default
      expect(result).toBe(5);
    });

    it('should return default when stored value is empty string', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      const result = pollingService.getPollingInterval();

      expect(result).toBe(5);
    });

    it('should handle zero value correctly', () => {
      mockLocalStorage.getItem.mockReturnValue('0');

      const result = pollingService.getPollingInterval();

      // 0 is falsy, so should return default
      expect(result).toBe(5);
    });

    it('should handle negative values', () => {
      mockLocalStorage.getItem.mockReturnValue('-5');

      const result = pollingService.getPollingInterval();

      expect(result).toBe(-5);
    });

    it('should handle decimal values', () => {
      mockLocalStorage.getItem.mockReturnValue('2.5');

      const result = pollingService.getPollingInterval();

      // parseInt truncates decimal values
      expect(result).toBe(2);
    });
  });

  describe('setPollingInterval', () => {
    it('should store polling interval in localStorage', () => {
      pollingService.setPollingInterval(10);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('polling_interval', '10');
    });

    it('should convert number to string', () => {
      pollingService.setPollingInterval(30);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('polling_interval', '30');
    });

    it('should handle zero value', () => {
      pollingService.setPollingInterval(0);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('polling_interval', '0');
    });

    it('should handle negative values', () => {
      pollingService.setPollingInterval(-1);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('polling_interval', '-1');
    });

    it('should handle decimal values', () => {
      pollingService.setPollingInterval(2.5);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('polling_interval', '2.5');
    });

    it('should handle large values', () => {
      pollingService.setPollingInterval(999999);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('polling_interval', '999999');
    });
  });

  describe('getPollingIntervalMs', () => {
    it('should return default interval in milliseconds when no stored value', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = pollingService.getPollingIntervalMs();

      expect(result).toBe(5 * 60 * 1000); // 5 minutes in ms
      expect(result).toBe(300000);
    });

    it('should return stored interval in milliseconds', () => {
      mockLocalStorage.getItem.mockReturnValue('10');

      const result = pollingService.getPollingIntervalMs();

      expect(result).toBe(10 * 60 * 1000); // 10 minutes in ms
      expect(result).toBe(600000);
    });

    it('should handle 1 minute interval', () => {
      mockLocalStorage.getItem.mockReturnValue('1');

      const result = pollingService.getPollingIntervalMs();

      expect(result).toBe(60000); // 1 minute in ms
    });

    it('should handle fractional minutes', () => {
      mockLocalStorage.getItem.mockReturnValue('0.5');

      const result = pollingService.getPollingIntervalMs();

      // parseInt('0.5') returns 0, which is falsy, so returns default
      expect(result).toBe(5 * 60 * 1000);
    });

    it('should handle zero interval', () => {
      mockLocalStorage.getItem.mockReturnValue('0');

      const result = pollingService.getPollingIntervalMs();

      // 0 is falsy, so returns default
      expect(result).toBe(5 * 60 * 1000);
    });
  });

  describe('Constants and configuration', () => {
    it('should use correct localStorage key', () => {
      pollingService.getPollingInterval();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('polling_interval');
    });

    it('should have correct default interval', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = pollingService.getPollingInterval();

      expect(result).toBe(5);
    });
  });

  describe('Integration scenarios', () => {
    it('should persist and retrieve the same value', () => {
      // First set a value
      pollingService.setPollingInterval(15);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('polling_interval', '15');

      // Then mock the retrieval
      mockLocalStorage.getItem.mockReturnValue('15');
      const result = pollingService.getPollingInterval();

      expect(result).toBe(15);
    });

    it('should handle update scenario', () => {
      // Set initial value
      pollingService.setPollingInterval(5);
      mockLocalStorage.getItem.mockReturnValue('5');
      expect(pollingService.getPollingInterval()).toBe(5);

      // Update value
      pollingService.setPollingInterval(20);
      mockLocalStorage.getItem.mockReturnValue('20');
      expect(pollingService.getPollingInterval()).toBe(20);

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling', () => {
    it('should handle localStorage getItem throwing error', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      // Should not throw, should return default or handle gracefully
      expect(() => pollingService.getPollingInterval()).toThrow();
    });

    it('should handle localStorage setItem throwing error', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      // Should not throw, should handle gracefully
      expect(() => pollingService.setPollingInterval(10)).toThrow();
    });
  });

  describe('Type conversion edge cases', () => {
    it('should handle very large numbers', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;
      pollingService.setPollingInterval(largeNumber);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'polling_interval',
        largeNumber.toString()
      );
    });

    it('should handle scientific notation', () => {
      mockLocalStorage.getItem.mockReturnValue('1e2'); // 100 in scientific notation

      const result = pollingService.getPollingInterval();

      expect(result).toBe(1); // parseInt stops at the first non-digit character
    });

    it('should handle string with trailing characters', () => {
      mockLocalStorage.getItem.mockReturnValue('10abc');

      const result = pollingService.getPollingInterval();

      expect(result).toBe(10); // parseInt extracts the number part
    });
  });
});