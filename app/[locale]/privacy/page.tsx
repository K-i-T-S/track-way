import { getTranslations } from "next-intl/server";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations("privacy");

  return (
    <div className="px-6 py-24">
      <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-muted">{t("body")}</p>
    </div>
  );
}
