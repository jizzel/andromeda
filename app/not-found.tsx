"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

export default function NotFound() {
  return (
    <main className="relative w-full min-h-screen bg-[var(--andromeda-primary)] flex items-center justify-center px-6">
      <div className="max-w-2xl mx-auto text-center">
        <ScrollReveal>
          {/* 404 Number */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-[var(--andromeda-accent-beige)]/20">
              404
            </h1>
          </div>

          {/* Message */}
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--andromeda-text-primary)]">
            Page Not Found
          </h2>

          <p className="text-lg text-[var(--andromeda-text-secondary)] mb-12 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Navigation Options */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[var(--andromeda-highlight)] text-white hover:bg-[var(--andromeda-highlight)]/90 transition-colors"
            >
              <Home size={20} />
              <span>Go Home</span>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[var(--andromeda-secondary)] text-[var(--andromeda-text-primary)] border border-white/10 light:border-black/10 hover:bg-[var(--andromeda-secondary)]/80 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Go Back</span>
            </button>
          </div>

          {/* Helpful Links */}
          <div className="mt-16 pt-8 border-t border-white/10 light:border-black/10">
            <p className="text-sm text-[var(--andromeda-text-secondary)] mb-4">
              You might be looking for:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link
                href="/#projects"
                className="text-[var(--andromeda-highlight)] hover:underline transition-colors"
              >
                Projects
              </Link>
              <span className="text-[var(--andromeda-text-secondary)]">·</span>
              <Link
                href="/writing"
                className="text-[var(--andromeda-highlight)] hover:underline transition-colors"
              >
                Writing
              </Link>
              <span className="text-[var(--andromeda-text-secondary)]">·</span>
              <Link
                href="/#capabilities"
                className="text-[var(--andromeda-highlight)] hover:underline transition-colors"
              >
                Capabilities
              </Link>
              <span className="text-[var(--andromeda-text-secondary)]">·</span>
              <Link
                href="/#connect"
                className="text-[var(--andromeda-highlight)] hover:underline transition-colors"
              >
                Connect
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}
