import {
  LayoutDashboard,
  FileText,
  Truck,
  Receipt,
  ShoppingCart,
  Users,
  Factory,
  Car,
  Settings,
  UserCog,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Documents",
    items: [
      { label: "Quotations", href: "/quotations", icon: FileText },
      { label: "Job Delivery", href: "/job-deliveries", icon: Truck },
      { label: "Invoices", href: "/invoices", icon: Receipt },
      { label: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
    ],
  },
  {
    heading: "Records",
    items: [
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Suppliers", href: "/suppliers", icon: Factory },
      { label: "Vehicles", href: "/vehicles", icon: Car },
    ],
  },
  {
    heading: "Admin",
    items: [
      { label: "Staff", href: "/staff", icon: UserCog },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
