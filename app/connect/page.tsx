"use client";

import Image from "next/image";
import { Phone, Mail, MessageCircle, Download, Globe, Linkedin } from "lucide-react";
import { profile, socialLinks } from "@/constants/profile";
import { downloadVCard } from "@/lib/vcard";

export default function ConnectPage() {
  const handleSaveContact = () => {
    downloadVCard(
      {
        firstName: profile.firstName,
        lastName: profile.surname,
        fullName: profile.name,
        title: profile.title,
        email: profile.email,
        phone: profile.phone,
        website: profile.siteUrl,
        linkedin: socialLinks.linkedin,
        location: profile.location,
      },
      profile.surname.toLowerCase()
    );
  };

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="w-full max-w-xs mx-auto">
        {/* Card Container */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[var(--andromeda-secondary)] to-[var(--andromeda-primary)] p-6 border border-white/5 light:border-black/5 shadow-2xl shadow-black/20">
          {/* Subtle glow effect */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[var(--andromeda-accent-beige)]/10 to-transparent opacity-50 pointer-events-none" />

          {/* Identity Block */}
          <section className="relative text-center mb-8">
            {/* Avatar */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[var(--andromeda-accent-beige)]/30 to-transparent" />
              <Image
                src={profile.profileImage}
                alt={profile.name}
                width={80}
                height={80}
                className="relative rounded-full object-cover ring-2 ring-[var(--andromeda-primary)] ring-offset-2 ring-offset-[var(--andromeda-secondary)]"
              />
            </div>

            <h1 className="text-xl font-semibold text-[var(--andromeda-text-primary)] mb-0.5">
              {profile.name}
            </h1>
            <p className="text-sm font-medium text-[var(--andromeda-accent-beige)] mb-3">
              {profile.title}
            </p>
            <p className="text-xs text-[var(--andromeda-text-secondary)] leading-relaxed max-w-[240px] mx-auto">
              I design and engineer software that quietly saves businesses time, money, and headaches.
            </p>
          </section>

          {/* Primary Contact Actions */}
          <section className="relative space-y-2 mb-6">
            {/* Call - Primary */}
            <a
              href={`tel:${profile.phone}`}
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] text-sm font-medium rounded-lg hover:bg-[var(--andromeda-accent-beige)]/90 transition-colors"
            >
              <Phone size={16} strokeWidth={2.5} />
              <span>Call</span>
            </a>

            {/* Email */}
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-white/5 light:bg-black/5 text-[var(--andromeda-text-primary)] text-sm font-medium rounded-lg border border-white/10 light:border-black/10 hover:bg-white/10 light:hover:bg-black/10 transition-colors"
            >
              <Mail size={16} strokeWidth={2} />
              <span>Email</span>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${profile.phone.replace(/\+/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-white/5 light:bg-black/5 text-[var(--andromeda-text-primary)] text-sm font-medium rounded-lg border border-white/10 light:border-black/10 hover:bg-white/10 light:hover:bg-black/10 transition-colors"
            >
              <MessageCircle size={16} strokeWidth={2} />
              <span>WhatsApp</span>
            </a>

            {/* Save Contact */}
            <button
              onClick={handleSaveContact}
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-white/5 light:bg-black/5 text-[var(--andromeda-text-primary)] text-sm font-medium rounded-lg border border-white/10 light:border-black/10 hover:bg-white/10 light:hover:bg-black/10 transition-colors"
            >
              <Download size={16} strokeWidth={2} />
              <span>Save Contact</span>
            </button>
          </section>

          {/* Divider */}
          <div className="relative h-px bg-gradient-to-r from-transparent via-white/10 light:via-black/10 to-transparent mb-5" />

          {/* Secondary Actions */}
          <section className="relative flex items-center justify-center gap-4">
            <a
              href="/"
              className="flex items-center gap-1.5 text-xs text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)] transition-colors"
            >
              <Globe size={13} />
              <span>Website</span>
            </a>
            <span className="text-[var(--andromeda-text-secondary)]/30">·</span>
            <a
              href={socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)] transition-colors"
            >
              <Linkedin size={13} />
              <span>LinkedIn</span>
            </a>
          </section>
        </div>

        {/* Soft Close - Outside card */}
        <p className="text-center text-xs text-[var(--andromeda-text-secondary)]/40 mt-6">
          Happy to chat if it makes sense.
        </p>
      </div>
    </main>
  );
}
