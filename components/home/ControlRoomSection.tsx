"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Gauge, MapPin, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

const CARDS = [
  { icon: Gauge, top: "18%", start: "12%", delay: 0 },
  { icon: MapPin, top: "55%", start: "62%", delay: 0.4 },
  { icon: ShieldAlert, top: "32%", start: "78%", delay: 0.8 },
];

export function ControlRoomSection(): React.ReactElement {
  const t = useTranslations("homepage");
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const gridY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section
      ref={ref}
      className="relative h-[70vh] min-h-[480px] overflow-hidden"
    >
      <motion.div
        style={{ y: gridY }}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-[120%] bg-[radial-gradient(circle,#00E5D414_1px,transparent_1px)] bg-[length:22px_22px] opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[140px]"
      />

      {CARDS.map(({ icon: Icon, top, start, delay }, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: [0, -10, 0] }}
          viewport={{ once: true }}
          transition={{
            opacity: { duration: 0.6, delay },
            y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
          }}
          className="absolute hidden h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-background/70 text-accent shadow-[0_0_30px_rgba(0,229,212,0.25)] backdrop-blur sm:flex"
          style={{ top, insetInlineStart: start }}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
      ))}

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-sm font-semibold uppercase tracking-widest text-accent"
        >
          {t("controlRoomEyebrow")}
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          {t("controlRoomTitle")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 max-w-xl text-muted"
        >
          {t("controlRoomBody")}
        </motion.p>
      </div>
    </section>
  );
}
