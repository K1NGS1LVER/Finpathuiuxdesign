import {
  Bike,
  Plane,
  CreditCard,
  Home,
  Heart,
  Target,
  TrendingUp,
  Shield,
  GraduationCap,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type GoalIconComponent = LucideIcon;

export const GOAL_ICON_MAP: Record<string, GoalIconComponent> = {
  Bike,
  Plane,
  CreditCard,
  Home,
  Heart,
  Target,
  TrendingUp,
  Shield,
  GraduationCap,
  Wallet,
};

export function getGoalIcon(name: string): GoalIconComponent {
  return GOAL_ICON_MAP[name] || Target;
}
