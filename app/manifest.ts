import { MetadataRoute } from "next";
import { profile } from "@/constants/profile";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${profile.name} - ${profile.title}`,
    short_name: profile.name,
    description: profile.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0F111A",
    theme_color: "#0F111A",
    icons: [
      {
        src: "/images/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
