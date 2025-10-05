import { verifyRepository, fetchRepositoryLanguages } from './githubService.js';
import { Octokit } from 'octokit';

jest.mock('octokit');

const mockOctokit = {
  rest: {
    repos: {
      get: jest.fn(),
      listLanguages: jest.fn(),
    },
  },
};

(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit as any);

describe('GitHub Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('verifyRepository', () => {
    it('should verify a valid public repository', async () => {
      const mockRepo = {
        data: {
          id: 123,
          name: 'test-repo',
          owner: { login: 'test-owner' },
          private: false,
        },
      };

      const mockLanguages = {
        data: {
          TypeScript: 1000,
          JavaScript: 500,
        },
      };

      mockOctokit.rest.repos.get.mockResolvedValue(mockRepo);
      mockOctokit.rest.repos.listLanguages.mockResolvedValue(mockLanguages);

      const result = await verifyRepository('test-owner', 'test-repo');

      expect(result).toEqual({ valid: true });
      expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
      });
      expect(mockOctokit.rest.repos.listLanguages).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
      });
    });

    it('should reject private repositories', async () => {
      const mockRepo = {
        data: {
          id: 123,
          name: 'private-repo',
          owner: { login: 'test-owner' },
          private: true,
        },
      };

      mockOctokit.rest.repos.get.mockResolvedValue(mockRepo);

      const result = await verifyRepository('test-owner', 'private-repo');

      expect(result).toEqual({
        valid: false,
        error: 'Private repositories are not supported',
      });
    });

    it('should handle repository not found error', async () => {
      const error = new Error('Not Found');
      (error as any).status = 404;

      mockOctokit.rest.repos.get.mockRejectedValue(error);

      const result = await verifyRepository('test-owner', 'nonexistent-repo');

      expect(result).toEqual({
        valid: false,
        error: 'Repository not found',
      });
    });

    it('should handle API rate limit error', async () => {
      const error = new Error('API rate limit exceeded');
      (error as any).status = 403;

      mockOctokit.rest.repos.get.mockRejectedValue(error);

      const result = await verifyRepository('test-owner', 'test-repo');

      expect(result).toEqual({
        valid: false,
        error: 'API rate limit exceeded or access forbidden',
      });
    });

    it('should handle invalid GitHub token error', async () => {
      const error = new Error('Bad credentials');
      (error as any).status = 401;

      mockOctokit.rest.repos.get.mockRejectedValue(error);

      const result = await verifyRepository('test-owner', 'test-repo');

      expect(result).toEqual({
        valid: false,
        error: 'Invalid GitHub token',
      });
    });

    it('should handle generic errors', async () => {
      const error = new Error('Something went wrong');

      mockOctokit.rest.repos.get.mockRejectedValue(error);

      const result = await verifyRepository('test-owner', 'test-repo');

      expect(result).toEqual({
        valid: false,
        error: 'Something went wrong',
      });
    });

    it('should handle error without message', async () => {
      const error = {};

      mockOctokit.rest.repos.get.mockRejectedValue(error);

      const result = await verifyRepository('test-owner', 'test-repo');

      expect(result).toEqual({
        valid: false,
        error: 'Failed to verify repository',
      });
    });
  });

  describe('fetchRepositoryLanguages', () => {
    it('should fetch repository languages successfully', async () => {
      const mockLanguages = {
        data: {
          TypeScript: 2500,
          JavaScript: 1500,
          Python: 1000,
          Go: 500,
        },
      };

      mockOctokit.rest.repos.listLanguages.mockResolvedValue(mockLanguages);

      const result = await fetchRepositoryLanguages('test-owner', 'test-repo');

      expect(result).toEqual({
        TypeScript: 2500,
        JavaScript: 1500,
        Python: 1000,
        Go: 500,
      });
      expect(mockOctokit.rest.repos.listLanguages).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
      });
    });

    it('should return null on error', async () => {
      const error = new Error('API error');
      (error as any).response = {
        status: 500,
        data: { message: 'Internal server error' },
      };

      mockOctokit.rest.repos.listLanguages.mockRejectedValue(error);

      const result = await fetchRepositoryLanguages('test-owner', 'test-repo');

      expect(result).toBeNull();
    });

    it('should handle error with response details', async () => {
      const error = new Error('Forbidden');
      (error as any).response = {
        status: 403,
        data: { message: 'Rate limit exceeded' },
      };

      mockOctokit.rest.repos.listLanguages.mockRejectedValue(error);

      const result = await fetchRepositoryLanguages('test-owner', 'test-repo');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching languages for test-owner/test-repo:',
        'Forbidden'
      );
      expect(console.error).toHaveBeenCalledWith('Response status:', 403);
      expect(console.error).toHaveBeenCalledWith('Response data:', {
        message: 'Rate limit exceeded',
      });
    });

    it('should return empty languages data', async () => {
      const mockLanguages = {
        data: {},
      };

      mockOctokit.rest.repos.listLanguages.mockResolvedValue(mockLanguages);

      const result = await fetchRepositoryLanguages('test-owner', 'empty-repo');

      expect(result).toEqual({});
    });
  });

  describe('Environment variable handling', () => {
    it('should use GITHUB_TOKEN from environment', () => {
      // This test verifies that the Octokit instance is created with the token
      expect(Octokit).toHaveBeenCalledWith({
        auth: 'test-token',
      });
    });
  });

  describe('Logging behavior', () => {
    it('should log repository verification steps', async () => {
      const mockRepo = {
        data: {
          id: 123,
          name: 'test-repo',
          owner: { login: 'test-owner' },
          private: false,
        },
      };

      const mockLanguages = {
        data: {
          TypeScript: 1000,
        },
      };

      mockOctokit.rest.repos.get.mockResolvedValue(mockRepo);
      mockOctokit.rest.repos.listLanguages.mockResolvedValue(mockLanguages);

      await verifyRepository('test-owner', 'test-repo');

      expect(console.log).toHaveBeenCalledWith('Verifying repository: test-owner/test-repo');
      expect(console.log).toHaveBeenCalledWith('Repository test-owner/test-repo verified successfully');
      expect(console.log).toHaveBeenCalledWith('Languages found:', 'TypeScript');
    });

    it('should log when no languages are found', async () => {
      const mockRepo = {
        data: {
          id: 123,
          name: 'empty-repo',
          owner: { login: 'test-owner' },
          private: false,
        },
      };

      const mockLanguages = {
        data: {},
      };

      mockOctokit.rest.repos.get.mockResolvedValue(mockRepo);
      mockOctokit.rest.repos.listLanguages.mockResolvedValue(mockLanguages);

      await verifyRepository('test-owner', 'empty-repo');

      expect(console.log).toHaveBeenCalledWith('Languages found:', 'None');
    });
  });
});