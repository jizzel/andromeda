interface VCardData {
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  website?: string;
  linkedin?: string;
  location?: string;
}

/**
 * Generate a vCard string from contact data
 */
export function generateVCard(data: VCardData): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${data.fullName}`,
    `N:${data.lastName};${data.firstName};;;`,
    `TITLE:${data.title}`,
    `EMAIL;TYPE=INTERNET:${data.email}`,
    `TEL;TYPE=CELL:${data.phone}`,
  ];

  if (data.website) {
    lines.push(`URL:${data.website}`);
  }

  if (data.linkedin) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${data.linkedin}`);
  }

  if (data.location) {
    lines.push(`ADR;TYPE=WORK:;;${data.location};;;;`);
  }

  lines.push("END:VCARD");

  return lines.join("\r\n");
}

/**
 * Download vCard as a file
 */
export function downloadVCard(data: VCardData, filename: string = "contact"): void {
  const vcard = generateVCard(data);
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
