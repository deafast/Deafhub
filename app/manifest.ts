import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DEAF|HUB",
    short_name: "DEAFHUB",
    description: "DeafHub — a community esports project for Deaf and hard of hearing players.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0F14",
    theme_color: "#0A0F14",
    icons: [
      {
        src: "/branding/browser-2026-10-30/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/branding/browser-2026-10-30/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

