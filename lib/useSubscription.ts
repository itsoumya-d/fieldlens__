import { useEffect, useState } from 'react';
import Purchases, { CustomerInfo, PurchasesOfferings } from 'react-native-purchases';

interface SubscriptionState {
  isPro: boolean;
  isLoading: boolean;
  isTrial: boolean;
  offerings: PurchasesOfferings | null;
  customerInfo: CustomerInfo | null;
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    isLoading: true,
    isTrial: false,
    offerings: null,
    customerInfo: null,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [customerInfo, offerings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);
        if (!active) return;
        const proEntitlement = customerInfo.entitlements.active['pro'];
        setState({
          isPro: !!proEntitlement,
          isTrial: proEntitlement?.periodType === 'TRIAL',
          isLoading: false,
          offerings,
          customerInfo,
        });
      } catch {
        if (active) setState(s => ({ ...s, isLoading: false }));
      }
    }

    load();

    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      if (!active) return;
      const proEntitlement = info.entitlements.active['pro'];
      setState(s => ({
        ...s,
        isPro: !!proEntitlement,
        isTrial: proEntitlement?.periodType === 'TRIAL',
        customerInfo: info,
      }));
    });

    return () => {
      active = false;
      listener.remove();
    };
  }, []);

  return state;
}

export async function purchaseMonthly(offerings: PurchasesOfferings | null): Promise<boolean> {
  if (!offerings?.current?.monthly) return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage(offerings.current.monthly);
    return !!customerInfo.entitlements.active['pro'];
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean };
    if (err?.userCancelled) return false;
    throw e;
  }
}
