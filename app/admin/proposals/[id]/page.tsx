import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-auth";
import { getProposalAcceptance, getProposalRowForEdit, getProposalSnapshot, getPublishedRevision } from "@/lib/google-sheets";
import { proposalVersion } from "@/lib/proposal-version";
import { profile } from "@/constants/profile";
import { ProposalEditor } from "@/components/admin/ProposalEditor";

export const dynamic = "force-dynamic";

/** Best-effort: the publish dialog falls back to diffing against the saved row. */
async function changeRequestSnapshot(id: string, version: string | undefined): Promise<string | null> {
  if (!version) return null;
  try {
    return await getProposalSnapshot(id, version);
  } catch (error) {
    console.error(`Couldn't load the change-request snapshot for ${id}@${version}:`, error);
    return null;
  }
}

export default async function AdminProposalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const [row, acceptance] = await Promise.all([getProposalRowForEdit(id), getProposalAcceptance(id)]);
  if (!row) notFound();
  const version = proposalVersion(row.record.data);
  const [requestSnapshot, publishedRevision] = await Promise.all([
    changeRequestSnapshot(id, acceptance?.status === "counter" ? acceptance.proposalVersion : undefined),
    getPublishedRevision(id, version),
  ]);

  return (
    <ProposalEditor
      proposalId={id}
      initial={{
        accessCode: row.record.accessCode,
        expiryDate: row.record.expiryDate,
        isActive: row.record.isActive,
        data: row.record.data,
        rowHash: row.rowHash,
        proposalVersion: version,
      }}
      acceptance={acceptance}
      changeRequestSnapshot={requestSnapshot}
      publishedRevision={publishedRevision}
      clientLink={`${profile.siteUrl}/proposal/${id}`}
    />
  );
}
