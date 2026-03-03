import { prisma } from '@/lib/prisma'
import KPICard from '@/components/KPICard'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import JobTypeBadge from '@/components/JobTypeBadge'
import { generatePlan } from '@/lib/planEngine'
import { redirect } from 'next/navigation'

async function generateAndSavePlan() {
  'use server'
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)

  // Delete existing plan for this week
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

export default async function DashboardPage() {
  const [
    totalEmployees,
    totalJobs,
    pendingJobs,
    scheduledJobs,
    completedJobs,
    recentOutcomes,
    latestPlan,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.job.count(),
    prisma.job.count({ where: { status: 'pending' } }),
    prisma.job.count({ where: { status: { in: ['scheduled', 'in_progress'] } } }),
    prisma.job.count({ where: { status: 'completed' } }),
    prisma.outcome.findMany({
      take: 5,
      orderBy: { dateCompleted: 'desc' },
      include: { job: true },
    }),
    prisma.plan.findFirst({ orderBy: { createdAt: 'desc' } }),
  ])

  // Weekly revenue estimate from scheduled jobs
  const scheduledJobsList = await prisma.job.findMany({
    where: { status: { in: ['scheduled', 'in_progress'] } },
  })
  const hoursMap: Record<string, number> = { S: 16, M: 40, L: 80 }
  const estimatedRevenue = scheduledJobsList.reduce((sum, j) => sum + (hoursMap[j.sizeBand] ?? 24) * 85, 0)

  // Avg synergy score
  const synergies = await prisma.pairSynergy.findMany()
  const avgSynergy =
    synergies.length > 0
      ? synergies.reduce((s, p) => s + p.synergyScore, 0) / synergies.length
      : 0

  const upcomingJobs = await prisma.job.findMany({
    where: { status: { in: ['pending', 'scheduled'] } },
    orderBy: { startDate: 'asc' },
    take: 6,
  })

  const planItems = latestPlan ? JSON.parse(latestPlan.itemsJson) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <form action={generateAndSavePlan}>
          <button type="submit" className="btn-primary text-base px-5 py-2.5">
            Generate Plan
          </button>
        </form>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard label="Employees" value={totalEmployees} color="blue" icon="👥" />
        <KPICard label="Active Jobs" value={scheduledJobs} color="green" icon="🏠" />
        <KPICard label="Pending Jobs" value={pendingJobs} color="yellow" icon="⏳" />
        <KPICard label="Completed" value={completedJobs} color="gray" icon="✓" />
        <KPICard
          label="Est. Revenue"
          value={`$${(estimatedRevenue / 1000).toFixed(1)}k`}
          sub="this week (active)"
          color="green"
          icon="$"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Jobs */}
        <div className="lg:col-span-2 card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming Jobs</h2>
            <Link href="/jobs" className="text-sm text-sky-600 hover:text-sky-700">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingJobs.length === 0 && (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No upcoming jobs</p>
            )}
            {upcomingJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{job.customerName}</p>
                  <p className="text-xs text-gray-500 truncate">{job.address}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <JobTypeBadge type={job.jobType} />
                  <span className="badge bg-gray-100 text-gray-600">{job.sizeBand}</span>
                  <StatusBadge status={job.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Plan Status */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Current Plan</h2>
            {latestPlan ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {planItems.length} job{planItems.length !== 1 ? 's' : ''} scheduled
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  Generated {new Date(latestPlan.createdAt).toLocaleDateString()}
                </p>
                <Link href="/schedule" className="btn-secondary w-full justify-center text-sm">
                  View Schedule
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">No plan generated yet.</p>
                <form action={generateAndSavePlan}>
                  <button type="submit" className="btn-primary w-full justify-center text-sm">
                    Generate Now
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Pair Synergy Summary */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Team Synergy</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg pair score</span>
                <span className="text-sm font-semibold text-gray-900">
                  {(avgSynergy * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pairs tracked</span>
                <span className="text-sm font-semibold text-gray-900">{synergies.length}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div
                  className="bg-sky-500 h-2 rounded-full"
                  style={{ width: `${avgSynergy * 100}%` }}
                />
              </div>
            </div>
            <Link href="/insights" className="btn-secondary w-full justify-center text-sm mt-3">
              View Insights
            </Link>
          </div>

          {/* Recent Outcomes */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Recent Outcomes</h2>
            {recentOutcomes.length === 0 ? (
              <p className="text-sm text-gray-400">No outcomes logged yet.</p>
            ) : (
              <div className="space-y-2">
                {recentOutcomes.map((o) => (
                  <div key={o.id} className="text-sm">
                    <p className="font-medium text-gray-800 truncate">{o.job.customerName}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(o.dateCompleted).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Link href="/outcomes" className="btn-secondary w-full justify-center text-sm mt-3">
              Log Outcome
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
