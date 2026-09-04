import type { Metadata } from "next";
import { AlertCircle, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { listStaffUsers } from "@/lib/db/users";
import { deleteStaffUser } from "@/lib/actions/users";
import { formatDisplayDate } from "@/lib/utils/dates";
import { PageHeader } from "@/components/app/page-header";
import { StaffForm } from "@/components/app/staff-form";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { EmptyState } from "@/components/app/empty-state";
import { RecordList, RecordRow } from "@/components/app/record-list";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const [{ configured, users }, currentUser] = await Promise.all([
    listStaffUsers(),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Staff" description="Manage who can sign in to Bade Automobile Documents." />

      {!configured && (
        <div className="mb-5 flex items-start gap-2 rounded-md border border-amber/40 bg-amber-050 px-4 py-3 text-sm text-amber">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Staff management isn&apos;t configured yet.</p>
            <p className="mt-0.5 text-amber/90">
              Add <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> to your{" "}
              <code className="font-mono">.env.local</code> (Supabase → Project Settings → API →
              service_role) and restart the app. Until then, create users in the Supabase dashboard.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <StaffForm disabled={!configured} />

        {configured &&
          (users.length === 0 ? (
            <EmptyState icon={Users} title="No staff accounts yet" description="Add your first team member above." />
          ) : (
            <RecordList>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <RecordRow
                    key={u.id}
                    title={
                      <span className="flex items-center gap-2">
                        {u.full_name ?? u.email}
                        {isSelf && <Badge variant="secondary">You</Badge>}
                      </span>
                    }
                    subtitle={`${u.full_name ? u.email + " · " : ""}Last sign-in ${
                      u.last_sign_in_at ? formatDisplayDate(u.last_sign_in_at) : "never"
                    }`}
                    actions={
                      isSelf ? undefined : (
                        <ConfirmDelete
                          action={deleteStaffUser}
                          id={u.id}
                          triggerVariant="ghost"
                          triggerIconOnly
                          triggerLabel="Remove access"
                          title={`Remove ${u.full_name ?? u.email}?`}
                          description="This deletes their account. They will no longer be able to sign in."
                          confirmLabel="Remove"
                        />
                      )
                    }
                  />
                );
              })}
            </RecordList>
          ))}
      </div>
    </div>
  );
}
