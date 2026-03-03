type JobType = 'interior' | 'exterior' | 'cabinet' | 'trim' | 'fullHouse'

const config: Record<string, { label: string; className: string }> = {
  interior: { label: 'Interior', className: 'bg-blue-100 text-blue-700' },
  exterior: { label: 'Exterior', className: 'bg-orange-100 text-orange-700' },
  cabinet: { label: 'Cabinet', className: 'bg-purple-100 text-purple-700' },
  trim: { label: 'Trim', className: 'bg-teal-100 text-teal-700' },
  fullHouse: { label: 'Full House', className: 'bg-indigo-100 text-indigo-700' },
}

export default function JobTypeBadge({ type }: { type: string }) {
  const c = config[type] ?? { label: type, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`badge ${c.className}`}>{c.label}</span>
  )
}
