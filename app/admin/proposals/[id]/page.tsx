import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-auth";
import { getProposalAcceptance, getProposalRowForEdit } from "@/lib/google-sheets";
import { proposalVersion } from "@/lib/proposal-version";
import { profile } from "@/constants/profile";
import { ProposalEditor } from "@/components/admin/ProposalEditor";

export const dynamic = "force-dynamic";

export default async function AdminProposalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const [row, acceptance] = await Promise.all([getProposalRowForEdit(id), getProposalAcceptance(id)]);
  if (!row) notFound();

  return (
    <ProposalEditor
      proposalId={id}
      initial={{
        accessCode: row.record.accessCode,
        expiryDate: row.record.expiryDate,
        isActive: row.record.isActive,
        data: row.record.data,
        rowHash: row.rowHash,
        proposalVersion: proposalVersion(row.record.data),
      }}
      acceptance={acceptance}
      clientLink={`${profile.siteUrl}/proposal/${id}`}
    />
  );
}
