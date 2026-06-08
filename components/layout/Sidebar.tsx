"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  BarChart3,
  MessageSquare,
  Calendar,
  ListChecks,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarProps {
  role: string;
  userName: string;
}

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pengguna", label: "Pengguna", icon: Users },
  { href: "/admin/divisi", label: "Divisi", icon: Building2 },
  { href: "/admin/indikator", label: "Indikator KPI", icon: ListChecks },
  { href: "/admin/periode", label: "Periode", icon: Calendar },
];

const hrNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hr/karyawan", label: "Karyawan", icon: Users },
  { href: "/hr/target", label: "Target KPI", icon: Target },
  { href: "/hr/penilaian", label: "Penilaian", icon: BarChart3 },
  { href: "/hr/feedback", label: "Feedback", icon: MessageSquare },
];

const karyawanNav = [
  { href: "/karyawan/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/karyawan/target", label: "Target KPI", icon: Target },
  { href: "/karyawan/hasil", label: "Hasil Penilaian", icon: TrendingUp },
  { href: "/karyawan/feedback", label: "Feedback", icon: MessageSquare },
];

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems =
    role === "admin" ? adminNav : role === "hr" ? hrNav : karyawanNav;

  const roleLabel =
    role === "admin" ? "Administrator" : role === "hr" ? "HR Manager" : "Karyawan";

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm leading-tight">Sistem KPI</p>
            <p className="text-xs text-slate-400">{roleLabel}</p>
          </div>
        )}
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 bg-slate-700 rounded-full p-1 border border-slate-600 hover:bg-slate-600"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-700 p-3">
        {!collapsed && (
          <p className="text-xs text-slate-400 px-2 pb-2 truncate">{userName}</p>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="ml-3">Keluar</span>}
        </Button>
      </div>
    </aside>
  );
}
