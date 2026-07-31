import DrillExecutionClient from "./DrillExecutionClient"

/** Server wrapper for `output: 'export'`; drill name derives from the slug. */
export function generateStaticParams() {
  return [
    "pound-crossover-foundation", "quick-release-builder",
    "wall-elbow-alignment", "free-throw-ladder",
  ].map((drillId) => ({ drillId }))
}

export const dynamicParams = true

export default function Page() {
  return <DrillExecutionClient />
}
