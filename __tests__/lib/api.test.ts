import {
  analyzeImage,
  getAnalysisHistory,
  getTasks,
  getUserProgress,
  markTaskComplete,
  getRecommendedTasks,
  getCertifications,
} from '@/lib/api';

// Mock Supabase client
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockNot = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });
const mockInvoke = jest.fn().mockResolvedValue({ data: null, error: null });

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  eq: mockEq,
  not: mockNot,
  order: mockOrder,
  limit: mockLimit,
  insert: mockInsert,
}));

mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, not: mockNot });
mockEq.mockReturnValue({ order: mockOrder, eq: mockEq, not: mockNot, limit: mockLimit });
mockNot.mockReturnValue({ order: mockOrder });
mockOrder.mockReturnValue({ data: [], error: null, limit: mockLimit });
mockLimit.mockReturnValue({ data: [], error: null });

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

describe('fieldlens/lib/api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exports', () => {
    it('should export analyzeImage as a function', () => {
      expect(typeof analyzeImage).toBe('function');
    });

    it('should export getAnalysisHistory as a function', () => {
      expect(typeof getAnalysisHistory).toBe('function');
    });

    it('should export getTasks as a function', () => {
      expect(typeof getTasks).toBe('function');
    });

    it('should export getUserProgress as a function', () => {
      expect(typeof getUserProgress).toBe('function');
    });

    it('should export markTaskComplete as a function', () => {
      expect(typeof markTaskComplete).toBe('function');
    });

    it('should export getRecommendedTasks as a function', () => {
      expect(typeof getRecommendedTasks).toBe('function');
    });

    it('should export getCertifications as a function', () => {
      expect(typeof getCertifications).toBe('function');
    });
  });

  describe('getAnalysisHistory', () => {
    it('should query the ai_analyses table with user_id', async () => {
      await getAnalysisHistory('user-123');
      expect(mockFrom).toHaveBeenCalledWith('ai_analyses');
    });
  });

  describe('getTasks', () => {
    it('should query tasks by trade', async () => {
      await getTasks('electrical');
      expect(mockFrom).toHaveBeenCalledWith('tasks');
    });
  });

  describe('getUserProgress', () => {
    it('should query progress_entries with task info', async () => {
      await getUserProgress('user-123');
      expect(mockFrom).toHaveBeenCalledWith('progress_entries');
    });
  });

  describe('markTaskComplete', () => {
    it('should insert a progress entry', async () => {
      await markTaskComplete('task-1', 'user-123');
      expect(mockFrom).toHaveBeenCalledWith('progress_entries');
    });
  });

  describe('getRecommendedTasks', () => {
    it('should query tasks filtered by trade and incomplete', async () => {
      await getRecommendedTasks('plumbing', 'user-123');
      expect(mockFrom).toHaveBeenCalledWith('tasks');
    });
  });

  describe('getCertifications', () => {
    it('should query certifications for a user', async () => {
      await getCertifications('user-123');
      expect(mockFrom).toHaveBeenCalledWith('certifications');
    });
  });

  describe('analyzeImage', () => {
    it('should throw when edge function returns error', async () => {
      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Analysis failed') });
      await expect(
        analyzeImage('user-123', 'base64data', 'electrical')
      ).rejects.toThrow('Analysis failed');
    });

    it('should invoke the analyze-image edge function and return result', async () => {
      const mockResult = {
        result: 'correct',
        message: 'Wiring looks good',
        details: ['Proper grounding', 'Clean connections'],
        codeReference: 'NEC 250.4',
        recommendation: 'Proceed to next step',
      };
      mockInvoke.mockResolvedValueOnce({ data: mockResult, error: null });
      const result = await analyzeImage('user-123', 'base64data', 'electrical');
      expect(mockInvoke).toHaveBeenCalledWith('analyze-image', expect.any(Object));
      expect(result.result).toBe('correct');
      expect(result.message).toBe('Wiring looks good');
    });

    it('should use general trade when no trade specified', async () => {
      const mockResult = {
        result: 'warning',
        message: 'Check alignment',
        details: ['Minor offset'],
        codeReference: null,
        recommendation: 'Realign and verify',
      };
      mockInvoke.mockResolvedValueOnce({ data: mockResult, error: null });
      const result = await analyzeImage('user-123', 'base64data');
      expect(mockInvoke).toHaveBeenCalledWith('analyze-image', expect.objectContaining({
        body: expect.objectContaining({
          context: 'fieldlens-general',
        }),
      }));
      expect(result.result).toBe('warning');
    });
  });
});
