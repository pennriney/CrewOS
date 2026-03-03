import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { applyLearning } from '@/lib/learningEngine'
import Link from 'next/link'

async function logOutcome(formData: FormData) {
  'use server'

  const jobId = parseInt(formData.get('jobId') as string, 10)
  const dateCompleted = new Date(formData.get('dateCompleted') as string)
  const notes = (formData.get('notes') as string) || ''

  // Parse per-employee hours
  const actualHours: Record<string, number> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('hours_emp_')) {
      const empId = key.replace('hours_emp_', '')
      const hrs = parseFloat(value as string)
      if (!isNaN(hrs) && hrs > 0) {
        actualHours[empId] = hrs
      }
    }
  }

  // Parse issues (comma-separated)
  const issuesRaw = (formData.get('issues') as string) || ''
  const issues = issuesRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const outcome = await prisma.outcome.create({
    data: {
      jobId,
      dateCompleted,
      actualHoursJson: JSON.stringify(actualHours),
      issuesJson: JSON.stringify(issues),
      notes,
    },
  })

  // Mark job as completed
  await prisma.job.update({
    where: { id: jobId },
    data: { status: 'completed' },
  })

  // Apply learning engine
  await applyLearning(outcome.id)

  redirect('/outcomes?success=1')
}

export default async function OutcomesPage({
  searchParams,
}: {
  searchParams: { jobId?: string; success?: string }
}) {
  const jobs = await prisma.job.findMany({
    where: { status: { in: ['scheduled', 'in_progress', 'pending'] } },
    orderBy: { startDate: 'asc' },
  })

  const allOutcomes = await prisma.outcome.findMany({
    orderBy: { dateCompleted: 'desc' },
    take: 10,
    include: { job: true },
  })

  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } })
  const selectedJobId = searchParams.jobId ? parseInt(searchParams.jobId, 10) : null
  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) : null

  // For the plan-assigned crew (if available)
  const plan = await prisma.plan.findFirst({ orderBy: { createdAt: 'desc' } })
  const planItems = plan ? JSON.parse(plan.itemsJson) : []
  const planItem = selectedJobId ? planItems.find((p: { jobId: number }) => p.jobId === selectedJobId) : null

  const defaultCrewIds: number[] = planItem ? planItem.crew : []

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">Log Outcome</h1>
      </div>

      {searchParams.success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-green-600 text-lg">✓</span>
          <div>
            <p className="text-sm font-medium text-green-800">Outcome logged successfully!</p>
            <p className="text-xs text-green-600">Employee profiles and pair synergies have been updated.</p>
          </div>
        </div>
      )}

      <div className="card p-6">
        <form action={logOutcome} className="space-y-5">
          <div>
            <label className="label">Job</label>
            <select name="jobId" required className="input" defaultValue={selectedJobId ?? ''}>
              <option value="">Select a job…</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.customerName} — {job.jobType} ({job.sizeBand})
                </option>
              ))}
            </select>
            {jobs.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                No active jobs.{' '}
                <Link href="/jobs/new" className="text-sky-600 hover:underline">Add a job</Link> first.
              </p>
            )}
          </div>

          <div>
            <label className="label">Date Completed</label>
            <input
              type="date"
              name="dateCompleted"
              required
              className="input"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Per-employee hours */}
          <div>
            <label className="label">Actual Hours per Employee</label>
            <p className="text-xs text-gray-400 mb-3">
              {defaultCrewIds.length > 0
                ? 'Pre-filled with the planned crew. Edit as needed.'
                : 'Enter hours for each employee who worked this job.'}
            </p>
            <div className="space-y-2">
              {employees.map((emp) => {
                const isInCrew = defaultCrewIds.includes(emp.id)
                return (
                  <div key={emp.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${isInCrew ? 'bg-sky-50' : 'bg-gray-50'}`}>
                    <span className={`text-sm font-medium w-36 shrink-0 ${isInCrew ? 'text-sky-800' : 'text-gray-600'}`}>
                      {emp.name}
                      {isInCrew && <span className="text-xs text-sky-500 ml-1">(crew)</span>}
                    </span>
                    <input
                      type="number"
                      name={`hours_emp_${emp.id}`}
                      min="0"
                      step="0.5"
                      placeholder="0"
                      className="input w-24 text-center"
                    />
                    <span className="text-xs text-gray-400">hrs</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <label className="label">Issues (comma-separated)</label>
            <input
              name="issues"
              className="input"
              placeholder="e.g. Weather delay, Color change requested, Extra prep needed"
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              name="notes"
              rows={3}
              className="input"
              placeholder="Overall notes about how the job went…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary">Submit Outcome</button>
            <Link href="/dashboard" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>

      {/* Recent Outcomes */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Outcomes</h2>
        {allOutcomes.length === 0 ? (
          <p className="text-sm text-gray-400">No outcomes logged yet.</p>
        ) : (
          <div className="space-y-3">
            {allOutcomes.map((o) => {
              const hrs = JSON.parse(o.actualHoursJson || '{}')
              const issues = JSON.parse(o.issuesJson || '[]') as string[]
              const totalHrs = Object.values(hrs).reduce((a: number, b) => a + (b as number), 0)
              return (
                <div key={o.id} className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <Link href={`/jobs/${o.jobId}`} className="text-sm font-semibold text-gray-900 hover:text-sky-700">
                      {o.job.customerName}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {o.job.jobType} · {o.job.sizeBand} · Completed {new Date(o.dateCompleted).toLocaleDateString()}
                    </p>
                    {o.notes && <p className="text-xs text-gray-500 mt-1 truncate">{o.notes}</p>}
                    {issues.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {issues.slice(0, 2).map((iss, i) => (
                          <span key={i} className="badge bg-red-100 text-red-700">{iss}</span>
                        ))}
                        {issues.length > 2 && (
                          <span className="badge bg-gray-100 text-gray-500">+{issues.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-800">{totalHrs}h</p>
                    <p className="text-xs text-gray-400">total</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
