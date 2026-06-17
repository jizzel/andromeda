import { NextResponse } from "next/server";
import { sendMilestoneEmail } from "@/lib/email";

export async function GET() {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "dev only" }, { status: 403 });
    }
    await sendMilestoneEmail({
        to: "juxluvjoe@gmail.com",
        clientName: "Joseph",
        proposalId: "njoy-hotel",
        projectTitle: "Digital Visibility & Growth Foundation",
        phaseTitle: "Design & Development",
        milestoneLabel: "N'Joy Hotel website",
        note: "Your staging site is ready at staging.njoy.attakorah.com — take a look when you have a moment and let me know your thoughts by Friday.",
    });
    return NextResponse.json({ ok: true });
}
