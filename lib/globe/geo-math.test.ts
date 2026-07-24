import { describe, it, expect } from "vitest";
import {
  clamp,
  lerp,
  smoothstep,
  easeOutCubic,
  merc,
  rad,
  countryName,
  isMena,
  eachRing,
  sphereProject,
  flatProject,
  type GeoJsonFeature,
} from "./geo-math";

describe("clamp", () => {
  it("clamps values outside the default 0-1 range", () => {
    expect(clamp(-0.5)).toBe(0);
    expect(clamp(1.5)).toBe(1);
    expect(clamp(0.5)).toBe(0.5);
  });

  it("clamps against custom min/max", () => {
    expect(clamp(-10, -5, 5)).toBe(-5);
    expect(clamp(10, -5, 5)).toBe(5);
  });
});

describe("lerp", () => {
  it("interpolates linearly between two values", () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});

describe("smoothstep", () => {
  it("is 0 at or before the lower edge and 1 at or after the upper edge", () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 0)).toBe(0);
    expect(smoothstep(0, 1, 1)).toBe(1);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });

  it("eases through the midpoint", () => {
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 5);
  });
});

describe("easeOutCubic", () => {
  it("maps 0 to 0 and 1 to 1", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it("front-loads the easing (already past the midpoint value at t=0.5)", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe("merc", () => {
  it("is monotonically increasing with latitude", () => {
    expect(merc(10)).toBeGreaterThan(merc(0));
    expect(merc(-10)).toBeLessThan(merc(0));
  });

  it("is 0 at the equator", () => {
    expect(merc(0)).toBeCloseTo(0, 10);
  });
});

describe("rad", () => {
  it("converts degrees to radians", () => {
    expect(rad(180)).toBeCloseTo(Math.PI, 10);
    expect(rad(0)).toBe(0);
  });
});

function feature(props: Record<string, unknown>): GeoJsonFeature {
  return {
    type: "Feature",
    properties: props,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
    },
  };
}

describe("countryName", () => {
  it("prefers ADMIN, falls back to NAME_LONG then NAME", () => {
    expect(countryName(feature({ ADMIN: "Lebanon", NAME: "LB" }))).toBe(
      "Lebanon",
    );
    expect(
      countryName(feature({ NAME_LONG: "Lebanon Long", NAME: "LB" })),
    ).toBe("Lebanon Long");
    expect(countryName(feature({ NAME: "LB" }))).toBe("LB");
  });
});

describe("isMena", () => {
  it("matches known MENA countries by name", () => {
    expect(isMena(feature({ ADMIN: "Lebanon" }))).toBe(true);
    expect(isMena(feature({ ADMIN: "Egypt" }))).toBe(true);
  });

  it("does not match non-MENA countries", () => {
    expect(isMena(feature({ ADMIN: "France" }))).toBe(false);
  });
});

describe("eachRing", () => {
  it("visits each ring of a Polygon once", () => {
    const f = feature({ ADMIN: "Test" });
    const rings: number[][][] = [];
    eachRing(f, (ring) => rings.push(ring));
    expect(rings).toHaveLength(1);
  });

  it("visits every ring of every polygon in a MultiPolygon", () => {
    const f: GeoJsonFeature = {
      type: "Feature",
      properties: { ADMIN: "Test" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0],
            ],
          ],
          [
            [
              [2, 2],
              [3, 2],
              [3, 3],
              [2, 2],
            ],
          ],
        ],
      },
    };
    const rings: number[][][] = [];
    eachRing(f, (ring) => rings.push(ring));
    expect(rings).toHaveLength(2);
  });

  it("does nothing when geometry is null", () => {
    const f: GeoJsonFeature = {
      type: "Feature",
      properties: {},
      geometry: null,
    };
    let calls = 0;
    eachRing(f, () => calls++);
    expect(calls).toBe(0);
  });
});

describe("sphereProject", () => {
  const params = { cx: 100, cy: 100, r: 50, centerLon: 0, centerLat: 0 };

  it("projects the center point to the sphere's screen center, facing the viewer", () => {
    const p = sphereProject(0, 0, params);
    expect(p.x).toBeCloseTo(100, 5);
    expect(p.y).toBeCloseTo(100, 5);
    expect(p.z).toBeCloseTo(1, 5);
  });

  it("projects the antipodal point to the far side (negative z)", () => {
    const p = sphereProject(180, 0, params);
    expect(p.z).toBeCloseTo(-1, 5);
  });
});

describe("flatProject", () => {
  const params = { cx: 200, cy: 200, centerLon: 35, centerLat: 33, scale: 10 };

  it("projects the center coordinate to the screen center", () => {
    const p = flatProject(35, 33, params);
    expect(p.x).toBeCloseTo(200, 5);
    expect(p.y).toBeCloseTo(200, 5);
  });

  it("moves right for greater longitude and up for greater latitude", () => {
    const east = flatProject(40, 33, params);
    const north = flatProject(35, 40, params);
    expect(east.x).toBeGreaterThan(200);
    expect(north.y).toBeLessThan(200);
  });
});
