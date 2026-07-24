"use client";

import { motion } from "framer-motion";
import {
  Truck,
  Car,
  Package,
  Bus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface IndustryCardProps {
  icon: LucideIcon;
  title: string;
  index: number;
}

function IndustryCard({ icon: Icon, title, index }: IndustryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      whileHover={{ y: -6 }}
      className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center backdrop-blur transition-colors hover:border-accent/30"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </motion.div>
  );
}

export function IndustriesSection(): React.ReactElement {
  const t = useTranslations("homepage");

  const items = [
    { icon: Truck, title: t("industriesFleets") },
    { icon: Car, title: t("industriesRental") },
    { icon: Package, title: t("industriesDelivery") },
    { icon: Bus, title: t("industriesSchool") },
    { icon: UserRound, title: t("industriesPrivate") },
  ];

  return (
    <section className="relative px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-accent">
            {t("industriesEyebrow")}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("industriesTitle")}
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item, i) => (
            <IndustryCard key={item.title} {...item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
