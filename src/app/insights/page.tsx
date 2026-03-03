import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import SkillBar from '@/components/SkillBar'
import type { SkillsJson } from '@/types'

const BASE_HOURS: Record<string, number> = { S: 16, M: 40, L: 80 }

export default async function InsightsPage() {
  const [employees, outcomes, synergies] = await Promise.all([
    prisma.employee.findMany({ orderBy: { name: 'asc' } }),
    prisma.outcome.findMany({
      include: { job: true },
      orderBy: { dateCompleted: 'desc' },
    }),
    prisma.pairSynergy.findMany({
      include: { employeeA: true, employeeB: true },
      orderBy: { synergyScore: 'desc' },
    }),
  ])

  // ─── Per-employee performance ─────────────────────────────────────────────
  const empStats = employees.map((emp) => {
    let skills: SkillsJson
    try { skills = JSON.parse(emp.skillsJson) } catch { skills = {} as SkillsJson }

    // Find outcomes where this employee worked
    const empOutcomes = outcomes.filter((o) => {
      const hrs = JSON.parse(o.actualHoursJson || '{}')
      return emp.id.toString() in hrs
    })

    let totalActual = 0
    let totalExpected = 0
    for (const o of empOutcomes) {
      const hrs = JSON.parse(o.actualHoursJson || '{}')
      const empHrs = hrs[emp.id.toString()] ?? 0
      const crewSize = Object.keys(hrs).length
      const base = BASE_HOURS[o.job.sizeBand] ?? 16
      totalActual += empHrs
      totalExpected += base / Math.max(crewSize, 1)
    }

    const efficiency = totalExpected > 0 ? totalActual / totalExpected : 1
    const speedFactor = skills.speedFactor ?? 1.0

    // Top skill
    const types = ['interior', 'exterior', 'cabinet', 'trim', 'fullHouse']
    const sorted = types.slice().sort((a, b) => (skills[b] ?? 0) - (skills[a] ?? 0))
    const topSkill = sorted[0]

    return {
      employee: emp,
      skills,
      jobCount: empOutcomes.length,
      efficiency, // <1 = faster (less actual/expected), >1 = slower
      speedFactor,
      topSkill,
    }
  })

  // Sort: best performers = lowest efficiency ratio (fastest vs expected)
  const topPerformers = empStats
    .filter((e) => e.jobCount > 0)
    .sort((a, b) => a.efficiency - b.efficiency)
    .slice(0, 5)

  // Overrun risk: high efficiency ratio (slowest)
  const overrunRisk = empStats
    .filter((e) => e.efficiency > 1.1 || e.speedFactor < 0.95)
    .sort((a, b) => b.efficiency - a.efficiency)

  // Best pairs
  const bestPairs = synergies.filter((s) => s.sampleCount > 0).slice(0, 8)

  // Job type performance breakdown
  const typeBreakdown: Record<string, { total: number; overrun: number }> = {}
  for (const o of outcomes) {
    const type = o.job.jobType
    if (!typeBreakdown[type]) typeBreakdown[type] = { total: 0, overrun: 0 }
    const hrs = JSON.parse(o.actualHoursJson || '{}')
    const actual = Object.values(hrs).reduce((a: number, b) => a + (b as number), 0)
    const expected = BASE_HOURS[o.job.sizeBand] ?? 16
    typeBreakdown[type].total++
    if (actual > expected * 1.1) typeBreakdown[type].overrun++
  }

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1 className="page-title">Insights</h1>
        <p className="text-sm text-gray-500">{outcomes.length} outcomes analyzed</p>
      </div>

      {outcomes.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No outcome data yet.</p>
          <p className="text-gray-400 text-sm mb-6">Log job outcomes to start seeing insights about your crew performance.</p>
          <Link href="/outcomes" className="btn-primary">Log an Outcome</Link>
        </div>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topPerformers.map((stat, rank) => (
              <Link
                key={stat.employee.id}
                href={`/employees/${stat.employee.id}`}
                className="card p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{stat.employee.name}</p>
                    <p className="text-xs text-gray-500">{stat.jobCount} job{stat.jobCount !== 1 ? 's' : ''} completed</p>
                  </div>
                  <span className={`text-lg font-bold ${rank === 0 ? 'text-yellow-500' : rank === 1 ? 'text-gray-400' : rank === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                    #{rank + 1}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Efficiency ratio</span>
                    <span className={`font-semibold ${stat.efficiency <= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(stat.efficiency * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Speed factor</span>
                    <span className="font-semibold text-gray-700">{stat.speedFactor.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Top skill</span>
                    <span className="font-semibold text-sky-600 capitalize">{stat.topSkill}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <SkillBar label={stat.topSkill} value={stat.skills[stat.topSkill] ?? 0} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Best Pairs */}
      {bestPairs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Best Crew Pairs</h2>
          <div className="card divide-y divide-gray-100">
            {bestPairs.map((pair) => {
              const score = pair.synergyScore
              const color = score >= 0.8 ? 'text-green-600' : score >= 0.65 ? 'text-yellow-600' : 'text-gray-500'
              const barColor = score >= 0.8 ? 'bg-green-500' : score >= 0.65 ? 'bg-yellow-500' : 'bg-gray-300'
              return (
                <div key={pair.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex items-center gap-2 w-56 shrink-0">
                    <Link href={`/employees/${pair.employeeAId}`} className="text-sm font-medium text-gray-700 hover:text-sky-700">
                      {pair.employeeA.name}
                    </Link>
                    <span className="text-gray-300 text-xs">+</span>
                    <Link href={`/employees/${pair.employeeBId}`} className="text-sm font-medium text-gray-700 hover:text-sky-700">
                      {pair.employeeB.name}
                    </Link>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${barColor}`}
                      style={{ width: `${score * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-12 text-right ${color}`}>
                    {(score * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {pair.sampleCount} job{pair.sampleCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Overrun Risk */}
      {overrunRisk.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overrun Risk Watch</h2>
          <p className="text-sm text-gray-500 mb-3">
            Employees with efficiency ratio &gt;110% or speed factor &lt;0.95.
          </p>
          <div className="card divide-y divide-gray-100">
            {overrunRisk.map((stat) => (
              <div key={stat.employee.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <div>
                    <Link href={`/employees/${stat.employee.id}`} className="text-sm font-medium text-gray-900 hover:text-sky-700">
                      {stat.employee.name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      Best at {stat.topSkill} · {stat.jobCount} job{stat.jobCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Efficiency</p>
                    <p className="font-semibold text-red-600">{(stat.efficiency * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Speed</p>
                    <p className="font-semibold text-gray-700">{stat.speedFactor.toFixed(2)}x</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Job Type Breakdown */}
      {Object.keys(typeBreakdown).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overrun by Job Type</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(typeBreakdown).map(([type, data]) => {
              const pct = data.total > 0 ? data.overrun / data.total : 0
              return (
                <div key={type} className="card p-4">
                  <p className="text-sm font-semibold text-gray-800 capitalize mb-2">{type}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${pct > 0.5 ? 'bg-red-400' : pct > 0.25 ? 'bg-yellow-400' : 'bg-green-400'}`}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">
                      {data.overrun}/{data.total}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">jobs with &gt;10% overrun</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* All Employee Skills Summary */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Employee Skill Overview</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Int.</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Ext.</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Cab.</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Trim</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Full</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {empStats.map((stat) => {
                const s = stat.skills
                const cell = (v: number) => {
                  const pct = Math.round((v ?? 0) * 100)
                  const cls = pct >= 80 ? 'text-green-600 font-semibold' : pct >= 60 ? 'text-gray-700' : 'text-red-500'
                  return <td key={v} className={`text-center px-3 py-3 ${cls}`}>{pct}%</td>
                }
                return (
                  <tr key={stat.employee.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/employees/${stat.employee.id}`} className="font-medium text-gray-900 hover:text-sky-700">
                        {stat.employee.name}
                      </Link>
                    </td>
                    {cell(s.interior ?? 0)}
                    {cell(s.exterior ?? 0)}
                    {cell(s.cabinet ?? 0)}
                    {cell(s.trim ?? 0)}
                    {cell(s.fullHouse ?? 0)}
                    <td className="text-center px-3 py-3 text-xs text-gray-500">{(s.speedFactor ?? 1).toFixed(2)}x</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
