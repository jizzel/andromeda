import Image from "next/image";

interface ProjectLogoProps {
  src: string; // base path without _dark/_light suffix, e.g. "/projects/rcmonsys_logo"
  size: number; // height in px
  className?: string;
}

/**
 * Renders a project logo that switches between dark/light SVG variants
 * based on the active theme class on <html> (dark or light).
 *
 * Note: width={0} + style={{ width: "auto" }} is the standard Next.js community
 * pattern for height-constrained images with proportional width. The `fill` prop
 * alternative requires a container with a known width, which isn't available here
 * since each logo has a different aspect ratio.
 */
export function ProjectLogo({ src, size, className = "" }: ProjectLogoProps) {
  const base = `object-contain ${className}`.trim();

  return (
    <>
      {/* Shown in dark mode */}
      <Image
        src={`${src}_dark.svg`}
        alt="Project logo"
        width={0}
        height={size}
        style={{ width: "auto", height: `${size}px` }}
        className={`${base} hidden dark:block`}
      />
      {/* Shown in light mode */}
      <Image
        src={`${src}_light.svg`}
        alt="Project logo"
        width={0}
        height={size}
        style={{ width: "auto", height: `${size}px` }}
        className={`${base} block dark:hidden`}
      />
    </>
  );
}
