const mockCreateClient = jest.fn((..._args: unknown[]) => ({}));
const mockStorage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() };
let mockPlatform = 'ios';

jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));
jest.mock('react-native', () => ({ Platform: { get OS() { return mockPlatform; } } }));
jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: mockStorage }));

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://fieldlens-ci.invalid';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'fieldlens-ci-placeholder';
});

it.each(['ios', 'android'])('preserves the native %s storage and session options', (platform) => {
  mockPlatform = platform;
  jest.isolateModules(() => require('@/lib/supabase'));
  expect(mockCreateClient).toHaveBeenCalledWith('https://fieldlens-ci.invalid', 'fieldlens-ci-placeholder', {
    auth: { storage: mockStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
});

it('lets Supabase select SSR-safe web storage without changing session options', () => {
  mockPlatform = 'web';
  jest.isolateModules(() => require('@/lib/supabase'));
  expect(mockCreateClient).toHaveBeenCalledWith('https://fieldlens-ci.invalid', 'fieldlens-ci-placeholder', {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
  expect(mockStorage.getItem).not.toHaveBeenCalled();
});
