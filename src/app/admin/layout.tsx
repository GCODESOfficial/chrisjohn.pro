// app/admin/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const has = (await cookies()).get("admin_session")?.value;
  if (!has) {
    redirect("/login?next=/admin");
  }
  return <>{children}</>;
}
