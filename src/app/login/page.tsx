// app/login/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  // Next.js 15: cookies() is async
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("admin_session");

  // Next.js 15: searchParams is a Promise (works in 14 too — awaiting a non-Promise is a no-op)
  const sp = (await searchParams) ?? {};

  // Normalize ?next=... (string or array) and default to /admin
  const rawNext = sp.next;
  const next =
    typeof rawNext === "string"
      ? rawNext
      : Array.isArray(rawNext)
      ? rawNext[0] ?? "/admin"
      : "/admin";

  if (isAuthed) {
    redirect(next || "/admin");
  }

  return <LoginForm nextPath={next} />;
}
