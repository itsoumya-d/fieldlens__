import { act, renderHook, waitFor } from '@testing-library/react-native';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { useSubscription } from '@/lib/useSubscription';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
  },
}));

const customer = (pro: boolean) => ({
  entitlements: { active: pro ? { pro: { periodType: 'TRIAL' } } : {} },
}) as CustomerInfo;

beforeEach(() => {
  jest.clearAllMocks();
  (Purchases.getCustomerInfo as jest.Mock).mockResolvedValue(customer(false));
  (Purchases.getOfferings as jest.Mock).mockResolvedValue({ current: null, all: {} });
});

it('updates from the registered listener and removes that same callback on unmount', async () => {
  const { result, unmount } = renderHook(() => useSubscription());
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.isPro).toBe(false);
  const listener = (Purchases.addCustomerInfoUpdateListener as jest.Mock).mock.calls[0][0];
  act(() => listener(customer(true)));
  expect(result.current.isPro).toBe(true);
  expect(result.current.isTrial).toBe(true);
  unmount();
  expect(Purchases.removeCustomerInfoUpdateListener).toHaveBeenCalledTimes(1);
  expect(Purchases.removeCustomerInfoUpdateListener).toHaveBeenCalledWith(listener);
});

it('ends loading on provider failure without inventing an entitlement', async () => {
  (Purchases.getCustomerInfo as jest.Mock).mockRejectedValue(new Error('offline'));
  const { result } = renderHook(() => useSubscription());
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.isPro).toBe(false);
  expect(result.current.customerInfo).toBeNull();
});
