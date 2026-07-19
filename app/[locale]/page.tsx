import type { Metadata } from "next";
import { getHomePage, getFeatures } from "@/sanity/queries";
import { getLocalized } from "@/lib/i18n-utils";
import type { Locale } from "@/i18n/routing";
import { MarqueeTicker } from "@/components/ui/MarqueeTicker";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { DotGridBackground } from "@/components/ui/DotGridBackground";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const homePage = await getHomePage();
  return {
    title: getLocalized(homePage.seoTitle, typedLocale),
    description: getLocalized(homePage.seoDescription, typedLocale),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale as Locale;

  const [homePage, features] = await Promise.all([
    getHomePage(),
    getFeatures(),
  ]);

  return (
    <div className="relative">
      <DotGridBackground variant="world" />
      <section className="relative px-6 py-24">
        <h1 className="text-5xl font-bold text-foreground">
          {getLocalized(homePage.heroHeadline, typedLocale)}
        </h1>
        <p className="mt-4 text-xl text-muted">
          {getLocalized(homePage.heroSubheadline, typedLocale)}
        </p>
      </section>
      <MarqueeTicker items={homePage.marqueeKeywords} />
      <section className="grid grid-cols-1 gap-6 px-6 py-16 md:grid-cols-3">
        {features.map((feature, i) => (
          <FeatureCard
            key={feature._id}
            number={String(i + 1).padStart(2, "0")}
            title={getLocalized(feature.title, typedLocale)}
            description={getLocalized(feature.description, typedLocale)}
          />
        ))}
      </section>
      <section className="px-6 py-16">
        <p className="text-lg text-muted">
          {getLocalized(homePage.aboutTeaser, typedLocale)}
        </p>
      </section>
    </div>
  );
}
