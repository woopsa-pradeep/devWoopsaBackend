/**
 * Merge Epick settings row with safe defaults so mobile always receives known flags
 * (e.g. after DB migration or when a new column was added).
 */
export function normalizeEpickSetting(
  epickSetting: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {
    autoApproveOverrideRequests: false,
    capOrderQtyByInventory: false,
    allowSingleScan: true,
  };
  if (!epickSetting) {
    return { ...defaults };
  }
  return { ...defaults, ...epickSetting };
}
