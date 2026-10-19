import { notFound } from "next/navigation";
import s from "@/components/storefront/storefront.module.css";
import { getContent } from "@/lib/data/db";

export const dynamic = "force-dynamic";

export default async function ContentPage({ params }: { params: { slug: string } }) {
  const content = await getContent();
  if (params.slug === "faq") {
    return (
      <main className={`${s.wrap} ${s.section} ${s.prose}`}>
        <div className={s.head}><h1>الأسئلة الشائعة</h1></div>
        {content.faq.map(([q, a]) => <details key={q} className={s.faq}><summary>{q}</summary><p>{a}</p></details>)}
      </main>
    );
  }
  const pages: Record<string, { title: string; body: string }> = {
    about: { title: "من نحن", body: content.about },
    delivery: { title: "التوصيل والاسترجاع", body: content.delivery },
  };
  const page = pages[params.slug];
  if (!page) notFound();
  return (
    <main className={`${s.wrap} ${s.section} ${s.prose}`}>
      <div className={s.head}><h1>{page.title}</h1></div>
      <p>{page.body}</p>
    </main>
  );
}
