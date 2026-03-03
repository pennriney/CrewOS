import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { PlanItem } from '@/types'
import JobTypeBadge from '@/components/JobTypeBadge'
import { generatePlan } from '@/lib/planEngine'
import { redirect } from 'next/navigation'

async function generateNewPlan() {
  'use server'
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)

  await prisma.plan.deleteMany({ where: { weekOf: weekStart } })
  const items = await generatePlan(weekStart)
  await prisma.plan.create({
    data: {
      weekOf: weekStart,
      itemsJson: JSON.stringify(items),
    },
  })
  redirect('/schedule')
}

const SIZE_COLORS: Record<string, string> = {
  S: 'border-l-teal-400 bg-teal-50',
  M: 'border-l-sky-400 bg-sky-50',
  L: 'border-l-indigo-400 bg-indigo-50',
}

export default async function SchedulePage() {
  const plan = await prisma.plan.findFirst({ orderBy: { createdAt: 'desc' } })
  const employees = await prisma.employee.findMany()
  const empMap = new Map(employees.map((e) => [e.id, e]))

  const items: PlanItem[] = plan ? JSON.parse(plan.itemsJson) : []

  const weekStart = plan ? new Date(plan.weekOf) : (() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
    return d
  })()

  // Group items by day (use startDate from actual job for day-of-week)
  const jobIds = items.map((i) => i.jobId)
  const jobs = await prisma.job.findMany({ where: { id: { in: jobIds } } })
  const jobMap = new Map(jobs.map((j) => [j.id, j]))

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const dates = weekDays.map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Schedule</h1>
          <p className="text-sm text-gray-500">
            Week of {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <form action={generateNewPlan}>
            <button type="submit" className="btn-primary">
              Regenerate Plan
            </button>
          </form>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No plan generated yet.</p>
          <p className="text-gray-400 text-sm mb-6">Generate a plan to assign crews to jobs for this week.</p>
          <form action={generateNewPlan}>
            <button type="submit" className="btn-primary">
              Generate Plan
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Week view */}
          <div className="card overflow-hidden">
            <div className="grid grid-cols-5 divide-x divide-gray-100 border-b border-gray-100">
              {weekDays.map((day, i) => (
                <div key={day} className="px-3 py-2 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">{day}</p>
                  <p className="text-sm text-gray-700">
                    {dates[i].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 divide-x divide-gray-100 min-h-[300px]">
              {dates.map((date, i) => {
                // Find items where job starts on or before this date and ends on or after
                const dayItems = items.filter((item) => {
                  const job = jobMap.get(item.jobId)
                  if (!job) return false
                  const start = new Date(job.startDate)
                  const end = new Date(job.dueDate)
                  return start <= date && date <= end
                })

                return (
                  <div key={i} className="p-2 space-y-2 align-top">
                    {dayItems.map((item) => (
                      <div
                        key={item.jobId}
                        className={`rounded-lg border-l-4 p-2.5 ${SIZE_COLORS[item.sizeBand] ?? 'bg-gray-50 border-l-gray-300'}`}
                      >
                        <p className="text-xs font-semibold text-gray-800 leading-tight truncate">{item.jobName}</p>
                        <div className="mt-1">
                          <JobTypeBadge type={item.jobType} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {item.crewNames.slice(0, 2).join(', ')}
                          {item.crewNames.length > 2 && ` +${item.crewNames.length - 2}`}
                        </p>
                        <p className="text-xs text-gray-400">{item.plannedHours}h est.</p>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Job Cards with Rationale */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Crew Assignments</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const job = jobMap.get(item.jobId)
                return (
                  <div key={item.jobId} className="card p-5 flex flex-col gap-4">
                    {/* Job header */}
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <Link href={`/jobs/${item.jobId}`} className="text-base font-semibold text-gray-900 hover:text-sky-700 truncate block">
                          {item.jobName}
                        </Link>
                        {job && (
                          <p className="text-xs text-gray-400 truncate">{job.address}</p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-2">
                        <JobTypeBadge type={item.jobType} />
                        <span className="badge bg-gray-100 text-gray-600">{item.sizeBand}</span>
                      </div>
                    </div>

                    {/* Crew */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1.5">Crew ({item.crew.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.crewNames.map((name, idx) => (
                          <Link
                            key={item.crew[idx]}
                            href={`/employees/${item.crew[idx]}`}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors"
                          >
                            {name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Planned:</span>
                        <span className="font-semibold text-gray-800 ml-1">{item.plannedHours}h</span>
                      </div>
                      {job && (
                        <div>
                          <span className="text-gray-400">Due:</span>
                          <span className="font-semibold text-gray-800 ml-1">
                            {new Date(job.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Conflict flags */}
                    {item.conflictFlags && item.conflictFlags.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
                        <p className="text-xs font-medium text-yellow-800 mb-1">Flags</p>
                        {item.conflictFlags.map((flag, i) => (
                          <p key={i} className="text-xs text-yellow-700">• {flag}</p>
                        ))}
                      </div>
                    )}

                    {/* Rationale */}
                    <details className="group">
                      <summary className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 select-none list-none">
                        <span className="group-open:hidden">▶</span>
                        <span className="hidden group-open:inline">▼</span>
                        Why this plan?
                      </summary>
                      <div className="mt-2 text-xs text-gray-600 bg-sky-50 rounded-lg p-3 leading-relaxed">
                        {item.rationale}
                      </div>
                    </details>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
