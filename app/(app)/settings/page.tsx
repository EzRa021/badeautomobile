import type { Metadata } from "next";
import Link from "next/link";
import { UserCog, ChevronRight } from "lucide-react";
import { getCompanySettings } from "@/lib/db/queries";
import { PageHeader } from "@/components/app/page-header";
import { SettingsForm } from "@/components/app/settings-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getCompanySettings();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Company settings" description="Manage your company profile and document defaults." />

      <SettingsForm settings={settings} />

      <Link href="/staff" className="block">
        <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-accent">
          <span className="grid size-10 place-items-center rounded-lg bg-brand-050 text-primary">
            <UserCog className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Staff &amp; access</p>
            <p className="text-sm text-muted-foreground">Add or remove people who can sign in.</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Card>
      </Link>
    </div>
  );
}
