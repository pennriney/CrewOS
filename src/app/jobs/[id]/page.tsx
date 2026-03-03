import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import JobTypeBadge from '@/components/JobTypeBadge'

async function updateStatus(jobId: number, status: string) {
  'use server'
  await prisma.job.update({ where: { id: jobId }, data: { status } })
  redirect(`/jobs/${jobId}`)
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) notFound()

  const job = await prisma.job.findUnique({
    where: { id },
    include: { outcomes: { orderBy: { dateCompleted: 'desc' } } },
  })
  if (!job) notFound()

  const constraints = JSON.parse(job.constraintsJson || '{}')
  const constraintList = Object.entries(constraints).filter(([, v]) => v)

  const BASE_HOURS: Record<string, number> = { S: 16, M: 40, L: 80 }
  const MULTIPLIERS: Record<string, number> = {
    interior: 1.0, exterior: 1.2, cabinet: 0.8, trim: 0.75, fullHouse: 1.3,
  }
  const estimatedHours = Math.round((BASE_HOURS[job.sizeBand] ?? 16) * (MULTIPLIERS[job.jobType] ?? 1))

  const statusCycle: Record<string, string> = {
    pending: 'scheduled',
    scheduled: 'in_progress',
    in_progress: 'completed',
  }
  const nextStatus = statusCycle[job.status]

  const totalActualHours = job.outcomes.reduce((sum, o) => {
    const hrs = JSON.parse(o.actualHoursJson || '{}')
    return sum + Object.values(hrs).reduce((a: number, b) => a + (b as number), 0)
  }, 0)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{job.customerName}</h1>
          <p className="text-sm text-gray-500">{job.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={job.status} />
          <Link href="/jobs" className="btn-secondary text-sm">Back</Link>
        </div>
      </div>

      {/* Details */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Job Details</h2>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Type</p>
            <div className="mt-1"><JobTypeBadge type={job.jobType} /></div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Size</p>
            <p className="text-sm font-medium text-gray-800 mt-1">{job.sizeBand} — ~{estimatedHours}h est.</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">ZIP</p>
            <p className="text-sm font-medium text-gray-800 mt-1">{job.zip}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Dates</p>
            <p className="text-sm font-medium text-gray-800 mt-1">
              {new Date(job.startDate).toLocaleDateString()} – {new Date(job.dueDate).toLocaleDateString()}
            </p>
          </div>
          {job.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Notes</p>
              <p className="text-sm text-gray-700 mt-1">{job.notes}</p>
            </div>
          )}
          {constraintList.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Constraints</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {constraintList.map(([key, val]) => (
                  <span key={key} className="badge bg-orange-100 text-orange-700">
                    {key}: {String(val)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {nextStatus && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <form action={updateStatus.bind(null, id, nextStatus)}>
              <button type="submit" className="btn-primary">
                Move to {nextStatus.replace('_', ' ')}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Outcomes */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Outcomes ({job.outcomes.length})</h2>
          <Link href={`/outcomes?jobId=${job.id}`} className="btn-secondary text-sm">
            Log Outcome
          </Link>
        </div>

        {totalActualHours > 0 && (
          <div className="mb-4 flex gap-4 text-sm">
            <div>
              <span className="text-gray-400">Planned: </span>
              <span className="font-semibold">{estimatedHours}h</span>
            </div>
            <div>
              <span className="text-gray-400">Actual: </span>
              <span className={`font-semibold ${totalActualHours > estimatedHours ? 'text-red-600' : 'text-green-600'}`}>
                {totalActualHours}h
              </span>
            </div>
            <div>
              <span className="text-gray-400">Variance: </span>
              <span className={`font-semibold ${totalActualHours > estimatedHours ? 'text-red-600' : 'text-green-600'}`}>
                {totalActualHours > estimatedHours ? '+' : ''}{totalActualHours - estimatedHours}h
              </span>
            </div>
          </div>
        )}

        {job.outcomes.length === 0 ? (
          <p className="text-sm text-gray-400">No outcomes logged yet.</p>
        ) : (
          <div className="space-y-3">
            {job.outcomes.map((o) => {
              const hrs = JSON.parse(o.actualHoursJson || '{}')
              const issues = JSON.parse(o.issuesJson || '[]') as string[]
              const totalHrs = Object.values(hrs).reduce((a: number, b) => a + (b as number), 0)
              return (
                <div key={o.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-800">
                      Completed {new Date(o.dateCompleted).toLocaleDateString()}
                    </p>
                    <span className="text-sm text-gray-600">{totalHrs}h total</span>
                  </div>
                  {o.notes && <p className="text-sm text-gray-600 mb-2">{o.notes}</p>}
                  {issues.length > 0 && (
                    <div className="mt-2">
                      {issues.map((issue, i) => (
                        <span key={i} className="badge bg-red-100 text-red-700 mr-1 mb-1">{issue}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
