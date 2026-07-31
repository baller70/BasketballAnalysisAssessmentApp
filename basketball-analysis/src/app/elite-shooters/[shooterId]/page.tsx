import EliteShooterDetailClient from "./EliteShooterDetailClient"

/**
 * Server wrapper so the route participates in `output: 'export'` (GitHub
 * Pages preview). At runtime the client resolves any id/slug against
 * /api/shooters; these params only decide which paths are pre-rendered.
 */
export function generateStaticParams() {
  return [
    "stephen-curry", "ray-allen", "klay-thompson", "kyle-korver",
    "reggie-miller", "diana-taurasi", "sue-bird", "damian-lillard",
  ].map((shooterId) => ({ shooterId }))
}

export const dynamicParams = true

export default function Page() {
  return <EliteShooterDetailClient />
}
