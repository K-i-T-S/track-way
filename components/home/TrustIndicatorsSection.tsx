"use client";

import { motion } from "framer-motion";
import { MapPin, MessageCircle, Radio } from "lucide-react";
import { useTranslations } from "next-intl";

const ITEMS = [
  { Icon: Radio, key: "trustIndicator1" },
  { Icon: MapPin, key: "trustIndicator2" },
  { Icon: MessageCircle, key: "trustIndicator3" },
] as const;

export function TrustIndicatorsSection(): React.ReactElement {
  const t = useTranslations("homepage");

  return (
    <section className="relative border-y border-border/10 bg-surface/[0.02] px-6 py-8 lg:px-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-0 sm:divide-x sm:divide-border/10 rtl:sm:divide-x-reverse">
        {ITEMS.map(({ Icon, key }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="flex items-center gap-3 px-6 text-center sm:text-start"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-foreground">
              {t(key)}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
