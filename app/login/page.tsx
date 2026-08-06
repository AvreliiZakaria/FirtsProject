import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

/**
 * Login / register page.
 *
 * Server component: if a session already exists, bounce to home so a logged-in
 * user never sees the auth form. Otherwise render the client form.
 */
export default async function LoginPage() {
  const user = await getServerUser();
  if (user) redirect("/");

  return (
    <main className="flex-1 animate-fade-in px-4 pb-10 pt-16 md:flex md:items-center md:justify-center md:pt-24">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-base">
            <span className="text-[20px] font-bold leading-none">L</span>
          </span>
        </div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink md:text-[32px]">
          Войдите в Lumo
        </h1>
        <p className="mt-2 max-w-[36ch] text-[14px] leading-relaxed text-ink-muted">
          Дарим 5 монет при регистрации — хватит на одну бесплатную съёмку.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
