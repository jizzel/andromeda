import { ImageResponse } from "next/og";
import { profile } from "@/constants/profile";

export const runtime = "edge";
export const alt = `${profile.name} - ${profile.title}`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0F111A",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1B1E2B 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1B1E2B 2%, transparent 0%)",
          backgroundSize: "100px 100px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#E5E5E5",
              marginBottom: 20,
              letterSpacing: "-0.02em",
            }}
          >
            {profile.name}
          </div>
          <div
            style={{
              fontSize: 48,
              color: "#A0A0A0",
              marginBottom: 40,
            }}
          >
            {profile.title}
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#F5EBDD",
              textAlign: "center",
              maxWidth: "900px",
              lineHeight: 1.4,
            }}
          >
            {profile.tagline}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#A0A0A0",
              marginTop: 40,
              display: "flex",
              alignItems: "center",
            }}
          >
            {profile.focus}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
