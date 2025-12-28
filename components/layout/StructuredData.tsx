import { profile, socialLinks } from "@/constants/profile";

export function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title,
    description: profile.description,
    url: profile.siteUrl,
    image: `${profile.siteUrl}${profile.profileImage}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Accra",
      addressCountry: "Ghana",
    },
    sameAs: [
      socialLinks.github,
      socialLinks.linkedin,
    ],
    knowsAbout: [
      "Software Engineering",
      "Systems Engineering",
      "Monitoring Platforms",
      "Workflow Automation",
      "Full Stack Development",
      "API Development",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
