/**
 * Downloads the executed agreement PDF: with the access code, or (no code)
 * the signer session cookie from signing. Resolves to an error message, or
 * null on success.
 */
export async function downloadAgreementPdf(proposalId: string, accessCode?: string): Promise<string | null> {
  const response = await fetch("/api/proposal/agreement/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposalId, ...(accessCode && { accessCode }) }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    return data.error ?? "Couldn't prepare the PDF. Try again.";
  }
  const filename = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "agreement.pdf";
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return null;
}
