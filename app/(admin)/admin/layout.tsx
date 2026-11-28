import AdminShell from "@/components/AdminShell";
import { verifySession } from "@/lib/admin-auth";
import { query } from "@/lib/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the admin email from the session
  const session = await verifySession();
  let adminEmail = "admin@veigin.pk";

  if (session) {
    const users = await query<{ email: string }>(
      "SELECT email FROM admin_users WHERE id = ? LIMIT 1",
      [session.adminId]
    );
    if (users.length > 0) {
      adminEmail = users[0].email;
    }
  }

  return (
    <AdminShell pageTitle="Overview" userEmail={adminEmail}>
      {children}
    </AdminShell>
  );
}