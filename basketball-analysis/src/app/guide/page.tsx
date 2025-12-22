"use client"

import React from "react"
import { Check, X, BookOpen, Target, Crosshair, Hand, ArrowRight } from "lucide-react"

const GUIDE_DATA = [
  {
    correct: { title: "Proper Shooting Hand Grip", subtitle: "Fingertips control for optimal backspin", points: ["Ball rests on fingertips, not palm", "Fingers spread comfortably", "Thumb relaxed at approximately 45°", "Consistent finger pad contact", "Wrist cocked back in set position"] },
    incorrect: { title: "Palming the Ball", subtitle: "Palm contact reduces control and spin", points: ["Ball sits in palm of hand", "Fingers bunched together tightly", "Limited wrist flexibility", "Inconsistent release points", "Reduced backspin on shot"] }
  },
  {
    correct: { title: "Correct Guide Hand Placement", subtitle: "Side support without shot interference", points: ["Guide hand on side of ball", "Thumb pointing upward", "Light fingertip contact only", "Releases cleanly before shot", "Provides balance during set"] },
    incorrect: { title: "Guide Hand Interference", subtitle: "Active guide hand disrupts accuracy", points: ["Guide hand pushes ball during release", "Thumb flicks toward basket", "Creates unwanted side spin", "Inconsistent ball flight path", "Reduces shooting accuracy"] }
  },
  {
    correct: { title: "Optimal Elbow Position", subtitle: "Aligned elbow for straight ball flight", points: ["Elbow directly under ball", "Forearm perpendicular to floor", "Elbow points toward basket", "Minimal lateral deviation", "Creates straight force vector"] },
    incorrect: { title: "Elbow Flared Out", subtitle: "Misaligned elbow creates side spin", points: ["Elbow points outward from body", "Creates angled force vector", "Ball curves during flight", "Requires compensation adjustments", "Reduces consistent accuracy"] }
  },
  {
    correct: { title: "Complete Follow Through", subtitle: "Full extension with wrist snap", points: ["Arm fully extended at release", "Wrist snaps down completely", "Fingers point toward basket", "Hold position until ball lands", "Creates optimal backspin"] },
    incorrect: { title: "Incomplete Follow Through", subtitle: "Shortened motion reduces power", points: ["Arm doesn't fully extend", "Wrist snap is abbreviated", "Fingers don't point at target", "Quick withdrawal of shooting arm", "Inconsistent ball trajectory"] }
  }
]

function GuideCard({ type, title, subtitle, points }: { type: "correct" | "incorrect"; title: string; subtitle: string; points: string[] }) {
  const isCorrect = type === "correct"
  return (
    <div className={`rounded-lg p-5 ${isCorrect ? "bg-green-900/20 border border-green-500/30" : "bg-red-900/20 border border-red-500/30"}`}>
      <h3 className={`font-semibold text-lg mb-1 ${isCorrect ? "text-green-400" : "text-red-400"}`}>{title}</h3>
      <p className="text-[#888] text-sm mb-3">{subtitle}</p>
      <ul className="space-y-2">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#E5E5E5]">
            {isCorrect ? <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /> : <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
            {point}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function GuidePage() {
  return (
    <div className="container mx-auto px-6 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFD700]/20 rounded-full mb-4">
          <BookOpen className="w-8 h-8 text-[#FFD700]" />
        </div>
        <h1 className="text-4xl font-bold text-[#FFD700] mb-3">Shooting Form Guide</h1>
        <p className="text-[#E5E5E5] text-lg max-w-2xl mx-auto">
          Master the fundamentals of basketball shooting mechanics. Learn the difference between proper and improper techniques to improve your game.
        </p>
      </div>

      {/* Quick Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#2C2C2C] rounded-lg p-6 border border-[#3a3a3a]">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-6 h-6 text-[#FFD700]" />
            <h3 className="font-semibold text-[#E5E5E5]">Focus on Form</h3>
          </div>
          <p className="text-[#888] text-sm">Consistent form leads to consistent results. Practice each element until it becomes muscle memory.</p>
        </div>
        <div className="bg-[#2C2C2C] rounded-lg p-6 border border-[#3a3a3a]">
          <div className="flex items-center gap-3 mb-3">
            <Crosshair className="w-6 h-6 text-[#FFD700]" />
            <h3 className="font-semibold text-[#E5E5E5]">Aim Small, Miss Small</h3>
          </div>
          <p className="text-[#888] text-sm">Pick a specific target on the rim or backboard. The more precise your aim, the more accurate your shot.</p>
        </div>
        <div className="bg-[#2C2C2C] rounded-lg p-6 border border-[#3a3a3a]">
          <div className="flex items-center gap-3 mb-3">
            <Hand className="w-6 h-6 text-[#FFD700]" />
            <h3 className="font-semibold text-[#E5E5E5]">Soft Touch</h3>
          </div>
          <p className="text-[#888] text-sm">A shooter&apos;s touch comes from fingertip control. Keep the ball off your palm for maximum control and spin.</p>
        </div>
      </div>

      {/* Main Guide Content */}
      <div className="bg-[#2C2C2C] rounded-lg overflow-hidden shadow-lg">
        <div className="p-6 border-b border-[#3a3a3a]">
          <h2 className="text-2xl font-bold text-[#FFD700] mb-2">Shooting Form Reference</h2>
          <p className="text-[#E5E5E5]">Compare correct and incorrect shooting mechanics side by side</p>
        </div>
        
        <div className="p-8">
          {/* Column Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 text-green-400 font-semibold text-lg">
                <Check className="w-5 h-5" /> Correct Form
              </span>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 text-red-400 font-semibold text-lg">
                <X className="w-5 h-5" /> Incorrect Form
              </span>
            </div>
          </div>
          
          {/* Guide Cards */}
          {GUIDE_DATA.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <GuideCard type="correct" title={row.correct.title} subtitle={row.correct.subtitle} points={row.correct.points} />
              <GuideCard type="incorrect" title={row.incorrect.title} subtitle={row.incorrect.subtitle} points={row.incorrect.points} />
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-12 text-center">
        <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 rounded-lg p-8 border border-[#FFD700]/30">
          <h3 className="text-2xl font-bold text-[#FFD700] mb-3">Ready to Analyze Your Shot?</h3>
          <p className="text-[#E5E5E5] mb-6 max-w-xl mx-auto">
            Upload a photo or video of your shooting form and get instant AI-powered analysis with personalized feedback.
          </p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 bg-[#FFD700] hover:bg-[#E5C100] text-[#1a1a1a] font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Start Analysis
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  )
}

