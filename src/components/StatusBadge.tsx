const config: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', className: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
}

export default function StatusBadge({ status }: { status: string }) {
  const c = config[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`badge ${c.className}`}>{c.label}</span>
  )
}
