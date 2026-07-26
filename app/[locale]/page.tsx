import type { Metadata } from "next";
import { getHomePage, getFeatures } from "@/sanity/queries";
import { getLocalized } from "@/lib/i18n-utils";
import type { Locale } from "@/i18n/routing";
import { HeroSection } from "@/components/home/HeroSection";
import { ServiceCarousel } from "@/components/home/ServiceCarousel";
import { CoreValueSection } from "@/components/home/CoreValueSection";
import { IndustriesSection } from "@/components/home/IndustriesSection";
import { ControlRoomSection } from "@/components/home/ControlRoomSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { ServicesFeatureList } from "@/components/home/ServicesFeatureList";
import { AboutTeaserSection } from "@/components/home/AboutTeaserSection";
import { HardwareTeaserSection } from "@/components/home/HardwareTeaserSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;

  return {
    title: "TrackWay | GPS Tracking & Fleet Management in Lebanon",
    description:
      "TrackWay provides GPS tracking hardware and fleet management software for businesses and asset owners in Lebanon. Know every move with live tracking, alerts, reports, and fleet control.",
    openGraph: {
      title: "TrackWay | GPS Tracking & Fleet Management in Lebanon",
      description:
        "TrackWay provides GPS tracking hardware and fleet management software for businesses and asset owners in Lebanon. Know every move with live tracking, alerts, reports, and fleet control.",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "TrackWay - GPS Tracking & Fleet Management",
        },
      ],
    },
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
      <HeroSection
        locale={typedLocale}
        headline="GPS tracking and fleet management that keeps you in control."
        subheadline="TrackWay combines reliable GPS hardware with smart fleet management software, giving you live vehicle visibility, alerts, reports, and operational control from one connected platform."
      />
      <ServiceCarousel features={features} locale={typedLocale} />
      <CoreValueSection />
      <IndustriesSection />
      <ControlRoomSection />
      <HowItWorksSection />
      <ServicesFeatureList features={features} locale={typedLocale} />
      <AboutTeaserSection
        body={getLocalized(homePage.aboutTeaser, typedLocale)}
      />
      <HardwareTeaserSection locale={typedLocale} />
      <FinalCtaSection
        locale={typedLocale}
        body={getLocalized(homePage.contactCtaText, typedLocale)}
      />
    </div>
  );
}
