/**
 * Which payment plans apply to which package (`ProposalPaymentPlan.packageIds`;
 * absent = every package). Shared by the pricing UI and the acceptance API.
 * Client-safe.
 */

interface PlanLike {
  id: string;
  packageIds?: string[];
}

/** Whether `plan` applies to `packageId` (any plan applies while no package is chosen). */
export const planAppliesTo = (plan: PlanLike, packageId: string | null | undefined): boolean =>
  !packageId || !plan.packageIds?.length || plan.packageIds.includes(packageId);

/** The plans offered for a package. */
export const plansFor = <P extends PlanLike>(plans: P[], packageId: string | null | undefined): P[] => plans.filter((p) => planAppliesTo(p, packageId));

/**
 * The plan to keep selected for `packageId`: `current` if it's still offered
 * for that package, else the only plan offered (once a package is chosen),
 * else none. Used when restoring a recorded response and when the client
 * picks a package, so the shown and submitted selections always agree.
 */
export function planForPackage(plans: PlanLike[], packageId: string | null | undefined, current: string | null | undefined): string | null {
  const offered = plansFor(plans, packageId);
  if (current && offered.some((p) => p.id === current)) return current;
  return packageId && offered.length === 1 ? offered[0].id : null;
}
