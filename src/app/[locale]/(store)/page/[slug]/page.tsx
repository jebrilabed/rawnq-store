import { notFound } from "next/navigation";
import { BadgeHelp, RotateCcw, Sparkles } from "lucide-react";
import s from "@/components/storefront/storefront.module.css";
import { getContent } from "@/lib/data/db";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ContentPage({ params }: { params: { slug: string; locale: string } }) {
  const content = await getContent(params.locale);
  const tr = (text: string) => translate(params.locale, text);
  if (params.slug === "faq") {
    return (
      <main className={`${s.wrap} ${s.section} ${s.contentPage}`}>
        <header className={s.contentHero}>
          <span className={s.contentEyebrow}>{tr("معلومات المتجر")}</span>
          <div className={s.contentHeroRow}>
            <div>
              <h1>{tr("الأسئلة الشائعة")}</h1>
              <p>{tr("إجابات لأكثر الاستفسارات شيوعًا")}</p>
            </div>
            <span className={s.contentHeroIcon}><BadgeHelp size={30} strokeWidth={1.6} aria-hidden="true" /></span>
          </div>
        </header>
        <section className={s.faqList} aria-label={tr("الأسئلة الشائعة")}>
          {content.faq.length ? content.faq.map(([question, answer], index) => (
            <details key={`${index}-${question}`} className={s.faqCard}>
              <summary>
                <span className={s.faqNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span className={s.faqQuestion}>{question}</span>
                <span className={s.faqToggle} aria-hidden="true">+</span>
              </summary>
              <div className={s.faqAnswer}><p>{answer}</p></div>
            </details>
          )) : (
            <p className={s.contentEmpty}>{tr("لا توجد أسئلة شائعة حاليًا.")}</p>
          )}
        </section>
      </main>
    );
  }
  const pages: Record<string, { title: string; body: string }> = {
    about: { title: tr("من نحن"), body: content.about },
    delivery: { title: tr("التوصيل والاسترجاع"), body: content.delivery },
  };
  const page = pages[params.slug];
  if (!page) notFound();
  const PageIcon = params.slug === "delivery" ? RotateCcw : Sparkles;
  return (
    <main className={`${s.wrap} ${s.section} ${s.contentPage}`}>
      <header className={s.contentHero}>
        <span className={s.contentEyebrow}>{tr("معلومات المتجر")}</span>
        <div className={s.contentHeroRow}>
          <div><h1>{page.title}</h1></div>
          <span className={s.contentHeroIcon}><PageIcon size={30} strokeWidth={1.6} aria-hidden="true" /></span>
        </div>
      </header>
      <article className={s.contentArticle}>
        <span className={s.contentArticleMark} aria-hidden="true" />
        <div className={s.contentBody}>
          {page.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      </article>
    </main>
  );
}
