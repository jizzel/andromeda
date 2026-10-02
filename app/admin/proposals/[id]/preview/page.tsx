import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-auth";
import { getProposalById } from "@/lib/google-sheets";
import { ProposalPreview } from "@/components/admin/ProposalPreview";

export const dynamic = "force-dynamic";

/** Embedded by the editor; starts from the saved data, then follows the draft via postMessage. */
export default async function AdminProposalPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const record = await getProposalById(id);
  if (!record) notFound();
  return <ProposalPreview proposalId={id} initial={record.data} />;
}
