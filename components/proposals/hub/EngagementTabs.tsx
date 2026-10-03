"use client";

import { AssetsContent } from "../AssetsContent";
import { TrackerContent } from "../TrackerContent";
import { availableTabs, useClientHub } from "./ClientHubProvider";

function NotReady({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-[var(--andromeda-text-primary)] mb-3">{title}</h1>
      <p className="text-[var(--andromeda-text-secondary)]">{body}</p>
    </div>
  );
}

/** The Assets tab: the checklist once it's unlocked for this engagement. */
export function AssetsTab() {
  const hub = useClientHub();
  if (!availableTabs(hub).assets || !hub.proposal.assets) {
    // Locked until the agreement is signed (or switched on in admin).
    return <NotReady title="Asset Request Not Ready" body="The asset request for this proposal hasn't been prepared yet. Please check back later." />;
  }
  return <AssetsContent proposalId={hub.proposalId} accessCode="" assets={hub.proposal.assets} clientName={hub.proposal.client.name} />;
}

/** The Progress tab: the project tracker once it's unlocked. */
export function ProgressTab() {
  const hub = useClientHub();
  if (!availableTabs(hub).progress || !hub.proposal.tracker) {
    return <NotReady title="Tracker Not Ready Yet" body="Your project tracker will appear here once the engagement kicks off. Please check back soon." />;
  }
  return (
    <TrackerContent
      proposalId={hub.proposalId}
      accessCode=""
      clientName={hub.proposal.client.name}
      proposalTitle={hub.proposal.title}
      config={hub.proposal.tracker}
      timeline={hub.proposal.timeline}
    />
  );
}
