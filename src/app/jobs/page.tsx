import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import JobTypeBadge from '@/components/JobTypeBadge'

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: [{ status: 'asc' }, { startDate: 'asc' }],
    include: { _count: { select: { outcomes: true } } },
  })

  const byStatus = {
    scheduled: jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress'),
    pending: jobs.filter((j) => j.status === 'pending'),
    completed: jobs.filter((j) => j.status === 'completed'),
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Jobs</h1>
        <Link href="/jobs/new" className="btn-primary">
          + Add Job
        </Link>
      </div>

      {Object.entries(byStatus).map(([status, list]) => (
        list.length > 0 && (
          <section key={status}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 capitalize">
              {status === 'scheduled' ? 'Active / Scheduled' : status} ({list.length})
            </h2>
            <div className="card divide-y divide-gray-100">
              {list.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{job.customerName}</p>
                      <JobTypeBadge type={job.jobType} />
                      <span className="badge bg-gray-100 text-gray-600">{job.sizeBand}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{job.address}, {job.zip}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400">
                        {new Date(job.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' – '}
                        {new Date(job.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {job._count.outcomes > 0 && (
                        <p className="text-xs text-green-600">{job._count.outcomes} outcome{job._count.outcomes > 1 ? 's' : ''}</p>
                      )}
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      ))}

      {jobs.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-lg">No jobs yet.</p>
          <Link href="/jobs/new" className="btn-primary mt-4 inline-flex">Add your first job</Link>
        </div>
      )}
    </div>
  )
}
