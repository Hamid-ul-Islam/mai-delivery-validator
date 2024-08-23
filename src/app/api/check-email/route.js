import { NextResponse } from "next/server";
import dns from "dns/promises"; // Use the promises version for async/await

export async function POST(request) {
  try {
    const { email } = await request.json();
    console.log(email);

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const isValid = await validateEmailDomain(email);
    return NextResponse.json({ isValid });
  } catch (error) {
    console.error("Error checking email deliverability:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

const validateEmailDomain = async (email) => {
  const domain = email.split("@")[1];
  if (!domain) {
    return false;
  }

  try {
    const addresses = await dns.resolveMx(domain);
    return addresses.length > 0;
  } catch (err) {
    return false;
  }
};
