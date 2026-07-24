import "dotenv/config"
import { sanitizeSecret } from "@/lib/shooterResearch"
import { verifyIproyalProxy } from "@/lib/shooterMediaResearch"

async function main() {
  try {
    const result = await verifyIproyalProxy()
    console.log(`IPRoyal proxy verified; exit IP ${result.exitIp}`)
  } catch (error) {
    console.error(sanitizeSecret(error))
    process.exit(1)
  }
}

main()
