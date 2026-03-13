"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users, X, Plus } from "lucide-react"
import { estimateAudienceSize } from "@/server/actions/ads-audiences"

// ─── Mock Data ──────────────────────────────────────────────

const INTEREST_OPTIONS = [
  { id: "1", name: "Shopping" },
  { id: "2", name: "Technology" },
  { id: "3", name: "Fashion" },
  { id: "4", name: "Food & Dining" },
  { id: "5", name: "Travel" },
  { id: "6", name: "Fitness" },
  { id: "7", name: "Gaming" },
  { id: "8", name: "Music" },
  { id: "9", name: "Photography" },
  { id: "10", name: "Business" },
  { id: "11", name: "Education" },
  { id: "12", name: "Beauty" },
]

const BEHAVIOR_OPTIONS = [
  { id: "b1", name: "Online Shoppers" },
  { id: "b2", name: "Frequent Travelers" },
  { id: "b3", name: "Mobile Gamers" },
  { id: "b4", name: "Small Business Owners" },
  { id: "b5", name: "Early Adopters" },
  { id: "b6", name: "Engaged Shoppers" },
]

const LOCATION_OPTIONS = [
  { key: "TH", name: "Thailand" },
  { key: "US", name: "United States" },
  { key: "GB", name: "United Kingdom" },
  { key: "JP", name: "Japan" },
  { key: "SG", name: "Singapore" },
  { key: "MY", name: "Malaysia" },
  { key: "ID", name: "Indonesia" },
  { key: "PH", name: "Philippines" },
  { key: "VN", name: "Vietnam" },
]

const LANGUAGE_OPTIONS = [
  { value: "th", label: "Thai" },
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
  { value: "ms", label: "Malay" },
  { value: "id", label: "Indonesian" },
]

// ─── Types ──────────────────────────────────────────────────

export interface TargetingData {
  age_min: number
  age_max: number
  genders: number[]
  interests: { id: string; name: string }[]
  behaviors: { id: string; name: string }[]
  locations: { key: string; name: string }[]
  languages: string[]
}

interface AudienceBuilderProps {
  value: TargetingData
  onChange: (data: TargetingData) => void
}

const DEFAULT_TARGETING: TargetingData = {
  age_min: 18,
  age_max: 65,
  genders: [1, 2],
  interests: [],
  behaviors: [],
  locations: [{ key: "TH", name: "Thailand" }],
  languages: ["th"],
}

export { DEFAULT_TARGETING }

// ─── Component ──────────────────────────────────────────────

export function AudienceBuilder({ value, onChange }: AudienceBuilderProps) {
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null)
  const [interestSearch, setInterestSearch] = useState("")
  const [behaviorSearch, setBehaviorSearch] = useState("")

  const updateEstimate = useCallback(async (targeting: TargetingData) => {
    try {
      const result = await estimateAudienceSize(targeting)
      setEstimatedSize(result.estimatedSize)
    } catch {
      setEstimatedSize(null)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => updateEstimate(value), 300)
    return () => clearTimeout(timer)
  }, [value, updateEstimate])

  const update = (partial: Partial<TargetingData>) => {
    onChange({ ...value, ...partial })
  }

  const filteredInterests = INTEREST_OPTIONS.filter(
    (i) =>
      !value.interests.some((s) => s.id === i.id) &&
      i.name.toLowerCase().includes(interestSearch.toLowerCase())
  )

  const filteredBehaviors = BEHAVIOR_OPTIONS.filter(
    (b) =>
      !value.behaviors.some((s) => s.id === b.id) &&
      b.name.toLowerCase().includes(behaviorSearch.toLowerCase())
  )

  const sizePercent = estimatedSize
    ? Math.min(100, Math.round((estimatedSize / 10_000_000) * 100))
    : 0

  const sizeColor =
    sizePercent < 20 ? "bg-red-500" : sizePercent < 50 ? "bg-yellow-500" : "bg-green-500"

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Form */}
      <div className="space-y-6 lg:col-span-2">
        {/* Demographics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Demographics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Age Range */}
            <div className="space-y-2">
              <Label>Age Range</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={18}
                  max={value.age_max}
                  value={value.age_min}
                  onChange={(e) => update({ age_min: Math.max(18, Number(e.target.value)) })}
                  className="w-24"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="number"
                  min={value.age_min}
                  max={65}
                  value={value.age_max}
                  onChange={(e) => update({ age_max: Math.min(65, Number(e.target.value)) })}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">years</span>
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={value.genders.includes(1)}
                    onCheckedChange={(checked) => {
                      const genders = checked
                        ? [...value.genders, 1]
                        : value.genders.filter((g) => g !== 1)
                      update({ genders })
                    }}
                  />
                  <span className="text-sm">Male</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={value.genders.includes(2)}
                    onCheckedChange={(checked) => {
                      const genders = checked
                        ? [...value.genders, 2]
                        : value.genders.filter((g) => g !== 2)
                      update({ genders })
                    }}
                  />
                  <span className="text-sm">Female</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {value.locations.map((loc) => (
                <Badge key={loc.key} variant="secondary" className="gap-1">
                  {loc.name}
                  <button
                    type="button"
                    onClick={() =>
                      update({ locations: value.locations.filter((l) => l.key !== loc.key) })
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select
              value=""
              onValueChange={(key) => {
                const loc = LOCATION_OPTIONS.find((l) => l.key === key)
                if (loc && !value.locations.some((l) => l.key === key)) {
                  update({ locations: [...value.locations, loc] })
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add location..." />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_OPTIONS.filter(
                  (l) => !value.locations.some((s) => s.key === l.key)
                ).map((loc) => (
                  <SelectItem key={loc.key} value={loc.key}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Interests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {value.interests.map((interest) => (
                <Badge key={interest.id} variant="secondary" className="gap-1">
                  {interest.name}
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        interests: value.interests.filter((i) => i.id !== interest.id),
                      })
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Search interests..."
              value={interestSearch}
              onChange={(e) => setInterestSearch(e.target.value)}
            />
            {interestSearch && filteredInterests.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filteredInterests.slice(0, 6).map((interest) => (
                  <Button
                    key={interest.id}
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      update({ interests: [...value.interests, interest] })
                      setInterestSearch("")
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {interest.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Behaviors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Behaviors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {value.behaviors.map((behavior) => (
                <Badge key={behavior.id} variant="secondary" className="gap-1">
                  {behavior.name}
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        behaviors: value.behaviors.filter((b) => b.id !== behavior.id),
                      })
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Search behaviors..."
              value={behaviorSearch}
              onChange={(e) => setBehaviorSearch(e.target.value)}
            />
            {behaviorSearch && filteredBehaviors.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filteredBehaviors.slice(0, 6).map((behavior) => (
                  <Button
                    key={behavior.id}
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      update({ behaviors: [...value.behaviors, behavior] })
                      setBehaviorSearch("")
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {behavior.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Languages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {value.languages.map((lang) => {
                const label = LANGUAGE_OPTIONS.find((l) => l.value === lang)?.label ?? lang
                return (
                  <Badge key={lang} variant="secondary" className="gap-1">
                    {label}
                    <button
                      type="button"
                      onClick={() =>
                        update({ languages: value.languages.filter((l) => l !== lang) })
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )
              })}
            </div>
            <Select
              value=""
              onValueChange={(lang) => {
                if (!value.languages.includes(lang)) {
                  update({ languages: [...value.languages, lang] })
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add language..." />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.filter((l) => !value.languages.includes(l.value)).map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Side Panel — Estimator + Summary */}
      <div className="space-y-6">
        {/* Audience Size Estimator */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Estimated Reach
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {estimatedSize ? estimatedSize.toLocaleString() : "—"}
              </p>
              <p className="text-sm text-muted-foreground">potential reach</p>
            </div>
            {/* Gauge meter */}
            <div className="space-y-1">
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${sizeColor}`}
                  style={{ width: `${sizePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Specific</span>
                <span>Broad</span>
              </div>
            </div>
            {sizePercent < 20 && (
              <p className="text-xs text-yellow-600">
                Audience may be too specific. Consider broadening your targeting.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Targeting Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Age</p>
              <p>
                {value.age_min} — {value.age_max} years
              </p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Gender</p>
              <p>
                {value.genders.length === 2
                  ? "All"
                  : value.genders.includes(1)
                    ? "Male"
                    : value.genders.includes(2)
                      ? "Female"
                      : "None selected"}
              </p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Locations</p>
              <p>{value.locations.map((l) => l.name).join(", ") || "None"}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Interests</p>
              <p>{value.interests.map((i) => i.name).join(", ") || "None"}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Behaviors</p>
              <p>{value.behaviors.map((b) => b.name).join(", ") || "None"}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Languages</p>
              <p>
                {value.languages
                  .map((l) => LANGUAGE_OPTIONS.find((o) => o.value === l)?.label ?? l)
                  .join(", ") || "None"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
