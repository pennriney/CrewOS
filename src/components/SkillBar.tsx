interface SkillBarProps {
  label: string
  value: number // 0-1
  color?: string
}

export default function SkillBar({ label, value, color = 'sky' }: SkillBarProps) {
  const pct = Math.round(value * 100)
  const barColor = color === 'sky' ? 'bg-sky-500' : color === 'green' ? 'bg-green-500' : 'bg-indigo-500'
  const textColor = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-24 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-semibold w-10 text-right ${textColor}`}>{pct}%</span>
    </div>
  )
}
