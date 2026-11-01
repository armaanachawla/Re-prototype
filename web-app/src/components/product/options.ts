import type { ColourKey, StyleKey } from "@/lib/app-state";

export interface ColourOption {
  key: ColourKey;
  name: string;
  base: string;
  /** Detail colour for cuffs, seams and the logo, chosen for contrast on the base. */
  detail: string;
  /** Sensor pod colour. */
  pod: string;
  light: boolean;
}

/** Colours are personal choices, not matched to skin tone or ethnicity. */
export const COLOURS: ColourOption[] = [
  { key: "sand", name: "Light beige / sand", base: "#d6bf9c", detail: "#b89f7b", pod: "#a58c69", light: true },
  { key: "medium-brown", name: "Warm medium brown", base: "#99694a", detail: "#7f553a", pod: "#5f3f2b", light: false },
  { key: "deep-brown", name: "Deep brown", base: "#55372a", detail: "#40291f", pod: "#2e1d16", light: false },
  { key: "charcoal", name: "Charcoal / black", base: "#2f2d2c", detail: "#1f1e1d", pod: "#141313", light: false },
  { key: "taupe", name: "Soft taupe", base: "#a39484", detail: "#877868", pod: "#6c5f52", light: true },
  { key: "sage", name: "Muted sage", base: "#8e9c86", detail: "#73816c", pod: "#58644f", light: true },
];

export interface StyleOption {
  key: StyleKey;
  name: string;
  tagline: string;
  description: string;
  details: string[];
  caveat?: string;
}

export const STYLES: StyleOption[] = [
  {
    key: "everyday",
    name: "Everyday",
    tagline: "Thin, neutral and discreet",
    description: "A fine, smooth knit with a slim profile, designed to sit flat under trousers or workwear without drawing attention.",
    details: ["Ultra-fine knit", "Low-profile cuffs", "Flat sensor pods"],
  },
  {
    key: "active",
    name: "Active",
    tagline: "Breathable and technical",
    description: "A technical fabric with ventilation zones, for the daily movement and exercise your physiotherapist has approved.",
    details: ["Ventilated side panels", "Quick-dry yarn", "Firmer grip cuffs"],
  },
  {
    key: "comfort",
    name: "Comfort",
    tagline: "Soft and flexible for longer wear",
    description: "A softer, ribbed fabric with extra stretch for extended wear.",
    details: ["Soft ribbed knit", "Wider, gentler cuffs", "Extra-stretch behind the knee"],
    caveat: "Suitability for extended wear would be subject to fit and safety testing.",
  },
];
