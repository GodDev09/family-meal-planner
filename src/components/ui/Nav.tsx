"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "🏠", label: "Tổng quan" },
  { href: "/family", icon: "👨‍👩‍👧", label: "Gia đình" },
  { href: "/menu", icon: "🍽️", label: "Thực đơn" },
  { href: "/nutrition", icon: "📊", label: "Dinh dưỡng" },
  { href: "/shopping", icon: "🛒", label: "Đi chợ" },
  { href: "/history", icon: "📅", label: "Lịch sử" },
  { href: "/settings", icon: "⚙️", label: "Cài đặt" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-around py-2 z-50 md:hidden">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors text-xs",
            pathname.startsWith(item.href)
              ? "text-brand-600 font-semibold"
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          <span className="text-xl">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex flex-col gap-1 w-56 shrink-0 pt-4">
      <div className="px-4 mb-4">
        <span className="text-2xl font-bold text-brand-600">🍚 BuaCom.AI</span>
      </div>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-xl mx-2 transition-colors text-sm font-medium",
            pathname.startsWith(item.href)
              ? "bg-brand-50 text-brand-700"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          )}
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
