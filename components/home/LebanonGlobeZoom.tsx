"use client";

import { useEffect, useRef } from "react";

export function LebanonGlobeZoom() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Assert non-null for TypeScript after checks
    const canvasNonNull = canvas;
    const containerNonNull = container;
    const ctxNonNull = ctx;

    // Constants
    const DEG = Math.PI / 180;
    const RAD = 180 / Math.PI;
    const LEBANON = { name: "Lebanon", lon: 35.8623, lat: 33.8547 };
    const BEIRUT = { name: "Beirut", lon: 35.5018, lat: 33.8938 };
    const routes = [
      { name: "Istanbul", lon: 28.9784, lat: 41.0082, color: "#64f4ff" },
      { name: "Cairo", lon: 31.2357, lat: 30.0444, color: "#ffd166" },
      { name: "Dubai", lon: 55.2708, lat: 25.2048, color: "#6dffac" },
      { name: "Riyadh", lon: 46.6753, lat: 24.7136, color: "#64f4ff" },
      { name: "Amman", lon: 35.9304, lat: 31.9539, color: "#ffd166" },
      { name: "Larnaca", lon: 33.6233, lat: 34.9182, color: "#6dffac" },
    ];
    const labels = [
      { name: "LEBANON", lon: 35.86, lat: 33.9, important: true },
      { name: "Beirut", lon: 35.5, lat: 33.89, city: true },
      { name: "Tripoli", lon: 35.85, lat: 34.44, city: true },
      { name: "Sidon", lon: 35.37, lat: 33.56, city: true },
      { name: "Syria", lon: 38.2, lat: 35.1 },
      { name: "Jordan", lon: 36.1, lat: 31.2 },
      { name: "Cyprus", lon: 33.1, lat: 35.1 },
      { name: "Türkiye", lon: 35.1, lat: 39.0 },
      { name: "Egypt", lon: 30.2, lat: 27.2 },
      { name: "Saudi Arabia", lon: 44.5, lat: 23.5 },
      { name: "Iraq", lon: 43.9, lat: 33.1 },
      { name: "Mediterranean Sea", lon: 30.2, lat: 34.6, water: true },
    ];
    const menaNames = new Set([
      "Algeria",
      "Bahrain",
      "Cyprus",
      "Djibouti",
      "Egypt",
      "Iran",
      "Iraq",
      "Israel",
      "Jordan",
      "Kuwait",
      "Lebanon",
      "Libya",
      "Mauritania",
      "Morocco",
      "Oman",
      "Palestine",
      "Qatar",
      "Saudi Arabia",
      "Somalia",
      "Sudan",
      "Syria",
      "Tunisia",
      "Turkey",
      "United Arab Emirates",
      "Yemen",
      "Western Sahara",
      "W. Sahara",
      "S. Sudan",
    ]);

    let width = 1,
      height = 1,
      dpr = 1;
    let progress = 0,
      target = 0;
    let userLonOffset = 0,
      userLatOffset = 0;
    let dragging = false,
      dragStart: any = null;
    let last = performance.now();

    const clamp = (v: number, min = 0, max = 1) =>
      Math.max(min, Math.min(max, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const smoothstep = (a: number, b: number, x: number) => {
      const t = clamp((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
    const merc = (lat: number) =>
      Math.log(Math.tan((Math.PI / 4 + clamp(lat, -84, 84) * DEG) / 2));
    const rad = (lon: number) => lon * DEG;
    const countryName = (f: any) =>
      f.properties.ADMIN || f.properties.NAME_LONG || f.properties.NAME || "";
    const isMena = (f: any) =>
      menaNames.has(countryName(f)) ||
      menaNames.has(f.properties.NAME) ||
      menaNames.has(f.properties.NAME_LONG);

    function eachRing(feature: any, cb: (ring: any, feature: any) => void) {
      const geom = feature.geometry;
      if (!geom) return;
      if (geom.type === "Polygon") geom.coordinates.forEach((r: any) => cb(r, feature));
      else if (geom.type === "MultiPolygon")
        geom.coordinates.forEach((poly: any) => poly.forEach((r: any) => cb(r, feature)));
    }

    const stars = Array.from({ length: 240 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.25,
      a: Math.random() * 0.58 + 0.14,
      drift: Math.random() * 0.04 + 0.012,
      phase: Math.random() * Math.PI * 2,
    }));
    const satellites = Array.from({ length: 9 }, (_, i) => ({
      angle: (i / 9) * Math.PI * 2,
      radius: 0.2 + Math.random() * 0.22,
      speed: 0.16 + Math.random() * 0.22,
      tilt: Math.random() * Math.PI,
    }));

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, containerNonNull.clientWidth);
      height = Math.max(1, containerNonNull.clientHeight);
      canvasNonNull.width = Math.floor(width * dpr);
      canvasNonNull.height = Math.floor(height * dpr);
      canvasNonNull.style.width = width + "px";
      canvasNonNull.style.height = height + "px";
      ctxNonNull.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function setTarget(v: number) {
      target = clamp(v);
    }

    function sphereProject(lon: number, lat: number, params: any) {
      const lambda = (lon - params.centerLon) * DEG;
      const phi = lat * DEG;
      const phi0 = params.centerLat * DEG;
      const cosPhi = Math.cos(phi),
        sinPhi = Math.sin(phi);
      const cosPhi0 = Math.cos(phi0),
        sinPhi0 = Math.sin(phi0);
      const x = cosPhi * Math.sin(lambda);
      const y = cosPhi0 * sinPhi - sinPhi0 * cosPhi * Math.cos(lambda);
      const z = sinPhi0 * sinPhi + cosPhi0 * cosPhi * Math.cos(lambda);
      return { x: params.cx + params.r * x, y: params.cy - params.r * y, z };
    }

    function globeParams(time: number) {
      const seek = smoothstep(0.03, 0.46, progress);
      const unfold = smoothstep(0.47, 0.72, progress);
      const autoSpin = (1 - seek) * time * 2.8;
      const baseLon = lerp(-38 + autoSpin, LEBANON.lon, seek);
      return {
        cx: width * (width > 900 ? lerp(0.58, 0.55, unfold) : 0.5),
        cy: height * (height > 720 ? lerp(0.52, 0.53, unfold) : 0.57),
        r: Math.min(width, height) * lerp(0.31, 0.72, smoothstep(0.08, 0.58, progress)),
        centerLon: baseLon + userLonOffset * (1 - unfold),
        centerLat: lerp(5, 30, seek) + userLatOffset * (1 - unfold),
        alpha: 1 - smoothstep(0.55, 0.76, progress),
      };
    }

    function flatParams() {
      const g = smoothstep(0.72, 0.99, progress);
      const small = width < 900;
      const cx = width * (small ? 0.5 : 0.58);
      const cy = height * (small ? 0.58 : 0.53);
      const mena = {
        minLon: -18,
        maxLon: 64,
        minLat: -4,
        maxLat: 44,
        centerLon: 23.0,
        centerLat: 22.5,
      };
      const lev = {
        minLon: 28.6,
        maxLon: 42.2,
        minLat: 28.4,
        maxLat: 38.6,
        centerLon: 35.55,
        centerLat: 33.65,
      };
      function fit(b: any) {
        const padX = small ? width * 0.1 : width * 0.12;
        const padY = small ? height * 0.2 : height * 0.17;
        const sx = (width - padX * 2) / (rad(b.maxLon) - rad(b.minLon));
        const sy = (height - padY * 2) / (merc(b.maxLat) - merc(b.minLat));
        return Math.min(sx, sy);
      }
      return {
        cx,
        cy,
        centerLon: lerp(mena.centerLon, lev.centerLon, easeOutCubic(g)),
        centerLat: lerp(mena.centerLat, lev.centerLat, easeOutCubic(g)),
        scale: lerp(fit(mena), fit(lev), easeOutCubic(g)),
        alpha: smoothstep(0.47, 0.69, progress),
        zoom: g,
      };
    }

    function flatProject(lon: number, lat: number, p: any) {
      return {
        x: p.cx + (rad(lon) - rad(p.centerLon)) * p.scale,
        y: p.cy - (merc(lat) - merc(p.centerLat)) * p.scale,
      };
    }

    function drawBackground(time: number) {
      ctxNonNull.clearRect(0, 0, width, height);
      const grd = ctxNonNull.createRadialGradient(
        width * 0.62,
        height * 0.48,
        40,
        width * 0.62,
        height * 0.48,
        Math.max(width, height) * 0.8
      );
      grd.addColorStop(0, "rgba(22,242,207,.12)");
      grd.addColorStop(0.28, "rgba(21,67,111,.17)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctxNonNull.fillStyle = grd;
      ctxNonNull.fillRect(0, 0, width, height);
      for (const s of stars) {
        const x = ((s.x + Math.sin(time * s.drift + s.phase) * 0.008) % 1) * width;
        const y = ((s.y + (time * s.drift) / 30) % 1) * height;
        ctxNonNull.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(time * 1.5 + s.phase));
        ctxNonNull.fillStyle = "#dffbff";
        ctxNonNull.beginPath();
        ctxNonNull.arc(x, y, s.r, 0, Math.PI * 2);
        ctxNonNull.fill();
      }
      ctxNonNull.globalAlpha = 1;
    }

    function drawSphereBase(p: any, time: number) {
      if (p.alpha <= 0.01) return;
      ctxNonNull.save();
      ctxNonNull.globalAlpha = p.alpha;
      const halo = ctxNonNull.createRadialGradient(
        p.cx,
        p.cy,
        p.r * 0.72,
        p.cx,
        p.cy,
        p.r * 1.45
      );
      halo.addColorStop(0, "rgba(100,244,255,0)");
      halo.addColorStop(0.58, "rgba(100,244,255,.10)");
      halo.addColorStop(1, "rgba(100,244,255,0)");
      ctxNonNull.fillStyle = halo;
      ctxNonNull.beginPath();
      ctxNonNull.arc(p.cx, p.cy, p.r * 1.45, 0, Math.PI * 2);
      ctxNonNull.fill();

      const ocean = ctxNonNull.createRadialGradient(
        p.cx - p.r * 0.32,
        p.cy - p.r * 0.38,
        p.r * 0.04,
        p.cx,
        p.cy,
        p.r
      );
      ocean.addColorStop(0, "rgba(94, 247, 255,.35)");
      ocean.addColorStop(0.2, "rgba(36, 107, 154,.48)");
      ocean.addColorStop(0.68, "rgba(8, 34, 64,.86)");
      ocean.addColorStop(1, "rgba(2, 8, 24,.96)");
      ctxNonNull.fillStyle = ocean;
      ctxNonNull.beginPath();
      ctxNonNull.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
      ctxNonNull.fill();
      ctxNonNull.strokeStyle = "rgba(170,245,255,.46)";
      ctxNonNull.lineWidth = 1.4;
      ctxNonNull.stroke();
      ctxNonNull.clip();

      const limb = ctxNonNull.createRadialGradient(p.cx, p.cy, p.r * 0.3, p.cx, p.cy, p.r);
      limb.addColorStop(0.72, "rgba(255,255,255,0)");
      limb.addColorStop(1, "rgba(100,244,255,.22)");
      ctxNonNull.fillStyle = limb;
      ctxNonNull.fillRect(p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2);

      drawGlobeGrid(p);
      drawGlobeMarker(p, time);
      ctxNonNull.restore();
    }

    function drawGlobeGrid(p: any) {
      ctxNonNull.save();
      ctxNonNull.lineWidth = 0.8;
      ctxNonNull.strokeStyle = "rgba(162, 235, 255, .16)";
      for (let lat = -75; lat <= 75; lat += 15) {
        ctxNonNull.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 3) {
          const pt = sphereProject(lon, lat, p);
          if (pt.z < 0) {
            started = false;
            continue;
          }
          if (!started) {
            ctxNonNull.moveTo(pt.x, pt.y);
            started = true;
          } else ctxNonNull.lineTo(pt.x, pt.y);
        }
        ctxNonNull.stroke();
      }
      for (let lon = -180; lon < 180; lon += 15) {
        ctxNonNull.beginPath();
        let started = false;
        for (let lat = -85; lat <= 85; lat += 2) {
          const pt = sphereProject(lon, lat, p);
          if (pt.z < 0) {
            started = false;
            continue;
          }
          if (!started) {
            ctxNonNull.moveTo(pt.x, pt.y);
            started = true;
          } else ctxNonNull.lineTo(pt.x, pt.y);
        }
        ctxNonNull.stroke();
      }
      ctxNonNull.restore();
    }

    function drawGlobeMarker(p: any, time: number) {
      const pt = sphereProject(LEBANON.lon, LEBANON.lat, p);
      if (pt.z < 0) return;
      const s = 1 + smoothstep(0.15, 0.45, progress) * 0.85;
      ctxNonNull.save();
      ctxNonNull.translate(pt.x, pt.y);
      const pulse = (time * 1.4) % 1;
      for (let i = 0; i < 3; i++) {
        const rr = (9 + pulse * 26 + i * 11) * s;
        ctxNonNull.strokeStyle = `rgba(109,255,172,${(1 - pulse) * (0.34 - i * 0.08)})`;
        ctxNonNull.lineWidth = 1.3;
        ctxNonNull.beginPath();
        ctxNonNull.arc(0, 0, rr, 0, Math.PI * 2);
        ctxNonNull.stroke();
      }
      ctxNonNull.fillStyle = "#ffffff";
      ctxNonNull.beginPath();
      ctxNonNull.arc(0, 0, 4.6 * s, 0, Math.PI * 2);
      ctxNonNull.fill();
      ctxNonNull.fillStyle = "#6dffac";
      ctxNonNull.beginPath();
      ctxNonNull.arc(0, 0, 2.3 * s, 0, Math.PI * 2);
      ctxNonNull.fill();
      ctxNonNull.strokeStyle = "rgba(255,255,255,.72)";
      ctxNonNull.lineWidth = 1;
      ctxNonNull.beginPath();
      ctxNonNull.moveTo(-18 * s, 0);
      ctxNonNull.lineTo(-8 * s, 0);
      ctxNonNull.moveTo(8 * s, 0);
      ctxNonNull.lineTo(18 * s, 0);
      ctxNonNull.moveTo(0, -18 * s);
      ctxNonNull.lineTo(0, -8 * s);
      ctxNonNull.moveTo(0, 8 * s);
      ctxNonNull.lineTo(0, 18 * s);
      ctxNonNull.stroke();
      if (progress > 0.25) {
        ctxNonNull.globalAlpha = smoothstep(0.25, 0.5, progress);
        ctxNonNull.font = `800 ${11 * s}px Inter, system-ui, sans-serif`;
        ctxNonNull.fillStyle = "rgba(230,255,252,.96)";
        ctxNonNull.fillText("LEBANON", 13 * s, -12 * s);
      }
      ctxNonNull.restore();
    }

    function drawFlatLayer(p: any, time: number) {
      if (p.alpha <= 0.01) return;
      ctxNonNull.save();
      ctxNonNull.globalAlpha = p.alpha;
      drawFlatBackdrop(p, time);
      drawFlatGrid(p);
      drawLebanonOverlay(p, time);
      ctxNonNull.restore();
    }

    function drawFlatBackdrop(p: any, time: number) {
      const fold = smoothstep(0.47, 0.72, progress);
      const rx = width * (width < 900 ? 0.06 : 0.07),
        ry = height * (height < 700 ? 0.13 : 0.11);
      const rw = width - rx * 2,
        rh = height - ry * 2;
      ctxNonNull.save();
      const bg = ctxNonNull.createLinearGradient(rx, ry, rx + rw, ry + rh);
      bg.addColorStop(0, "rgba(8,26,46,.28)");
      bg.addColorStop(0.5, "rgba(3,18,31,.62)");
      bg.addColorStop(1, "rgba(2,9,21,.46)");
      roundRect(ctxNonNull, rx, ry, rw, rh, 34);
      ctxNonNull.fillStyle = bg;
      ctxNonNull.fill();
      ctxNonNull.strokeStyle = `rgba(120, 225, 255, ${0.1 + 0.22 * fold})`;
      ctxNonNull.lineWidth = 1.2;
      ctxNonNull.stroke();
      const creaseX = lerp(width * 0.78, width * 0.18, fold);
      const sheen = ctxNonNull.createLinearGradient(creaseX - 160, 0, creaseX + 160, 0);
      sheen.addColorStop(0, "rgba(255,255,255,0)");
      sheen.addColorStop(
        0.5,
        `rgba(100,244,255,${0.2 * (1 - Math.abs(fold - 0.55))})`
      );
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      ctxNonNull.fillStyle = sheen;
      roundRect(ctxNonNull, rx, ry, rw, rh, 34);
      ctxNonNull.fill();
      ctxNonNull.strokeStyle = `rgba(255,255,255,${0.08 * (1 - fold) + 0.08 * Math.sin(time * 2)})`;
      for (let i = 1; i < 5; i++) {
        const x = lerp(rx + rw * 0.5, rx + (rw * i) / 5, fold);
        ctxNonNull.beginPath();
        ctxNonNull.moveTo(x, ry + 16);
        ctxNonNull.lineTo(x, ry + rh - 16);
        ctxNonNull.stroke();
      }
      ctxNonNull.restore();
    }

    function drawFlatGrid(p: any) {
      ctxNonNull.save();
      ctxNonNull.lineWidth = 0.75;
      ctxNonNull.strokeStyle = "rgba(141, 223, 255, .15)";
      ctxNonNull.setLineDash([2, 7]);
      for (let lon = -180; lon <= 180; lon += 5) {
        const a = flatProject(lon, -72, p),
          b = flatProject(lon, 75, p);
        if ((a.x < -60 && b.x < -60) || (a.x > width + 60 && b.x > width + 60))
          continue;
        ctxNonNull.beginPath();
        ctxNonNull.moveTo(a.x, a.y);
        ctxNonNull.lineTo(b.x, b.y);
        ctxNonNull.stroke();
      }
      for (let lat = -80; lat <= 80; lat += 5) {
        const a = flatProject(-180, lat, p),
          b = flatProject(180, lat, p);
        if ((a.y < -60 && b.y < -60) || (a.y > height + 60 && b.y > height + 60))
          continue;
        ctxNonNull.beginPath();
        ctxNonNull.moveTo(a.x, a.y);
        ctxNonNull.lineTo(b.x, b.y);
        ctxNonNull.stroke();
      }
      ctxNonNull.setLineDash([]);
      ctxNonNull.restore();
    }

    function drawLebanonOverlay(p: any, time: number) {
      const l = flatProject(LEBANON.lon, LEBANON.lat, p);
      const b = flatProject(BEIRUT.lon, BEIRUT.lat, p);
      const alpha = smoothstep(0.6, 0.88, progress);
      ctxNonNull.save();
      ctxNonNull.globalAlpha = alpha;
      const pulse = (time * 1.28) % 1;
      for (let i = 0; i < 4; i++) {
        const r = 18 + i * 19 + pulse * 32;
        ctxNonNull.strokeStyle = `rgba(109,255,172,${(1 - pulse) * (0.4 - i * 0.07)})`;
        ctxNonNull.lineWidth = i === 0 ? 1.7 : 1.0;
        ctxNonNull.beginPath();
        ctxNonNull.arc(l.x, l.y, r, 0, Math.PI * 2);
        ctxNonNull.stroke();
      }
      ctxNonNull.strokeStyle = "rgba(255,255,255,.84)";
      ctxNonNull.lineWidth = 1.2;
      ctxNonNull.beginPath();
      ctxNonNull.moveTo(l.x - 54, l.y);
      ctxNonNull.lineTo(l.x - 17, l.y);
      ctxNonNull.moveTo(l.x + 17, l.y);
      ctxNonNull.lineTo(l.x + 54, l.y);
      ctxNonNull.moveTo(l.x, l.y - 54);
      ctxNonNull.lineTo(l.x, l.y - 17);
      ctxNonNull.moveTo(l.x, l.y + 17);
      ctxNonNull.lineTo(l.x, l.y + 54);
      ctxNonNull.stroke();
      ctxNonNull.save();
      ctxNonNull.translate(l.x, l.y);
      ctxNonNull.rotate(-0.68 + 0.05 * Math.sin(time * 2));
      ctxNonNull.fillStyle = "#6dffac";
      ctxNonNull.shadowColor = "rgba(109,255,172,.88)";
      ctxNonNull.shadowBlur = 26;
      ctxNonNull.beginPath();
      ctxNonNull.moveTo(0, -17);
      ctxNonNull.lineTo(10, 14);
      ctxNonNull.lineTo(0, 8);
      ctxNonNull.lineTo(-10, 14);
      ctxNonNull.closePath();
      ctxNonNull.fill();
      ctxNonNull.restore();
      ctxNonNull.shadowBlur = 0;
      ctxNonNull.fillStyle = "#fff";
      ctxNonNull.beginPath();
      ctxNonNull.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctxNonNull.fill();
      ctxNonNull.fillStyle = "#ff5a77";
      ctxNonNull.beginPath();
      ctxNonNull.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctxNonNull.fill();
      const boxW = 250,
        boxH = 72;
      const bx = Math.min(width - boxW - 22, Math.max(22, l.x + 38));
      const by = Math.max(22, Math.min(height - boxH - 22, l.y - 92));
      ctxNonNull.fillStyle = "rgba(4, 16, 30, .72)";
      roundRect(ctxNonNull, bx, by, boxW, boxH, 18);
      ctxNonNull.fill();
      ctxNonNull.strokeStyle = "rgba(109,255,172,.34)";
      ctxNonNull.stroke();
      ctxNonNull.font = "900 12px Inter, system-ui, sans-serif";
      ctxNonNull.fillStyle = "#6dffac";
      ctxNonNull.fillText("GPS LOCK ACQUIRED", bx + 16, by + 24);
      ctxNonNull.font = "900 21px Inter, system-ui, sans-serif";
      ctxNonNull.fillStyle = "#ffffff";
      ctxNonNull.fillText("Lebanon", bx + 16, by + 49);
      ctxNonNull.font = "700 11px Inter, system-ui, sans-serif";
      ctxNonNull.fillStyle = "rgba(203,230,238,.72)";
      ctxNonNull.fillText("33.8547°N  ·  35.8623°E", bx + 112, by + 49);
      ctxNonNull.restore();
    }

    function inView(x: number, y: number, m = 0) {
      return x > -m && x < width + m && y > -m && y < height + m;
    }

    function roundRect(c: any, x: number, y: number, w: number, h: number, r: number) {
      const rr = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + rr, y);
      c.arcTo(x + w, y, x + w, y + h, rr);
      c.arcTo(x + w, y + h, x, y + h, rr);
      c.arcTo(x, y + h, x, y, rr);
      c.arcTo(x, y, x + w, y, rr);
      c.closePath();
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      progress += (target - progress) * (1 - Math.pow(0.0008, dt));
      if (Math.abs(target - progress) < 0.00015) progress = target;
      const time = now / 1000;
      drawBackground(time);
      const gp = globeParams(time);
      const fp = flatParams();
      drawFlatLayer(fp, time);
      drawSphereBase(gp, time);
      requestAnimationFrame(frame);
    }

    // Event handlers
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setTarget(target + e.deltaY * 0.00062);
    };

    const handlePointerDown = (e: PointerEvent) => {
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
      dragStart = {
        x: e.clientX,
        y: e.clientY,
        lon: userLonOffset,
        lat: userLatOffset,
        p: target,
      };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragging || !dragStart) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      if (progress < 0.52) {
        userLonOffset = dragStart.lon - dx * 0.12;
        userLatOffset = clamp(dragStart.lat + dy * 0.08, -28, 28);
      } else {
        setTarget(dragStart.p + (dragStart.y - e.clientY) * 0.0022);
      }
    };

    const handlePointerUp = () => {
      dragging = false;
      dragStart = null;
    };

    // Initialize
    resize();
    window.addEventListener("resize", resize, { passive: true });
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    // Auto-animate to Lebanon on load
    setTimeout(() => setTarget(1), 500);

    requestAnimationFrame(frame);

    // Cleanup
    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-full"
      style={{
        background:
          "radial-gradient(circle at 72% 48%, rgba(19, 242, 207,.22), transparent 30%), radial-gradient(circle at 41% 19%, rgba(96, 165, 250,.18), transparent 28%), radial-gradient(circle at 15% 78%, rgba(255, 209, 102,.12), transparent 25%), linear-gradient(135deg,#030712 0%,#071426 43%,#03101d 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Animated 3D globe that zooms to Lebanon"
      />
      <div className="absolute inset-0 rounded-full bg-accent/10 blur-3xl" />
    </div>
  );
}
