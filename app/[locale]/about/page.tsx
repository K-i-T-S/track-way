import Image from "next/image";
import type { Metadata } from "next";
import { getAboutPage } from "@/sanity/queries";
import { getLocalized } from "@/lib/i18n-utils";
import type { Locale } from "@/i18n/routing";
import { DotGridBackground } from "@/components/ui/DotGridBackground";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const aboutPage = await getAboutPage();
  return {
    title: getLocalized(aboutPage.seoTitle, typedLocale),
    description: getLocalized(aboutPage.seoDescription, typedLocale),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const aboutPage = await getAboutPage();

  return (
    <div className="relative px-6 py-24">
      <DotGridBackground variant="streets" />
      {aboutPage.imageUrl && (
        <div className="relative mb-8 h-64 w-full">
          <Image
            src={aboutPage.imageUrl}
            alt=""
            fill
            className="object-cover"
          />
        </div>
      )}
      <p className="relative text-lg text-muted">
        {getLocalized(aboutPage.story, typedLocale)}
      </p>
    </div>
  );
}
