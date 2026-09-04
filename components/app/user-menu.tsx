"use client";

import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ email }: { email: string }) {
  const initial = (email?.[0] ?? "U").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 text-sm shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initial}
        </span>
        <span className="hidden max-w-[14ch] truncate text-muted-foreground sm:inline">
          {email}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="normal-case">
          <span className="flex items-center gap-2 text-sm font-normal text-foreground">
            <User className="size-4 text-muted-foreground" />
            <span className="truncate">{email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" /> Company settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut className="size-4" /> Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
