interface KPICardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
  icon?: string
}

const colorMap = {
  blue: 'border-t-sky-500',
  green: 'border-t-green-500',
  yellow: 'border-t-yellow-500',
  red: 'border-t-red-500',
  gray: 'border-t-gray-400',
}

export default function KPICard({ label, value, sub, color = 'blue', icon }: KPICardProps) {
  return (
    <div className={`card p-5 border-t-2 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-sm text-gray-500">{sub}</p>}
        </div>
        {icon && (
          <span className="text-2xl text-gray-300">{icon}</span>
        )}
      </div>
    </div>
  )
}
