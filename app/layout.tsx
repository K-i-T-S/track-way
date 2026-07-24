import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "TrackWay | GPS Tracking & Fleet Management in Lebanon",
    template: "%s | TrackWay",
  },
  description:
    "TrackWay provides GPS tracking hardware and fleet management software for businesses and asset owners in Lebanon. Know every move with live tracking, alerts, reports, and fleet control.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/brand/svg/trackway-app-icon.svg",
  },
  openGraph: {
    title: "TrackWay | GPS Tracking & Fleet Management in Lebanon",
    description:
      "TrackWay provides GPS tracking hardware and fleet management software for businesses and asset owners in Lebanon. Know every move with live tracking, alerts, reports, and fleet control.",
    url: "https://trackwaylb.com",
    siteName: "TrackWay",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TrackWay — Know Every Move.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrackWay | GPS Tracking & Fleet Management in Lebanon",
    description:
      "TrackWay provides GPS tracking hardware and fleet management software for businesses and asset owners in Lebanon.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}