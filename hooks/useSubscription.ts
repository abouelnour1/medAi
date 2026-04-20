import { useMemo } from 'react';
import { User } from '../types';

export interface SubscriptionState {
  isPremium: boolean;
  isAdmin: boolean;
  plan: 'monthly' | 'yearly' | null;
  expiresAt: string | null;
  daysLeft: number | null;
}

/**
 * isPremium = true لو:
 *  - role === 'admin'
 *  - role === 'premium' (legacy / manually granted)
 *  - subscriptionStatus === 'active' AND expiresAt في المستقبل
 */
export function useSubscription(user: User | null): SubscriptionState {
  return useMemo(() => {
    if (!user) return { isPremium: false, isAdmin: false, plan: null, expiresAt: null, daysLeft: null };

    if (user.role === 'admin') {
      return { isPremium: true, isAdmin: true, plan: null, expiresAt: null, daysLeft: null };
    }

    // Legacy premium (منح يدوي من الـ admin)
    if (user.role === 'premium') {
      return { isPremium: true, isAdmin: false, plan: user.subscriptionPlan ?? null, expiresAt: null, daysLeft: null };
    }

    // Subscription-based
    if (user.subscriptionStatus === 'active' && user.subscriptionExpiresAt) {
      const expires = new Date(user.subscriptionExpiresAt);
      const now = new Date();
      if (expires > now) {
        const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / 86400000);
        return {
          isPremium: true,
          isAdmin: false,
          plan: user.subscriptionPlan ?? null,
          expiresAt: user.subscriptionExpiresAt,
          daysLeft,
        };
      }
    }

    return { isPremium: false, isAdmin: false, plan: null, expiresAt: null, daysLeft: null };
  }, [user]);
}
