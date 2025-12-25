import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DEAF|HUB",
    short_name: "DEAFHUB",
    description: "Premium esports platform for Deaf and Hard of Hearing gamers.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0F14",
    theme_color: "#0A0F14",
    icons: [
      {
        src: "/brand/dh.png",
        sizes: "500x500",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "256x256",
        type: "image/x-icon",
      },
    ],
  };
}
