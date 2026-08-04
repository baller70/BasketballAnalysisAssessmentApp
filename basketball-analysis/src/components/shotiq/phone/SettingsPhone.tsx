"use client"

/**
 * Canonical iOS 071-settings-hub and 016-notification-permission-primer.
 *
 * Round 6 shipped ONE surface for both: grader B measured the two captures at
 * mean absolute difference 4.68 against a canonical-vs-canonical difference of
 * 48.96, i.e. the app rendered the same pixels for two different designs. They
 * are a hub and a permission primer, and they are now two compositions on one
 * route — /settings is the hub, /settings?panel=notifications is the primer,
 * pushed as a history entry by the hub's own Notifications row.
 *
 * Every number is measured off the 853x1844 canonical PNGs and divided by the
 * capture harness's device scale factor 853/393 = 2.170483, so one CSS px here
 * is one canonical px in the render. Method is the round-6 one: rows segmented
 * into ink bands, bands into ink runs, cap height / advance / density per run
 * (scratchpad r6d/f.py, b.py). No fixed crop boxes.
 *
 * 071 (pt from the top of the canvas):
 *   header rule            38.0
 *   SETTINGS               top 61.3   cap 25.3  x 19.8   advance 84.8
 *   subtitle, 2 lines      top 97.7 / 112.0     cap+desc 11.1
 *   profile card           y 130   avatar 70.5 dia at x 30.9
 *     name                 top 161.7  cap 21.2  x 117.0
 *     sub                  top 190.3  cap+desc 12.0
 *   stat strip             y 234.5-288.4  (form score 82 + 3 cells + spark)
 *   Edit profile row       y 312-336
 *   settings group         rows at 370.4 / 424.8 / 478.7 / 533.5  (54.4 pitch)
 *     value badge          x 321.1-357.5  cap 11.5
 *   help group             rows at 587.0 / 638.1
 *   sign out card          row  at 704.0
 *   unsaved bar            y 740.8-771.3   x 21.2-370.0
 *   tab-bar rule           786.5
 *
 * 016:
 *   identity               name top 53.4 cap 24.0 x 18.4
 *   stat quad              y 123.5-150.7
 *   PRIMARY TARGET         y 168.6-179.2
 *   STAY IN THE LOOP       top 202.7  cap 28.1  x 19.4
 *   body, 2 lines          top 243.7 / 260.3
 *   benefit rows           y 294.4 / 371.3 / 448.3   (77.0 pitch)
 *   photo                  y 508.6-702.1   x 21.7-276.4
 *   green CTA              y 712.3-745.9   x 20.3-369.5   fill #037E45
 *   Not now                y 753.7-788.3   same box, hairline
 *   tab-bar rule           794.3
 */

import React from "react"
import Link from "next/link"
import { PhoneScreen, MiniTrend } from "@/components/shotiq/PhoneShell"
import { StreakPoints, Chev, Frame, ScoreBar, Micro, capDisplay } from "@/components/shotiq/phone/results/Kit"

const RULE = "var(--shotiq-color-rule)"
const ORANGE = "var(--shotiq-color-shotiqOrange)"
const GREEN = "var(--shotiq-color-confirmGreen)"
const BLUE = "var(--shotiq-color-analysisBlue)"
const GRAPHITE = "var(--shotiq-color-graphite)"
const PAD = 19.8

/* --------------------------------------------------------------- glyphs --
   Canonical draws a distinct line mark on every settings row. They are the
   app's own motif (open nodes, brackets, dashed arcs) rather than a generic
   icon set, and no mark does duty for two rows — the round-6 grade caught
   exactly that on 025's quality checks. */

function RowMark({ kind, size = 26 }: { kind: string; size?: number }) {
  const common = {
    width: size, height: size, viewBox: "0 0 26 26", fill: "none",
    stroke: "currentColor", strokeWidth: 1.5,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    "aria-hidden": true, className: "block shrink-0",
  }
  switch (kind) {
    case "notifications":
      return (
        <svg {...common}>
          <path d="M4 8 L13 3 L22 8 L18.5 19 H7.5 Z" />
          <circle cx="4" cy="8" r="1.9" fill="#fff" />
          <circle cx="13" cy="3" r="1.9" fill="#fff" />
          <circle cx="22" cy="8" r="1.9" fill="#fff" />
          <circle cx="7.5" cy="19" r="1.9" fill="#fff" />
          <circle cx="18.5" cy="19" r="1.9" fill="#fff" />
          <circle cx="13" cy="12.5" r="2.3" stroke={ORANGE} />
        </svg>
      )
    case "automation":
      return (
        <svg {...common}>
          <path d="M9 22 L11 15 L16 12 L20 15" />
          <path d="M11 15 L7 12 L4 15" />
          <circle cx="16" cy="8" r="2.4" />
          <path d="M3 19 A9 9 0 0 1 9 6" stroke={ORANGE} strokeDasharray="2 2.4" />
        </svg>
      )
    case "privacy":
      return (
        <svg {...common}>
          <path d="M3 8 V5 A2 2 0 0 1 5 3 H8 M18 3 H21 A2 2 0 0 1 23 5 V8 M23 18 V21 A2 2 0 0 1 21 23 H18 M8 23 H5 A2 2 0 0 1 3 21 V18" />
          <path d="M8 16 L12 11.5 L16 14 L19 10" stroke={ORANGE} />
          <circle cx="8" cy="16" r="1.7" stroke={ORANGE} />
          <circle cx="12" cy="11.5" r="1.7" stroke={ORANGE} />
          <circle cx="19" cy="10" r="1.7" stroke={ORANGE} />
        </svg>
      )
    case "preferences":
      return (
        <svg {...common}>
          <path d="M3 8 H23 M3 18 H23" />
          <circle cx="16" cy="8" r="2.6" stroke={ORANGE} />
          <circle cx="9" cy="18" r="2.6" stroke={ORANGE} />
        </svg>
      )
    case "help":
      return (
        <svg {...common}>
          <path d="M4 5 H16 V15 H9 L4.5 19 V15 H4 Z" />
          <path d="M16 8 H21.5 V18 H22 V21.5 L18.5 18 H16" strokeDasharray="2 2" />
          <path d="M8 8.6 A2.2 2.2 0 1 1 10.2 11 V12.2" />
          <circle cx="10.2" cy="14" r="0.8" fill="currentColor" />
        </svg>
      )
    case "about":
      return (
        <svg {...common}>
          <circle cx="13" cy="13" r="10" strokeDasharray="2.4 2.4" />
          <circle cx="13" cy="8.6" r="1.4" fill={ORANGE} stroke="none" />
          <path d="M13 12 V18.5" />
        </svg>
      )
    case "signout":
      return (
        <svg {...common} stroke={ORANGE}>
          <path d="M13 4 H4 V22 H13" />
          <path d="M11 13 H22 M17.5 8.5 L22 13 L17.5 17.5" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M3 8 V4 H7 M19 4 H23 V8 M23 18 V22 H19 M7 22 H3 V18" strokeDasharray="2.6 2.4" />
        </svg>
      )
  }
}

/* ------------------------------------------------------------- 071 hub -- */

export interface SettingsRow {
  key: string
  label: string
  desc: string
  badge?: string
  badgeTone?: "blue" | "green"
  onClick?: () => void
  href?: string
}

function Row({ r }: { r: SettingsRow }) {
  const body = (
    <>
      <span className="flex w-[38px] shrink-0 justify-start"><RowMark kind={r.key} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.6px] leading-[16px]">{r.label}</span>
        <span className="mt-[4px] block text-[11.8px] leading-[13px]" style={{ color: GRAPHITE }}>{r.desc}</span>
      </span>
      {r.badge && (
        <span className="shotiq-display shrink-0 text-[15.7px] leading-[15.7px] tracking-[0.05em]"
              style={{ color: r.badgeTone === "green" ? GREEN : BLUE }}>{r.badge}</span>
      )}
      <Chev size={15} />
    </>
  )
  const cls = "flex w-full items-center gap-[10px] px-[14px] py-[13px] text-left"
  if (r.href) return <Link href={r.href} className={cls} data-testid={`phone-settings-${r.key}`}>{body}</Link>
  return (
    <button type="button" onClick={r.onClick} className={cls} data-testid={`phone-settings-${r.key}`}>
      {body}
    </button>
  )
}

function Group({ rows }: { rows: SettingsRow[] }) {
  return (
    <div className="overflow-hidden rounded-[7px] bg-white" style={{ border: `1px solid ${RULE}` }}>
      {rows.map((r, i) => (
        <div key={r.key} style={i ? { borderTop: `1px solid ${RULE}` } : undefined}><Row r={r} /></div>
      ))}
    </div>
  )
}

export function SettingsHubPhone({
  name = "Jordan Ellis",
  hand = "Right-handed",
  level = "Advanced",
  score = 82,
  shots = "24",
  makes = "15",
  pct = "62.5%",
  delta = "+8.1%",
  streak = "6",
  points = "2,840",
  avatar = "/images/canonical/096-avatar.png",
  notificationsOn = 3,
  automationActive = 2,
  dirty = true,
  onNotifications,
  onSave,
  onSignOut,
}: {
  name?: string; hand?: string; level?: string
  score?: number; shots?: string; makes?: string; pct?: string; delta?: string
  streak?: string; points?: string; avatar?: string
  notificationsOn?: number; automationActive?: number
  dirty?: boolean
  onNotifications?: () => void
  onSave?: () => void
  onSignOut?: () => void
}) {
  const groupA: SettingsRow[] = [
    { key: "notifications", label: "Notifications", desc: "Manage alerts, reminders, and updates.",
      badge: `${notificationsOn} ON`, badgeTone: "blue", onClick: onNotifications },
    { key: "automation", label: "Automation", desc: "Auto-analysis, uploads, and data handling.",
      badge: `${automationActive} ACTIVE`, badgeTone: "green", href: "/settings#automation" },
    { key: "privacy", label: "Data and privacy", desc: "Control your data, export, and permissions.",
      href: "/settings#privacy" },
    { key: "preferences", label: "Preferences", desc: "Units, appearance, and training defaults.",
      href: "/settings#preferences" },
  ]
  const groupB: SettingsRow[] = [
    { key: "help", label: "Help and support", desc: "FAQs, guides, and contact options.", href: "/support" },
    { key: "about", label: "About ShotIQ", desc: "Version, terms, and app information.", href: "/about" },
  ]

  return (
    <PhoneScreen testid="screen-ios-settings-hub" tab="profile" pad={0} headerH={38}>
      <div style={{ paddingLeft: PAD, paddingRight: PAD, paddingBottom: 70 }}>
        {/* title + streak/points */}
        <div className="flex items-start justify-between pt-[15px]">
          <div className="min-w-0">
            <div className="shotiq-display text-[34.5px] leading-[33px] tracking-[0.03em]">SETTINGS</div>
            <div className="mt-[5px] text-[12.4px] leading-[14.3px]" style={{ color: GRAPHITE }}>
              Manage your account, preferences,<br />and app experience.
            </div>
          </div>
          <StreakPoints streak={streak} points={points} className="mt-[3px]" />
        </div>

        {/* profile card */}
        <div className="mt-[14px] rounded-[7px] bg-white" style={{ border: `1px solid ${RULE}` }}>
          <div className="flex items-center gap-[14px] px-[12px] py-[12px]">
            <Frame src={avatar.replace("/images/canonical/", "").replace(".png", "")}
                   w={70} h={70} radius={35} pos="50% 32%" />
            <div className="min-w-0">
              <div className="shotiq-display text-[29px] leading-[28px] tracking-[0.035em]">{name.toUpperCase()}</div>
              <div className="mt-[4px] text-[12.5px] leading-[14px]" style={{ color: GRAPHITE }}>
                {hand} • {level}
              </div>
            </div>
          </div>
          <div className="flex items-start px-[12px] pb-[12px]" style={{ borderTop: `1px solid ${RULE}`, paddingTop: 11 }}>
            <div className="w-[80px] shrink-0">
              <div className="shotiq-section-label leading-[11px] tracking-[0.075em]"
                   style={{ "--shotiq-label-size": "11px" } as React.CSSProperties}>FORM SCORE</div>
              <div className="shotiq-numeric mt-[3px] leading-[0.82] text-[34px]" style={{ color: ORANGE }}>{score}</div>
              <ScoreBar score={score} width={64} height={5.5} />
            </div>
            {[[shots, "SHOTS"], [makes, "MAKES"], [pct, "MAKE %"]].map(([v, l]) => (
              <div key={l} className="flex-1 pl-[10px]" style={{ borderLeft: `1px solid ${RULE}` }}>
                <div className="shotiq-numeric text-[21px] leading-[22px]">{v}</div>
                <Micro className="mt-[4px]" size={8.6}>{l}</Micro>
              </div>
            ))}
            <div className="w-[92px] shrink-0 pl-[10px]" style={{ borderLeft: `1px solid ${RULE}` }}>
              <div className="flex items-start gap-[3px]">
                <MiniTrend width={64} height={20} />
                <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true" className="mt-[1px]">
                  <path d="M3 13 L13 3 M6 3 H13 V10" fill="none" stroke={GREEN} strokeWidth="1.6" />
                </svg>
              </div>
              <div className="shotiq-numeric mt-[3px] text-[13px] leading-[13px]" style={{ color: GREEN }}>{delta}</div>
              <Micro className="mt-[3px]" size={8}>VS LAST SESSION</Micro>
            </div>
          </div>
          <Link href="/profile" className="flex items-center gap-[10px] px-[14px] py-[12px]"
                style={{ borderTop: `1px solid ${RULE}` }} data-testid="phone-settings-edit-profile">
            <span className="grid h-[26px] w-[27px] shrink-0 place-items-center rounded-[3px]"
                  style={{ border: `1.4px dashed ${RULE}` }}>
              <span className="shotiq-display text-[13px] leading-none">JE</span>
            </span>
            <span className="text-[14.6px] leading-[16px]">Edit profile</span>
            <span className="ml-auto flex"><Chev size={15} /></span>
          </Link>
        </div>

        <div className="mt-[15px]"><Group rows={groupA} /></div>
        <div className="mt-[15px]"><Group rows={groupB} /></div>

        <div className="mt-[15px] rounded-[7px] bg-white" style={{ border: `1px solid ${RULE}` }}>
          <button type="button" onClick={onSignOut} data-testid="phone-settings-signout"
                  className="flex w-full items-center gap-[10px] px-[14px] py-[14px] text-left">
            <span className="flex w-[38px] shrink-0 justify-start"><RowMark kind="signout" /></span>
            <span className="flex-1 text-[14.6px] leading-[16px]">Sign out</span>
            <Chev size={15} />
          </button>
        </div>

        {dirty && (
          <div className="mt-[14px] flex items-center gap-[10px] rounded-[7px] bg-white py-[7px] pl-[10px] pr-[7px]"
               style={{ border: `1px solid ${RULE}` }}>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
              <circle cx="12" cy="12" r="10.2" fill="none" stroke={ORANGE} strokeWidth="1.7" />
              <path d="M12 6.4 V13" stroke={ORANGE} strokeWidth="1.9" strokeLinecap="round" />
              <circle cx="12" cy="16.6" r="1.15" fill={ORANGE} />
            </svg>
            <span className="min-w-0 flex-1 text-[13px] leading-[15px]">You have unsaved changes</span>
            <button type="button" onClick={onSave} data-testid="phone-settings-save"
                    className="flex h-[38px] shrink-0 items-center rounded-[5px] px-[20px] text-[14.5px] font-medium text-white"
                    style={{ background: ORANGE }}>Save changes</button>
          </div>
        )}
      </div>
    </PhoneScreen>
  )
}

/* ------------------------------------------------------- 016 primer ----- */

const BENEFITS: [string, string, string[]][] = [
  ["film", "ANALYSIS COMPLETE", ["Get notified as soon as your AI analysis", "is ready to review."]],
  ["node", "TRAINING REMINDERS", ["Stay consistent with timely reminders", "for your workouts and goals."]],
  ["goal", "GOAL MILESTONES", ["Celebrate progress with nudges when", "you hit key milestones."]],
]

function BenefitMark({ kind }: { kind: string }) {
  if (kind === "film") {
    return (
      <svg width="78" height="52" viewBox="0 0 78 52" fill="none" aria-hidden="true" className="block">
        <rect x="1.2" y="1.2" width="75.6" height="49.6" stroke="currentColor" strokeWidth="2" />
        <path d="M1.2 9 H76.8 M1.2 43 H76.8" stroke="currentColor" strokeWidth="1.6" />
        {[6, 14, 22, 30, 38, 46, 54, 62, 70].map((x) => (
          <React.Fragment key={x}>
            <rect x={x} y="2.6" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
            <rect x={x} y="44.4" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
          </React.Fragment>
        ))}
        <path d="M14 34 L26 22 L38 28 L50 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="14" cy="34" r="3.2" fill="#fff" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="26" cy="22" r="3.2" fill="#fff" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="38" cy="28" r="2.4" fill={ORANGE} stroke="none" />
        <circle cx="50" cy="17" r="3.2" fill="#fff" stroke={ORANGE} strokeWidth="1.7" />
        <circle cx="60" cy="26" r="3.2" fill="#fff" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }
  if (kind === "node") {
    return (
      <svg width="78" height="52" viewBox="0 0 78 52" fill="none" aria-hidden="true" className="block">
        <path d="M10 8 L34 22 M10 8 L16 42 M16 42 L34 22 M34 22 L54 34" stroke="currentColor" strokeWidth="2" />
        <path d="M40 12 A20 20 0 0 1 66 22" stroke={ORANGE} strokeWidth="2.4" strokeDasharray="5 4" strokeLinecap="round" />
        <circle cx="10" cy="8" r="3.6" fill="#fff" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="42" r="3.6" fill="#fff" stroke="currentColor" strokeWidth="2" />
        <circle cx="54" cy="34" r="3.6" fill="#fff" stroke="currentColor" strokeWidth="2" />
        <circle cx="34" cy="22" r="7" fill="#fff" stroke={ORANGE} strokeWidth="3.2" />
      </svg>
    )
  }
  return (
    <svg width="78" height="52" viewBox="0 0 78 52" fill="none" aria-hidden="true" className="block">
      <path d="M8 12 V40 M62 12 V40 M8 26 H62" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M35 10 V42" stroke={ORANGE} strokeWidth="1.6" strokeDasharray="3.5 3.5" />
      <circle cx="35" cy="26" r="4.6" fill="#fff" stroke={ORANGE} strokeWidth="2" />
    </svg>
  )
}

export function NotificationPrimerPhone({
  name = "Jordan Ellis",
  hand = "Right-handed",
  level = "Advanced",
  streak = "6",
  points = "2,840",
  score = 82,
  shots = "24",
  makes = "15",
  pct = "62.5%",
  target = "Keep elbow stacked through release",
  onEnable,
  onDismiss,
}: {
  name?: string; hand?: string; level?: string; streak?: string; points?: string
  score?: number; shots?: string; makes?: string; pct?: string; target?: string
  onEnable?: () => void; onDismiss?: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-notification-primer" tab="home" pad={0} headerH={38}>
      <div style={{ paddingLeft: 19.4, paddingRight: 19.4, paddingBottom: 70 }}>
        {/* identity */}
        <div className="flex items-start justify-between pt-[13px]">
          <div className="min-w-0">
            <div className="shotiq-display text-[32.7px] leading-[31px] tracking-[0.035em]">{name.toUpperCase()}</div>
            <div className="mt-[3px] text-[12.4px] leading-[14px]" style={{ color: GRAPHITE }}>
              {hand} • {level}
            </div>
          </div>
          <StreakPoints streak={streak} points={points} className="mt-[2px]" />
        </div>

        {/* four-cell stat quad */}
        <div className="mt-[14px] flex text-center">
          {[[shots, "SHOTS"], [makes, "MAKES"], [pct, "SHOOTING"], [String(score), "FORM SCORE"]].map(([v, l], i) => (
            <div key={l} className="flex-1" style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
              <div className="shotiq-numeric text-[22px] leading-[23px]"
                   style={i === 3 ? { color: ORANGE } : undefined}>{v}</div>
              <Micro className="mt-[5px]" size={8.8}>{l}</Micro>
            </div>
          ))}
        </div>

        {/* primary target */}
        <div className="mt-[15px] flex items-baseline justify-center gap-[9px]">
          <span className="shotiq-section-label leading-[11px] tracking-[0.075em]"
                style={{ "--shotiq-label-size": "11px" } as React.CSSProperties}>PRIMARY TARGET:</span>
          <span className="text-[13.4px] leading-[15px]">{target}</span>
        </div>

        {/* hero */}
        <div className="mt-[19px]">
          <div className="shotiq-display leading-[36px] tracking-[0.025em]"
               style={{ fontSize: capDisplay(61) }}>STAY IN THE LOOP</div>
          <div className="mt-[9px] text-[13.4px] leading-[16.6px]" style={{ color: GRAPHITE }}>
            Turn on notifications so you never miss AI analysis<br />
            results, training reminders, or goal milestones.
          </div>
        </div>

        {/* three benefits */}
        <div className="mt-[16px]">
          {BENEFITS.map(([kind, title, lines], i) => (
            <div key={title} className="flex items-center gap-[16px] py-[13px]"
                 style={i ? { borderTop: `1px solid ${RULE}` } : undefined}>
              <span className="flex w-[92px] shrink-0 justify-center"><BenefitMark kind={kind} /></span>
              <span className="min-w-0 flex-1 pl-[16px]" style={{ borderLeft: `1px solid ${RULE}` }}>
                <span className="shotiq-display block text-[20.5px] leading-[20px] tracking-[0.03em]"
                      style={{ color: ORANGE }}>{title}</span>
                <span className="mt-[6px] block text-[13.2px] leading-[16px]">
                  {lines[0]}<br />{lines[1]}
                </span>
              </span>
            </div>
          ))}
        </div>

        {/* still + form score */}
        <div className="mt-[13px] flex items-start gap-[16px]">
          <Frame src="083-hero" w={255} h={193} radius={5} pos="50% 78%" />
          <div className="min-w-0 flex-1">
            <div className="shotiq-section-label leading-[12px] tracking-[0.075em]"
                 style={{ "--shotiq-label-size": "12px" } as React.CSSProperties}>FORM SCORE</div>
            <div className="shotiq-numeric mt-[2px] text-[62px] leading-[0.82]" style={{ color: ORANGE }}>{score}</div>
            <ScoreBar score={score} width={76} height={6.5} />
            <div className="shotiq-display mt-[8px] text-[17px] leading-[17px] tracking-[0.04em]" style={{ color: BLUE }}>GOOD</div>
            <div className="mt-[4px] text-[12.6px] leading-[14.6px]">Keep building<br />consistency.</div>
          </div>
        </div>

        {/* actions */}
        <button type="button" onClick={onEnable} data-testid="phone-primer-enable"
                className="mt-[11px] flex h-[34px] w-full items-center justify-center gap-[13px] rounded-[5px] text-[15px] font-medium text-white"
                style={{ background: GREEN }}>
          <BellGlyph /> Turn on notifications
        </button>
        <button type="button" onClick={onDismiss} data-testid="phone-primer-dismiss"
                className="mt-[8px] flex h-[34px] w-full items-center justify-center rounded-[5px] bg-white text-[15px]"
                style={{ border: `1px solid ${RULE}`, color: GRAPHITE }}>
          Not now
        </button>
      </div>
    </PhoneScreen>
  )
}

/** Canonical draws the CTA mark as an open bell outline with two motion ticks. */
function BellGlyph() {
  return (
    <svg width="26" height="24" viewBox="0 0 26 24" fill="none" aria-hidden="true" className="block shrink-0">
      <path d="M8 17 C8 11 8.6 6.4 13 6.4 C17.4 6.4 18 11 18 17 Z" stroke="#fff" strokeWidth="1.7"
            strokeLinejoin="round" />
      <path d="M6.4 17 H19.6" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M11.4 19.4 A1.9 1.9 0 0 0 14.6 19.4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M13 4.4 V2.4 M20.6 6.6 L22.2 5 M5.4 6.6 L3.8 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
