export function pickAddressPoi<
  T extends { name?: string; address?: string },
>(address: string, pois: T[]): T | null;
