import {
  signInWithGoogle,
  signInWithApple,
  signInWithMagicLink,
  signOut,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  deleteAccount,
} from '@/lib/auth';

const mockSignInWithOAuth = jest.fn().mockResolvedValue({ data: null, error: null });
const mockSignInWithOtp = jest.fn().mockResolvedValue({ data: null, error: null });
const mockSignInWithPassword = jest.fn().mockResolvedValue({ data: null, error: null });
const mockSignUp = jest.fn().mockResolvedValue({ data: null, error: null });
const mockSignOut = jest.fn().mockResolvedValue({ error: null });
const mockResetPasswordForEmail = jest.fn().mockResolvedValue({ data: null, error: null });
const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null }, error: null });
const mockDelete = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: any[]) => mockSignInWithOAuth(...args),
      signInWithOtp: (...args: any[]) => mockSignInWithOtp(...args),
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      signOut: () => mockSignOut(),
      resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
      getUser: () => mockGetUser(),
    },
    from: jest.fn(() => ({
      delete: mockDelete,
    })),
  },
}));

mockDelete.mockReturnValue({ eq: mockEq });

describe('fieldlens/lib/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exports', () => {
    it('should export signInWithGoogle as a function', () => {
      expect(typeof signInWithGoogle).toBe('function');
    });

    it('should export signInWithApple as a function', () => {
      expect(typeof signInWithApple).toBe('function');
    });

    it('should export signInWithMagicLink as a function', () => {
      expect(typeof signInWithMagicLink).toBe('function');
    });

    it('should export signOut as a function', () => {
      expect(typeof signOut).toBe('function');
    });

    it('should export signInWithEmail as a function', () => {
      expect(typeof signInWithEmail).toBe('function');
    });

    it('should export signUpWithEmail as a function', () => {
      expect(typeof signUpWithEmail).toBe('function');
    });

    it('should export resetPassword as a function', () => {
      expect(typeof resetPassword).toBe('function');
    });

    it('should export deleteAccount as a function', () => {
      expect(typeof deleteAccount).toBe('function');
    });
  });

  describe('signInWithGoogle', () => {
    it('should call signInWithOAuth with google provider', async () => {
      await signInWithGoogle();
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: 'fieldlens://auth/callback' },
      });
    });
  });

  describe('signInWithApple', () => {
    it('should call signInWithOAuth with apple provider', async () => {
      await signInWithApple();
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'apple',
        options: { redirectTo: 'fieldlens://auth/callback' },
      });
    });
  });

  describe('signInWithMagicLink', () => {
    it('should call signInWithOtp with email', async () => {
      await signInWithMagicLink('tradesperson@example.com');
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'tradesperson@example.com',
        options: { emailRedirectTo: 'fieldlens://auth/callback' },
      });
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      await signOut();
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('signInWithEmail', () => {
    it('should call signInWithPassword with email and password', async () => {
      await signInWithEmail('tradesperson@example.com', 'securepass');
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'tradesperson@example.com',
        password: 'securepass',
      });
    });
  });

  describe('signUpWithEmail', () => {
    it('should call signUp with email, password, and full name', async () => {
      await signUpWithEmail('tradesperson@example.com', 'securepass', 'Field Worker');
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'tradesperson@example.com',
        password: 'securepass',
        options: { data: { full_name: 'Field Worker' } },
      });
    });
  });

  describe('resetPassword', () => {
    it('should call resetPasswordForEmail with redirect', async () => {
      await resetPassword('tradesperson@example.com');
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'tradesperson@example.com',
        { redirectTo: 'fieldlens://auth/reset-password' }
      );
    });
  });

  describe('deleteAccount', () => {
    it('should return error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const result = await deleteAccount();
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('should delete profile and sign out when authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-field' } } });
      await deleteAccount();
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
