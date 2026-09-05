import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getAccountPassword(account?: { password?: string | null; account_number?: string | null; id?: string } | null): string {
  if (!account) return '';
  if (
    account.password &&
    account.password.trim() !== '' &&
    account.password.length <= 25 &&
    !account.password.includes('7efd9') &&
    account.password !== 'Tr4de#2026' &&
    account.password !== 'TrdPass123!'
  ) {
    return account.password;
  }

  // Generate a distinct, deterministic unique password for each unique account
  const seedStr = String(account.account_number || account.id || '8587328');
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const alphaChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const c1 = alphaChars[absHash % alphaChars.length];
  const c2 = alphaChars[(absHash >> 3) % alphaChars.length];
  const digits = seedStr.replace(/\D/g, '');
  const suffix = digits.length >= 4 ? digits.slice(-4) : '7328';
  return `FS_${c1}${c2}#${suffix}!`;
}

