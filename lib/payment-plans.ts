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
