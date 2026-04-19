"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Image,
  Utensils,
  Palette,
  Globe,
  Building2,
  ShoppingBag,
  Camera,
  FileCheck,
  Share2,
  Clock,
  FolderOpen,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import type { AssetRequest } from "@/types/proposal";
import Link from "next/link";

interface AssetsContentProps {
  proposalId: string;
  accessCode: string;
  assets: AssetRequest;
  clientName: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  file: FileText,
  image: Image,
  food: Utensils,
  palette: Palette,
  web: Globe,
  building: Building2,
  shopping: ShoppingBag,
  camera: Camera,
  document: FileCheck,
  social: Share2,
};

function getIcon(name?: string) {
  return name && iconMap[name] ? iconMap[name] : FileText;
}

export function AssetsContent({ proposalId, accessCode, assets, clientName }: AssetsContentProps) {
  const { trackProposalAssetItemToggled, trackProposalUploadFolderOpened } = useAnalytics();
  const totalItems = assets.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  // Track pending writes per itemId to debounce rapid toggles
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());

  // Load initial checklist state from Sheets
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/proposal/assets?proposalId=${encodeURIComponent(proposalId)}&accessCode=${encodeURIComponent(accessCode)}`
        );
        const data = await res.json();
        if (data.success) {
          setCheckedIds(new Set(data.checkedIds));
        } else {
          setSyncError("Couldn't load your saved progress. Changes may not persist.");
        }
      } catch {
        setSyncError("Couldn't load your saved progress. Changes may not persist.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [proposalId, accessCode]);

  const handleToggle = useCallback(
    async (itemId: string) => {
      if (loading) return;

      const wasChecked = checkedIds.has(itemId);
      const nowChecked = !wasChecked;

      // Optimistic update
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (nowChecked) next.add(itemId);
        else next.delete(itemId);
        return next;
      });
      setSyncError(null);
      setPendingToggles((prev) => new Set(prev).add(itemId));

      try {
        const res = await fetch("/api/proposal/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposalId, accessCode, itemId, checked: nowChecked }),
        });
        const data = await res.json();
        if (data.success) {
          trackProposalAssetItemToggled({ proposal_id: proposalId, item_id: itemId, checked: nowChecked });
        } else {
          // Roll back
          setCheckedIds((prev) => {
            const next = new Set(prev);
            if (wasChecked) next.add(itemId);
            else next.delete(itemId);
            return next;
          });
          setSyncError("Failed to save. Please try again.");
        }
      } catch {
        // Roll back
        setCheckedIds((prev) => {
          const next = new Set(prev);
          if (wasChecked) next.add(itemId);
          else next.delete(itemId);
          return next;
        });
        setSyncError("Connection error. Please try again.");
      } finally {
        setPendingToggles((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    },
    [loading, checkedIds, proposalId, accessCode, trackProposalAssetItemToggled]
  );

  const checkedCount = checkedIds.size;
  const progressPercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <main className="min-h-screen bg-[var(--andromeda-primary)]">
      {/* Hero */}
      <section className="relative w-full py-20 px-6 bg-gradient-to-b from-[var(--andromeda-secondary)] to-[var(--andromeda-primary)]">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <Link
              href={`/proposal/${proposalId}`}
              className="inline-flex items-center gap-2 text-sm text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)] transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to proposal
            </Link>

            <p className="text-sm font-medium text-[var(--andromeda-accent-beige)] uppercase tracking-widest mb-3">
              {clientName}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-[var(--andromeda-text-primary)] mb-4">
              Project Assets
            </h1>
            {assets.intro && (
              <p className="text-lg text-[var(--andromeda-text-secondary)] max-w-2xl">
                {assets.intro}
              </p>
            )}
          </ScrollReveal>

          {/* Meta row */}
          <ScrollReveal delay={0.15}>
            <div className="flex flex-wrap items-center gap-4 mt-8">
              {assets.deadline && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--andromeda-accent-beige)]/10 border border-[var(--andromeda-accent-beige)]/30">
                  <Clock className="w-4 h-4 text-[var(--andromeda-accent-beige)]" />
                  <span className="text-sm text-[var(--andromeda-accent-beige)] font-medium">
                    {assets.deadline}
                  </span>
                </div>
              )}
              {assets.uploadUrl && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    asChild
                    className="bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 font-semibold"
                  >
                    <a
                      href={assets.uploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackProposalUploadFolderOpened({ proposal_id: proposalId })}
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      {assets.uploadLabel ?? "Open upload folder"}
                    </a>
                  </Button>
                </motion.div>
              )}
            </div>
          </ScrollReveal>

          {/* Progress bar */}
          <ScrollReveal delay={0.25}>
            <div className="mt-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--andromeda-text-secondary)]">
                  {loading ? "Loading progress…" : `${checkedCount} of ${totalItems} items provided`}
                </span>
                <span className="text-sm font-semibold text-[var(--andromeda-accent-beige)]">
                  {loading ? "—" : `${progressPercent}%`}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 light:bg-black/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[var(--andromeda-accent-beige)]"
                  initial={{ width: 0 }}
                  animate={{ width: loading ? "0%" : `${progressPercent}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              {syncError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 mt-3 text-sm text-red-400"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {syncError}
                </motion.div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Categories */}
      <section className="w-full py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assets.categories.map((category, catIndex) => {
              const Icon = getIcon(category.icon);
              return (
                <ScrollReveal key={category.id} delay={0.1 * (catIndex + 1)}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 rounded-lg bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10 h-full flex flex-col"
                  >
                    {/* Card header */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className="p-3 rounded-lg bg-[var(--andromeda-accent-beige)]/10 shrink-0">
                        <Icon className="w-5 h-5 text-[var(--andromeda-accent-beige)]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-[var(--andromeda-text-primary)] leading-snug">
                          {category.title}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-[var(--andromeda-text-secondary)] mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Meta */}
                    {(category.minimumCount || category.deadline) && (
                      <div className="flex flex-wrap gap-3 mb-4">
                        {category.minimumCount && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 light:bg-black/5 text-[var(--andromeda-text-secondary)]">
                            Min. {category.minimumCount} items
                          </span>
                        )}
                        {category.deadline && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 light:bg-black/5 text-[var(--andromeda-text-secondary)]">
                            <Clock className="w-3 h-3 inline mr-1 opacity-70" />
                            {category.deadline}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Checklist items */}
                    <ul className="space-y-2.5 flex-1">
                      {category.items.map((item) => {
                        const isChecked = checkedIds.has(item.id);
                        const isPending = pendingToggles.has(item.id);
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => handleToggle(item.id)}
                              disabled={loading || isPending}
                              className="w-full flex items-start gap-3 text-left group focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="shrink-0 mt-0.5">
                                {isChecked ? (
                                  <CheckCircle2 className="w-4 h-4 text-[var(--andromeda-accent-beige)]" />
                                ) : (
                                  <span className="w-4 h-4 rounded-full border border-white/30 light:border-black/30 group-hover:border-[var(--andromeda-accent-beige)]/60 transition-colors inline-block" />
                                )}
                              </span>
                              <span
                                className={`text-sm leading-snug transition-colors ${
                                  isChecked
                                    ? "line-through text-[var(--andromeda-text-secondary)]/50"
                                    : "text-[var(--andromeda-text-secondary)] group-hover:text-[var(--andromeda-text-primary)]"
                                }`}
                              >
                                {item.label}
                                {item.note && (
                                  <span className="block text-xs text-[var(--andromeda-text-secondary)]/60 mt-0.5 no-underline">
                                    {item.note}
                                  </span>
                                )}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Category note */}
                    {category.note && (
                      <p className="text-xs text-[var(--andromeda-text-secondary)]/60 mt-4 pt-4 border-t border-white/10 light:border-black/10">
                        {category.note}
                      </p>
                    )}
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Footer */}
          {assets.delayNotice && (
            <ScrollReveal delay={0.1}>
              <div className="mt-12 p-5 rounded-lg bg-[var(--andromeda-accent-beige)]/5 border border-[var(--andromeda-accent-beige)]/20 text-center">
                <p className="text-sm text-[var(--andromeda-text-secondary)]">
                  <Clock className="w-4 h-4 inline mr-1.5 text-[var(--andromeda-accent-beige)] opacity-70" />
                  {assets.delayNotice}
                </p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>
    </main>
  );
}
