import {
  Activity,
  BarChart3,
  ClipboardList,
  Cloud,
  Compass,
  Globe,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Network,
  Plug,
  Rocket,
  ShoppingCart,
  Sparkles,
  Ticket,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/** Icons the capability catalogue can use. `CatalogueItem.icon` is typed by these keys, so a typo fails `tsc`. */
export const CAPABILITY_ICONS = {
  Activity,
  ClipboardList,
  Compass,
  GraduationCap,
  LifeBuoy,
  Network,
  Rocket,
  BarChart3,
  Cloud,
  Globe,
  LayoutDashboard,
  Plug,
  ShoppingCart,
  Sparkles,
  Ticket,
  Workflow,
} satisfies Record<string, LucideIcon>;

export type CapabilityIconName = keyof typeof CAPABILITY_ICONS;
