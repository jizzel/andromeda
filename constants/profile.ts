function req(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function reqUrl(name: string, value: string | undefined): string {
  const v = req(name, value);
  try {
    new URL(v);
  } catch {
    throw new Error(`Env var ${name} must be a valid absolute URL (got: ${JSON.stringify(v)})`);
  }
  return v;
}

const emailAddress = req("NEXT_PUBLIC_PROFILE_EMAIL", process.env.NEXT_PUBLIC_PROFILE_EMAIL);

const firstName = req("NEXT_PUBLIC_PROFILE_FIRST_NAME", process.env.NEXT_PUBLIC_PROFILE_FIRST_NAME);
const middleName = process.env.NEXT_PUBLIC_PROFILE_MIDDLE_NAME || "";
const surname = req("NEXT_PUBLIC_PROFILE_SURNAME", process.env.NEXT_PUBLIC_PROFILE_SURNAME);
const fullName = [firstName, middleName, surname].filter(Boolean).join(" ");

export const socialLinks = {
  github: reqUrl("NEXT_PUBLIC_SOCIAL_GITHUB", process.env.NEXT_PUBLIC_SOCIAL_GITHUB),
  linkedin: reqUrl("NEXT_PUBLIC_SOCIAL_LINKEDIN", process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN),
  email: `mailto:${emailAddress}`,
  calendly: reqUrl("NEXT_PUBLIC_SOCIAL_CALENDLY", process.env.NEXT_PUBLIC_SOCIAL_CALENDLY),
};

export const profile = {
  name: fullName,
  firstName,
  middleName,
  surname,
  title: "Software Engineer",
  focus: "Systems • Monitoring • Operations",
  location: req("NEXT_PUBLIC_PROFILE_LOCATION", process.env.NEXT_PUBLIC_PROFILE_LOCATION),
  tagline: "Building systems that turn operational complexity into clarity.",
  availability: "Available for remote collaboration worldwide",
  phone: req("NEXT_PUBLIC_PROFILE_PHONE", process.env.NEXT_PUBLIC_PROFILE_PHONE),
  email: emailAddress,

  // Business Card specific
  profileImage: req("NEXT_PUBLIC_PROFILE_IMAGE", process.env.NEXT_PUBLIC_PROFILE_IMAGE),

  // SEO & Meta
  description: "Building software that automates operations. Systems, monitoring, and workflow automation.",
  keywords: [
    "Software Engineer",
    "Systems Engineering",
    "Monitoring Platforms",
    "Workflow Automation",
    "Full Stack Development",
    "Backend Development",
    "API Development",
    "Ghana",
    "Accra",
  ],
  siteUrl: reqUrl("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL),
};
