"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAnalysisStore } from "@/stores/analysisStore"
import type { PlayerProfile, Position, SkillLevel, BodyType } from "@/types"

const playerProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  position: z.string().optional(),
  skillLevel: z.string().optional(),
  age: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  wingspan: z.string().optional(),
  bodyType: z.string().optional(),
})

type FormData = z.infer<typeof playerProfileSchema>

const POSITIONS: { value: Position; label: string }[] = [
  { value: "GUARD", label: "Guard" },
  { value: "FORWARD", label: "Forward" },
  { value: "CENTER", label: "Center" },
]

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "PROFESSIONAL", label: "Professional" },
]

const BODY_TYPES: { value: string; label: string }[] = [
  { value: "GUARD_BUILD", label: "Guard (6'0\"-6'4\")" },
  { value: "FORWARD_BUILD", label: "Forward (6'4\"-6'9\")" },
  { value: "CENTER_BUILD", label: "Center (6'9\"+)" },
]

export function PlayerProfileForm() {
  const { playerProfile, setPlayerProfile } = useAnalysisStore()

  const { register, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(playerProfileSchema),
    defaultValues: {
      name: playerProfile.name || "",
      email: playerProfile.email || "",
      position: playerProfile.position || "",
      skillLevel: playerProfile.skillLevel || "",
      age: playerProfile.age?.toString() || "",
      height: playerProfile.height || "",
      weight: playerProfile.weight || "",
      wingspan: playerProfile.wingspan || "",
      bodyType: playerProfile.bodyType || "",
    },
  })

  const handleFieldChange = (field: keyof PlayerProfile, value: string | number | undefined) => {
    setPlayerProfile({ [field]: value })
  }

  const inputClass = "w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
  const selectClass = "w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
  const labelClass = "text-[#E5E5E5] text-sm font-medium"

  return (
    <div className="space-y-6">
      {/* Row 1: Name, Email, Age */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            placeholder="Enter your full name"
            className={inputClass}
            {...register("name")}
            onChange={(e) => { register("name").onChange(e); handleFieldChange("name", e.target.value) }}
          />
          {errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Email *</label>
          <input
            type="email"
            placeholder="your.email@example.com"
            className={inputClass}
            {...register("email")}
            onChange={(e) => { register("email").onChange(e); handleFieldChange("email", e.target.value) }}
          />
          {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Age</label>
          <input
            type="text"
            placeholder="e.g., 18, 25, 35"
            className={inputClass}
            {...register("age")}
            onChange={(e) => { register("age").onChange(e); handleFieldChange("age", e.target.value ? parseInt(e.target.value) : undefined) }}
          />
        </div>
      </div>

      {/* Row 2: Position, Skill Level, Body Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className={labelClass}>Position *</label>
          <select
            className={selectClass}
            value={playerProfile.position || ""}
            onChange={(e) => { setValue("position", e.target.value); handleFieldChange("position", e.target.value as Position) }}
          >
            <option value="">Select your position</option>
            {POSITIONS.map((pos) => (
              <option key={pos.value} value={pos.value}>{pos.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Skill Level</label>
          <select
            className={selectClass}
            value={playerProfile.skillLevel || ""}
            onChange={(e) => { setValue("skillLevel", e.target.value); handleFieldChange("skillLevel", e.target.value as SkillLevel) }}
          >
            <option value="">Select your skill level</option>
            {SKILL_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Body Type</label>
          <select
            className={selectClass}
            value={playerProfile.bodyType || ""}
            onChange={(e) => { setValue("bodyType", e.target.value); handleFieldChange("bodyType", e.target.value as BodyType) }}
          >
            <option value="">Select your body type</option>
            {BODY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Height, Weight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={labelClass}>Height</label>
          <input
            type="text"
            placeholder="e.g., 6ft 2in or 190cm"
            className={inputClass}
            {...register("height")}
            onChange={(e) => { register("height").onChange(e); handleFieldChange("height", e.target.value) }}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Weight</label>
          <input
            type="text"
            placeholder="e.g., 180 lbs, 82 kg"
            className={inputClass}
            {...register("weight")}
            onChange={(e) => { register("weight").onChange(e); handleFieldChange("weight", e.target.value) }}
          />
        </div>
      </div>

      {/* Row 4: Wingspan */}
      <div className="space-y-2">
        <label className={labelClass}>Wingspan</label>
        <input
          type="text"
          placeholder="e.g., 6ft 6in or 200cm"
          className={inputClass}
          {...register("wingspan")}
          onChange={(e) => { register("wingspan").onChange(e); handleFieldChange("wingspan", e.target.value) }}
        />
      </div>
    </div>
  )
}

