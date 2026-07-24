import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getHomePage, getFeatures } from "@/sanity/queries";
import { getLocalized } from "@/lib/i18n-utils";
import type { Locale } from "@/i18n/routing";
import type { CapabilityIconName } from "@/components/ui/CapabilityIcon";
import { MarqueeTicker } from "@/components/ui/MarqueeTicker";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { HeroSection } from "@/components/home/HeroSection";
import { CoreValueSection } from "@/components/home/CoreValueSection";
import { IndustriesSection } from "@/components/home/IndustriesSection";
import { ControlRoomSection } from "@/components/home/ControlRoomSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";

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

  const [homePage, features, t] = await Promise.all([
    getHomePage(),
    getFeatures(),
    getTranslations("home"),
  ]);

  return (
    <div className="relative">
      <HeroSection
        locale={typedLocale}
        headline={getLocalized(homePage.heroHeadline, typedLocale)}
        subheadline={getLocalized(homePage.heroSubheadline, typedLocale)}
      />
      <MarqueeTicker items={homePage.marqueeKeywords} />
      <CoreValueSection />
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl">
          {features.map((feature, i) => (
            <FeatureCard
              key={feature._id}
              number={String(i + 1).padStart(2, "0")}
              title={getLocalized(feature.title, typedLocale)}
              description={getLocalized(feature.description, typedLocale)}
              icon={feature.icon as CapabilityIconName | undefined}
            />
          ))}
        </div>
      </section>
      <IndustriesSection />
      <ControlRoomSection />
      <HowItWorksSection />
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-lg text-muted">
            {getLocalized(homePage.aboutTeaser, typedLocale)}
          </p>
        </div>
      </section>
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-lg text-muted">{t("hardwareTeaser")}</p>
          <Link
            href={`/${locale}/hardware`}
            className="mt-4 inline-block text-accent font-bold"
          >
            {t("viewHardwareCta")}
          </Link>
        </div>
      </section>
      <FinalCtaSection
        locale={typedLocale}
        body={getLocalized(homePage.contactCtaText, typedLocale)}
      />
    </div>
  );
}
