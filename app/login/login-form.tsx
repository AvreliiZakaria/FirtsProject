"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Mode = "login" | "register";

/**
 * Email + password auth form. Toggles between sign-in and sign-up.
 *
 * Email-confirmation UX:
 *   - On sign-up, if Supabase returns no session and no error → email
 *     confirmation is enabled → show a "check your inbox" screen so the user
 *     knows exactly what to do next (instead of looking logged-out/broken).
 *   - On sign-in, an unconfirmed email surfaces as a friendly Russian message.
 */
export function LoginForm() {
  const supabase = createBrowserSupabaseClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(translateAuthError(error.message));
          return;
        }
        // If a session came back, email confirmation is OFF → go home.
        // Use a hard navigation so the auth cookie applies and the whole app
        // (header balance, /admin gate) re-reads the fresh session — a client
        // router.replace would leave stale logged-out state until manual reload.
        if (data.session) {
          window.location.href = "/";
          return;
        }
        // No session, no error → confirmation email was sent.
        setPendingConfirmation(true);
        return;
      }

      // mode === "login"
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(translateAuthError(error.message));
        return;
      }
      // Hard reload for the same reason: the session cookie must take effect.
      window.location.href = "/";
    } catch {
      setError("Что-то пошло не так. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  // --- "Check your inbox" success screen after sign-up --------------------
  if (pendingConfirmation) {
    return (
      <div className="rounded-2xl border border-base-line bg-base-raised p-6 text-center animate-fade-in">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-base-hover text-ink">
          <MailCheck size={24} strokeWidth={1.8} />
        </span>
        <h2 className="mt-4 text-[18px] font-bold tracking-tight text-ink">
          Проверьте почту
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          Мы отправили ссылку для подтверждения на
          <br />
          <span className="font-medium text-ink">{email}</span>
        </p>
        <p className="mt-3 text-[13px] text-ink-faint">
          Откройте письмо и нажмите ссылку, затем войдите.
        </p>

        <button
          type="button"
          onClick={() => {
            setPendingConfirmation(false);
            setMode("login");
            setPassword("");
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-base transition hover:bg-white active:scale-[0.99]"
        >
          <CheckCircle2 size={17} strokeWidth={1.8} />
          Я подтвердил — войти
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl border border-base-line bg-base-raised px-4 py-3.5 text-[15px] text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
      />
      <input
        type="password"
        required
        minLength={6}
        autoComplete={mode === "register" ? "new-password" : "current-password"}
        placeholder="Пароль (мин. 6 символов)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-2xl border border-base-line bg-base-raised px-4 py-3.5 text-[15px] text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
      />

      {error && <p className="px-1 text-[13px] text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-[16px] font-semibold text-base transition hover:bg-white disabled:opacity-60 active:scale-[0.99]"
      >
        {busy ? (
          <Loader2 size={18} className="animate-spin" />
        ) : mode === "register" ? (
          "Создать аккаунт"
        ) : (
          "Войти"
        )}
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-1 text-center text-[13px] text-ink-muted transition hover:text-ink"
      >
        {mode === "login"
          ? "Нет аккаунта? Зарегистрироваться"
          : "Уже есть аккаунт? Войти"}
      </button>
    </form>
  );
}

/** Map Supabase's English auth errors to friendly Russian messages. */
function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message))
    return "Неверный email или пароль.";
  if (/email not confirmed/i.test(message))
    return "Email не подтверждён. Проверьте почту и перейдите по ссылке из письма.";
  if (/user already registered/i.test(message))
    return "Аккаунт с таким email уже существует.";
  if (/password should be at least/i.test(message))
    return "Пароль слишком короткий (мин. 6 символов).";
  if (/email rate limit/i.test(message))
    return "Слишком много попыток. Подождите немного.";
  return "Не удалось войти. Проверьте данные и попробуйте снова.";
}
