"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  LayoutDashboard,
  Map as MapIcon,
  Radio,
  Settings,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

/* Static, illustrative "dashboard chrome" — not a real product screenshot
   (this is a marketing site, no live-app screenshots exist to source from).
   Same illustrative-not-photographic treatment already used elsewhere on
   the homepage (ControlRoomSection's radar HUD, HardwareTeaserSection's
   device visualization) for the UI chrome around it. The basemap itself,
   though, IS a real photo: /public/images/platform-demo-lebanon-map.jpg is
   cropped from "Lebanon Physiography" (CIA World Factbook, public domain —
   commons.wikimedia.org/wiki/File:Lebanon_Physiography.jpg), sourced at
   full res and re-exported here. It's framed on the Tripoli–Sidon corridor
   rather than the whole country: the source photo's own aspect ratio can't
   fit Lebanon's full north-south extent inside a landscape "Live Map"
   viewport at every breakpoint without either cropping a labeled city or
   leaving big empty margins, so it's framed the way a real fleet tracker
   would auto-fit — to the active fleet's bounding box, not the political
   border. The vehicle pins, geofence ring, and route line drawn on top are
   percentage-positioned against that same crop (calibrated by fitting real
   city lat/longs to their pixel positions in the source photo), so they
   land on the correct real-world spot rather than an approximate one. */

const NAV_ITEMS = [
  { key: "Overview", Icon: LayoutDashboard, active: false },
  { key: "LiveMap", Icon: MapIcon, active: true },
  { key: "Vehicles", Icon: Truck, active: false },
  { key: "Drivers", Icon: Users, active: false },
  { key: "Alerts", Icon: AlertTriangle, active: false },
  { key: "Settings", Icon: Settings, active: false },
] as const;

// Active trip route overlay (Beirut → Chtaura → Baalbek, i.e. Truck 23's
// road) in the same 0–100 percentage space as the vehicle pins below, so it
// draws in the correct spot regardless of the map's rendered size.
const ROUTE_PATH = "M30.7,58.6 L45,60.5 L52.4,61.8 L60,55 L69.5,47.8";

// Vehicle markers: color-coded by fleet status (teal = moving, grey =
// idle, red = alert), positioned near the road/location each list row
// names. Percentages are calibrated against the basemap photo's own pixel
// grid (see file header) — illustrative fleet positions, real geography.
const VEHICLES = [
  {
    id: 1,
    color: "#00E5D4",
    top: "59%",
    left: "40%",
    nameKey: "platformDemoMockVehicle1Name",
    locationKey: "platformDemoMockVehicle1Location",
    speed: "67",
    alert: false,
  },
  {
    id: 2,
    color: "#00E5D4",
    top: "17%",
    left: "47%",
    nameKey: "platformDemoMockVehicle2Name",
    locationKey: "platformDemoMockVehicle2Location",
    speed: "53",
    alert: false,
  },
  {
    id: 3,
    color: "#5B6669",
    top: "56%",
    left: "33%",
    nameKey: "platformDemoMockVehicle3Name",
    locationKey: "platformDemoMockVehicle3Location",
    speed: "0",
    alert: false,
  },
  {
    id: 4,
    color: "#00E5D4",
    top: "72%",
    left: "27%",
    nameKey: "platformDemoMockVehicle4Name",
    locationKey: "platformDemoMockVehicle4Location",
    speed: "45",
    alert: false,
  },
  {
    id: 5,
    color: "#EF4444",
    top: "49%",
    left: "66%",
    nameKey: "platformDemoMockVehicle5Name",
    locationKey: "platformDemoMockVehicle5Location",
    speed: "86",
    alert: true,
  },
] as const;

function LiveMapPhoto({ zoomed = false }: { zoomed?: boolean }) {
  return (
    <>
      <Image
        src="/images/platform-demo-lebanon-map.jpg"
        alt=""
        fill
        sizes={
          zoomed
            ? "112px"
            : "(min-width: 1024px) 480px, (min-width: 640px) 55vw, 90vw"
        }
        className="object-cover"
        style={{ objectPosition: zoomed ? "42% 58%" : "50% 68%" }}
      />
      {/* blend the photo into the panel's own background (works in both
          themes since `background` is a theme token, not a fixed color) */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/15" />
    </>
  );
}

function DashboardMock() {
  const t = useTranslations("homepage");

  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-2xl border border-border/[0.12] bg-surface/[0.04] shadow-trackwayStrong backdrop-blur-sm"
    >
      {/* fake browser chrome bar */}
      <div className="flex items-center gap-2 border-b border-border/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-accentWarm/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted/40" />
        <span className="ms-3 text-xs font-medium text-muted">
          TrackWay · {t("platformDemoMockNavLiveMap")}
        </span>
        <span className="ms-auto flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute h-full w-full animate-ping rounded-full bg-accent/60" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          {t("platformDemoMockLive")}
        </span>
      </div>

      <div className="flex">
        {/* icon nav rail */}
        <div className="hidden w-12 shrink-0 flex-col items-center gap-2 border-e border-border/10 py-3 sm:flex">
          {NAV_ITEMS.map(({ key, Icon, active }) => (
            <span
              key={key}
              className={
                active
                  ? "flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent"
                  : "flex h-7 w-7 items-center justify-center rounded-lg text-muted"
              }
              title={t(`platformDemoMockNav${key}`)}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          ))}
        </div>

        {/* vehicles list */}
        <div className="hidden w-32 shrink-0 flex-col gap-2.5 border-e border-border/10 p-3 lg:flex">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted">
            {t("platformDemoMockNavVehicles")}
          </span>
          {VEHICLES.map((v) => (
            <div key={v.id} className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: v.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[9px] font-medium text-foreground">
                  {t(v.nameKey)}
                </p>
                <p className="truncate text-[8px] text-muted">
                  {t(v.locationKey)} · {v.speed} km/h
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* map area */}
        <div className="relative h-64 flex-1 overflow-hidden sm:h-72">
          <LiveMapPhoto />

          {/* app-drawn overlay: geofence ring + active route, on top of
              the real basemap photo, same as a real live-map view */}
          <span
            className="absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/30 bg-accent/10"
            style={{ top: "61.8%", left: "52.4%" }}
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <path
              d={ROUTE_PATH}
              fill="none"
              stroke="#00E5D4"
              strokeWidth="0.6"
              strokeLinejoin="round"
              strokeDasharray="1.6 1.6"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {VEHICLES.map((v, i) => (
            <motion.span
              key={v.id}
              initial={{ scale: 0.6, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
              className="absolute flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ top: v.top, left: v.left }}
            >
              {v.alert && (
                <span className="absolute h-full w-full animate-ping rounded-full bg-red-500/50" />
              )}
              <span
                className="relative h-2 w-2 rounded-full"
                style={{
                  background: v.color,
                  boxShadow: `0 0 8px ${v.color}90`,
                }}
              />
            </motion.span>
          ))}
        </div>
      </div>

      {/* bottom stat row */}
      <div className="hidden grid-cols-3 gap-3 border-t border-border/10 p-3 sm:grid">
        <div className="rounded-lg bg-surface/[0.06] p-2">
          <p className="text-[8px] font-medium text-muted">
            {t("platformDemoMockTripPlayback")}
          </p>
          <div className="mt-1.5 h-1 rounded-full bg-border/15">
            <div className="h-1 w-2/3 rounded-full bg-accent" />
          </div>
        </div>
        <div className="rounded-lg bg-surface/[0.06] p-2">
          <p className="text-[8px] font-medium text-muted">
            {t("platformDemoMockRecentAlert")}
          </p>
          <p className="mt-1 truncate text-[9px] font-medium text-red-400">
            {t("platformDemoMockAlertOverspeed")} · {t(VEHICLES[4].nameKey)}
          </p>
        </div>
        <div className="hidden rounded-lg bg-surface/[0.06] p-2 md:block">
          <p className="text-[8px] font-medium text-muted">
            {t("platformDemoMockReportsSummary")}
          </p>
          <div className="mt-1.5 flex h-4 items-end gap-0.5">
            {[40, 65, 50, 80, 60, 90, 55].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm bg-accent/50"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMock() {
  const t = useTranslations("homepage");

  return (
    <div
      className="absolute -bottom-6 -end-6 hidden h-48 w-28 overflow-hidden rounded-[1.25rem] border-4 border-border/20 bg-background shadow-trackwayStrong sm:block"
      aria-hidden="true"
    >
      <div className="flex h-full flex-col gap-2 p-2.5">
        <span className="text-[8px] font-semibold text-foreground">
          {t("platformDemoMockNavOverview")}
        </span>

        <div>
          <p className="text-[7px] font-medium uppercase tracking-wide text-muted">
            {t("platformDemoMockLiveStatus")}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            {[
              { n: "31", c: "#00E5D4" },
              { n: "5", c: "#FFC857" },
              { n: "0", c: "#5B6669" },
              { n: "36", c: "currentColor" },
            ].map((s, i) => (
              <span
                key={i}
                className="flex items-center gap-0.5 text-[8px] font-semibold text-foreground"
              >
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: s.c }}
                />
                {s.n}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[7px] font-medium uppercase tracking-wide text-muted">
            {t("platformDemoMockTodaySummary")}
          </p>
          <div className="mt-1 flex items-center justify-between rounded-lg bg-surface/[0.06] p-1.5">
            <span className="text-[7px] text-muted">
              {t("platformDemoMockDistance")}
            </span>
            <span className="text-[8px] font-semibold text-foreground">
              1,869 km
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between rounded-lg bg-surface/[0.06] p-1.5">
            <span className="text-[7px] text-muted">
              {t("platformDemoMockTrips")}
            </span>
            <span className="text-[8px] font-semibold text-foreground">
              128
            </span>
          </div>
        </div>

        <div>
          <p className="text-[7px] font-medium uppercase tracking-wide text-muted">
            {t("platformDemoMockRecentAlerts")}
          </p>
          <p className="mt-1 truncate rounded-lg bg-surface/[0.06] p-1.5 text-[7px] font-medium text-red-400">
            {t("platformDemoMockAlertOverspeed")} · {t(VEHICLES[4].nameKey)}
          </p>
        </div>

        <div className="relative mt-auto h-10 overflow-hidden rounded-lg">
          <LiveMapPhoto zoomed />
        </div>
      </div>
    </div>
  );
}

export function PlatformDemoSection(): React.ReactElement {
  const t = useTranslations("homepage");

  const points = [
    {
      Icon: Radio,
      title: t("platformDemoPoint1Title"),
      desc: t("platformDemoPoint1Desc"),
    },
    {
      Icon: TrendingUp,
      title: t("platformDemoPoint2Title"),
      desc: t("platformDemoPoint2Desc"),
    },
    {
      Icon: Activity,
      title: t("platformDemoPoint3Title"),
      desc: t("platformDemoPoint3Desc"),
    },
  ];

  return (
    <section className="relative px-6 py-24 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-24 right-1/3 h-80 w-80 rounded-full bg-accent/8 blur-[110px]" />
        <div className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-accentWarm/8 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-accent">
            {t("platformDemoEyebrow")}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("platformDemoTitle")}
          </h2>
          <p className="mt-4 text-muted">{t("platformDemoSubtitle")}</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="relative pb-6 pe-6"
          >
            <DashboardMock />
            <PhoneMock />
          </motion.div>

          <div className="flex flex-col gap-8">
            {points.map(({ Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex items-start gap-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
