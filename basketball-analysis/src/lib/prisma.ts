import { PrismaClient } from "@prisma/client"

/**
 * EVERY CONNECTION RUNS IN UTC, and this is a correctness fix rather than a
 * preference.
 *
 * All 55 timestamp columns in this schema are `timestamp WITHOUT TIME ZONE`,
 * and 30-odd of them default to `CURRENT_TIMESTAMP`. `CURRENT_TIMESTAMP` is a
 * `timestamptz`; assigning it to a naive column casts it through the SESSION's
 * TimeZone, and Prisma reads the naive value back as if it were UTC. So on any
 * database whose TimeZone is not UTC, every default-written timestamp in the
 * product is silently shifted by the deployment's offset. Measured on this
 * database with a temp table carrying the same default:
 *
 *     Etc/UTC             0 min
 *     Europe/Berlin    +120 min
 *     America/New_York -240 min
 *
 * A default `initdb` takes TimeZone from the host, so the UTC container this is
 * developed in is the one configuration where none of it appears.
 *
 * It is not cosmetic. Sixteen sites compare these columns against JS time, and
 * two of them are load-bearing:
 *
 *   points cooldown   `Date.now() - last.createdAt.getTime() < action.cooldown`
 *                     west of UTC the gap reads hours too LARGE, so the
 *                     cooldown never applies and points can be farmed
 *   daily cap / week  `createdAt: { gte: dayStart }` and the week filter select
 *                     the wrong rows by the same offset
 *   night-owl badge   `createdAt.getUTCHours() >= 22` awards on the wrong hours
 *
 * Fixing thirty call sites would leave the thirty-first to be written later.
 * Setting the session timezone once makes the whole class impossible: with the
 * session in UTC, `CURRENT_TIMESTAMP` casts to UTC, which is what every reader
 * already assumes. This is the sibling sweep method rule 81 asks for, run after
 * the same defect was found twice inside the verification-token layer.
 *
 * The option is appended to the connection URL rather than issued as a `SET`,
 * because Prisma pools connections and a statement only configures the one
 * connection it lands on; `options` is applied by Postgres to every session at
 * startup. An explicit `timezone` already present in the URL is left alone, so
 * a deployment can still override this deliberately.
 */
function utcUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw
  try {
    const u = new URL(raw)
    const existing = u.searchParams.get("options") || ""
    if (/(^|\s)-c\s*timezone=/i.test(existing) || u.searchParams.has("timezone")) return raw
    u.searchParams.set("options", `${existing} -c timezone=UTC`.trim())
    return u.toString()
  } catch {
    // Unparseable URL — leave it untouched rather than corrupt it. The schema
    // audit above still stands; it just is not enforced here.
    return raw
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const url = utcUrl(process.env.DATABASE_URL)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
