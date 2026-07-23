export type LocalizedString = {
  en: string;
  ar: string;
};

export interface SiteSettings {
  logoUrl: string;
  phoneNumbers: string[];
  whatsappNumber: string;
  email: string;
  socialLinks: { platform: string; url: string }[];
  address: LocalizedString;
  footerText: LocalizedString;
}

export interface HomePage {
  heroHeadline: LocalizedString;
  heroSubheadline: LocalizedString;
  marqueeKeywords: string[];
  aboutTeaser: LocalizedString;
  contactCtaText: LocalizedString;
  seoTitle: LocalizedString;
  seoDescription: LocalizedString;
}

export interface Feature {
  _id: string;
  order: number;
  title: LocalizedString;
  description: LocalizedString;
  icon?: string;
}

export interface HardwareSpec {
  label: LocalizedString;
  value: LocalizedString;
}

export interface HardwareProduct {
  _id: string;
  order: number;
  name: LocalizedString;
  description: LocalizedString;
  images: string[];
  specs: HardwareSpec[];
}

export interface AboutPage {
  story: LocalizedString;
  imageUrl: string;
  seoTitle: LocalizedString;
  seoDescription: LocalizedString;
}
