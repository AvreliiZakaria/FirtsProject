import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-base-line px-4 py-10 md:px-8 lg:px-12">
      <div className="mx-auto grid w-full max-w-content gap-8 md:grid-cols-[1fr_auto_auto]">
        <div><p className="text-lg font-bold text-ink">Lumo</p><p className="mt-2 max-w-xs text-sm leading-6 text-ink-muted">AI-портреты из обычных селфи. Выберите образ и получите результат без студии.</p><p className="mt-4 text-xs text-ink-faint">© 2026 Lumo. Все права защищены.</p></div>
        <div><p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Документы</p><div className="mt-3 grid gap-2 text-sm text-ink-muted"><Link href="/offer" className="hover:text-ink">Публичная оферта</Link><Link href="/privacy" className="hover:text-ink">Политика конфиденциальности</Link><Link href="/consent" className="hover:text-ink">Согласие на обработку фото</Link></div></div>
        <div><p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Помощь</p><div className="mt-3 grid gap-2 text-sm text-ink-muted"><Link href="/support" className="hover:text-ink">Поддержка</Link><a href="mailto:support@lumo.example" className="hover:text-ink">support@lumo.example</a></div></div>
      </div>
    </footer>
  );
}
