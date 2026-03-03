import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SkillBar from '@/components/SkillBar'
import { generateEmployeeSummary } from '@/lib/learningEngine'
import type { SkillsJson, AvailabilityJson, FlagsJson } from '@/types'

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) notFound()

  const employee = await prisma.employee.findUnique({ where: { id } })
  if (!employee) notFound()

  // Fetch pair synergies involving this employee
  const synergies = await prisma.pairSynergy.findMany({
    where: {
      OR: [{ employeeAId: id }, { employeeBId: id }],
    },
    include: {
      employeeA: true,
      employeeB: true,
    },
    orderBy: { synergyScore: 'desc' },
  })

  let skills: SkillsJson
  try { skills = JSON.parse(employee.skillsJson) } catch { skills = {} as SkillsJson }
  let avail: AvailabilityJson
  try { avail = JSON.parse(employee.availabilityJson) } catch { avail = {} as AvailabilityJson }
  const flags: FlagsJson = JSON.parse(employee.flagsJson || '{}')

  const summary = await generateEmployeeSummary(id)

  const skillTypes = [
    { key: 'interior', label: 'Interior' },
    { key: 'exterior', label: 'Exterior' },
    { key: 'cabinet', label: 'Cabinet' },
    { key: 'trim', label: 'Trim' },
    { key: 'fullHouse', label: 'Full House' },
  ]

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

  return (
    <div className="max-w-3xl space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{employee.name}</h1>
          <p className="text-sm text-gray-500">${employee.hourlyCost}/hr · ZIP {employee.homeZip}</p>
        </div>
        <div className="flex items-center gap-2">
          {flags.lead && <span className="badge bg-amber-100 text-amber-700">Lead</span>}
          {flags.licensed && <span className="badge bg-green-100 text-green-700">Licensed</span>}
          <Link href="/employees" className="btn-secondary text-sm">Back</Link>
        </div>
      </div>

      {/* AI-like summary */}
      {summary && (
        <div className="card p-5 border-l-4 border-l-sky-400 bg-sky-50">
          <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide mb-1.5">Employee Profile</p>
          <p className="text-sm text-gray-700">{summary}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Skills */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Skill Levels</h2>
          <div className="space-y-3">
            {skillTypes.map(({ key, label }) => (
              <SkillBar key={key} label={label} value={skills[key] ?? 0} />
            ))}
            <div className="pt-3 border-t border-gray-100">
              <SkillBar
                label="Speed"
                value={Math.min((skills.speedFactor ?? 1.0) / 1.5, 1)}
                color="green"
              />
              <p className="text-xs text-gray-400 mt-1">
                Speed factor: {(skills.speedFactor ?? 1.0).toFixed(2)}x
                {(skills.speedFactor ?? 1.0) >= 1.05 ? ' (above avg)' : (skills.speedFactor ?? 1.0) < 0.95 ? ' (below avg)' : ' (avg)'}
              </p>
            </div>
          </div>
        </div>

        {/* Availability & Notes */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Availability</h2>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((day) => (
                <div
                  key={day}
                  className={`rounded-lg p-2 text-center ${
                    avail[day]
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <p className="text-xs font-semibold capitalize">{day.slice(0, 1).toUpperCase()}{day.slice(1, 2)}</p>
                  <p className="text-xs">{avail[day] ? '✓' : '–'}</p>
                </div>
              ))}
            </div>
          </div>

          {employee.notes && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-sm text-gray-600">{employee.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pair Synergies */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">
          Pair Synergies ({synergies.length})
        </h2>
        {synergies.length === 0 ? (
          <p className="text-sm text-gray-400">No synergy data yet. Synergies build as outcomes are logged.</p>
        ) : (
          <div className="space-y-2">
            {synergies.map((s) => {
              const partner = s.employeeAId === id ? s.employeeB : s.employeeA
              const score = s.synergyScore
              const color = score >= 0.75 ? 'bg-green-500' : score >= 0.55 ? 'bg-yellow-500' : 'bg-red-400'
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <Link
                    href={`/employees/${partner.id}`}
                    className="text-sm font-medium text-gray-700 hover:text-sky-700 w-32 shrink-0"
                  >
                    {partner.name}
                  </Link>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${color}`}
                      style={{ width: `${score * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                    {(score * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {s.sampleCount} job{s.sampleCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
