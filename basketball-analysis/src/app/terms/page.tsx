import Link from "next/link"

export const metadata = { title: "Terms of Use — ShotIQ" }

/** /terms — linked from account creation; plain canonical text page. */
export default function TermsPage() {
  return (
    <div className="shotiq-canonical mx-auto max-w-[760px] bg-[var(--shotiq-color-paper)] px-[32px] py-[48px] text-[var(--shotiq-color-ink)]">
      <span className="shotiq-wordmark text-[24px]">SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span></span>
      <h1 className="shotiq-display mt-[18px] text-[42px] leading-[46px]">TERMS OF USE</h1>
      <div className="mt-[18px] space-y-[14px] text-[14px] leading-[21px] text-[var(--shotiq-color-graphite)]">
        <p>ShotIQ provides AI-assisted basketball shot analysis for training purposes. By creating an account you agree to use the service for personal, non-commercial training and to upload only media you have the right to share.</p>
        <p>Analysis results are coaching guidance, not medical or professional advice. Scores and recommendations are estimates produced by automated analysis and may not be perfectly accurate.</p>
        <p>You are responsible for keeping your account credentials secure. You may delete your account and associated data at any time from Settings.</p>
        <p>The service is provided as-is; availability and features may change as ShotIQ evolves.</p>
      </div>
      <Link href="/signup" className="mt-[26px] inline-block text-[14px] text-[var(--shotiq-color-analysisBlue)]">‹ Back to create account</Link>
    </div>
  )
}
