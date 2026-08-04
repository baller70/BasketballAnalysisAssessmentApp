import Link from "next/link"

export const metadata = { title: "Privacy Policy — ShotIQ" }

/** /privacy — linked from account creation; plain canonical text page. */
export default function PrivacyPage() {
  return (
    <div className="shotiq-canonical mx-auto max-w-[760px] bg-[var(--shotiq-color-paper)] px-[32px] py-[48px] text-[var(--shotiq-color-ink)]">
      <span className="shotiq-wordmark text-[20px]">SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span></span>
      <h1 className="shotiq-display mt-[18px] text-[42px] leading-[46px]">PRIVACY POLICY</h1>
      <div className="mt-[18px] space-y-[14px] text-[14px] leading-[21px] text-[var(--shotiq-color-graphite)]">
        <p>ShotIQ stores the account details you provide (name, email) and the media you upload for analysis. Uploaded photos and videos are processed to produce shot metrics and are visible only to your account.</p>
        <p>We do not sell your data. Analysis data is used to power your history, progress tracking, goals, and coaching recommendations inside the app.</p>
        <p>You can export or delete your data from Settings → Data and privacy. Deleting your account removes your profile, media, and analysis history.</p>
        <p>Session authentication uses secure, httpOnly cookies. Contact support from Settings → Help and support for any privacy question.</p>
      </div>
      <Link href="/signup" className="mt-[26px] inline-block text-[14px] text-[var(--shotiq-color-analysisBlue)]">‹ Back to create account</Link>
    </div>
  )
}
