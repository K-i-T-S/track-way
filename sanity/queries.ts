import { client } from "./client";
import type {
  SiteSettings,
  HomePage,
  Feature,
  HardwareProduct,
  AboutPage,
} from "./types";

export async function getSiteSettings(): Promise<SiteSettings> {
  return client.fetch(`*[_type == "siteSettings"][0]{
    "logoUrl": logo.asset->url,
    phoneNumbers,
    whatsappNumber,
    email,
    socialLinks,
    address,
    footerText
  }`);
}

export async function getHomePage(): Promise<HomePage> {
  return client.fetch(`*[_type == "homePage"][0]{
    heroHeadline,
    heroSubheadline,
    marqueeKeywords,
    aboutTeaser,
    contactCtaText,
    seoTitle,
    seoDescription
  }`);
}

export async function getFeatures(): Promise<Feature[]> {
  return client.fetch(`*[_type == "feature"] | order(order asc){
    _id,
    order,
    title,
    description,
    icon
  }`);
}

export async function getHardwareProducts(): Promise<HardwareProduct[]> {
  return client.fetch(`*[_type == "hardwareProduct"] | order(order asc){
    _id,
    order,
    name,
    description,
    "images": images[].asset->url,
    specs
  }`);
}

export async function getAboutPage(): Promise<AboutPage> {
  return client.fetch(`*[_type == "aboutPage"][0]{
    story,
    "imageUrl": image.asset->url,
    seoTitle,
    seoDescription
  }`);
}
