"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function verifyInviteCode(formData: FormData) {
    const code = formData.get("code") as string;

    // The two valid codes
    const validCodes = ["fh371jfk", "r329hgk"];

    if (validCodes.includes(code)) {
        // Set the cookie for 30 days
        cookies().set("fitmax_invite_code", code, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        redirect("/login");
    } else {
        redirect("/invite?error=" + encodeURIComponent("Invalid invitation code."));
    }
}
