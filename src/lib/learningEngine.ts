import { prisma } from './prisma'
import type { SkillsJson, ActualHoursJson } from '@/types'

const BASE_HOURS: Record<string, number> = { S: 16, M: 40, L: 80 }

/**
 * Called after an outcome is submitted.
 * Updates PairSynergy and employee speed factors based on performance.
 */
export async function applyLearning(outcomeId: number): Promise<string> {
  const outcome = await prisma.outcome.findUnique({
    where: { id: outcomeId },
    include: { job: true },
  })

  if (!outcome) return 'Outcome not found.'

  const actualHours: ActualHoursJson = JSON.parse(outcome.actualHoursJson || '{}')
  const employeeIds = Object.keys(actualHours).map(Number)

  if (employeeIds.length === 0) return 'No employee hours logged.'

  const baseHours = BASE_HOURS[outcome.job.sizeBand] ?? 16
  const totalActual = Object.values(actualHours).reduce((a, b) => a + b, 0)
  const crewSize = employeeIds.length
  const expectedPerPerson = baseHours / crewSize
  const actualPerPerson = totalActual / crewSize
  const efficiency = expectedPerPerson / Math.max(actualPerPerson, 1) // >1 = faster than expected

  // ─── Update pair synergy ──────────────────────────────────────────────────
  for (let i = 0; i < employeeIds.length; i++) {
    for (let j = i + 1; j < employeeIds.length; j++) {
      const aId = Math.min(employeeIds[i], employeeIds[j])
      const bId = Math.max(employeeIds[i], employeeIds[j])

      const existing = await prisma.pairSynergy.findFirst({
        where: {
          OR: [
            { employeeAId: aId, employeeBId: bId },
            { employeeAId: bId, employeeBId: aId },
          ],
        },
      })

      // Nudge: if efficient, +0.05; if overrun >20%, -0.03; else +0.01
      let nudge = 0.01
      if (efficiency >= 1.1) nudge = 0.05
      else if (efficiency < 0.8) nudge = -0.03

      if (existing) {
        const newScore = Math.max(0, Math.min(1, existing.synergyScore + nudge))
        await prisma.pairSynergy.update({
          where: { id: existing.id },
          data: {
            synergyScore: newScore,
            sampleCount: existing.sampleCount + 1,
          },
        })
      } else {
        await prisma.pairSynergy.create({
          data: {
            employeeAId: aId,
            employeeBId: bId,
            synergyScore: Math.max(0, Math.min(1, 0.5 + nudge)),
            sampleCount: 1,
          },
        })
      }
    }
  }

  // ─── Update employee speed factors ───────────────────────────────────────
  const summaryParts: string[] = []

  for (const empId of employeeIds) {
    const employee = await prisma.employee.findUnique({ where: { id: empId } })
    if (!employee) continue

    let skills: SkillsJson
    try {
      skills = JSON.parse(employee.skillsJson) as SkillsJson
    } catch {
      skills = { interior: 0.5, exterior: 0.5, cabinet: 0.5, trim: 0.5, fullHouse: 0.5, speedFactor: 1.0 }
    }

    const empActual = actualHours[empId.toString()] ?? 0
    const empExpected = expectedPerPerson

    // Personal efficiency ratio
    const personalEfficiency = empExpected / Math.max(empActual, 1)

    // Nudge speed factor (learning rate 5%)
    const oldSpeed = skills.speedFactor ?? 1.0
    const newSpeed = Math.max(0.5, Math.min(1.5, oldSpeed * 0.95 + personalEfficiency * 0.05))

    skills.speedFactor = parseFloat(newSpeed.toFixed(3))

    await prisma.employee.update({
      where: { id: empId },
      data: { skillsJson: JSON.stringify(skills) },
    })

    // Build per-employee insight
    const jobTypeSkill = skills[outcome.job.jobType] ?? 0.5
    const trend = personalEfficiency >= 1.05 ? 'excels at' : personalEfficiency < 0.85 ? 'tends to overrun on' : 'performs solidly on'

    summaryParts.push(
      `${employee.name} ${trend} ${outcome.job.jobType} work (skill ${(jobTypeSkill * 100).toFixed(0)}%).`
    )
  }

  // ─── Overall summary ─────────────────────────────────────────────────────
  const overallTrend =
    efficiency >= 1.1
      ? 'Crew finished ahead of schedule.'
      : efficiency < 0.8
        ? 'Job overran — review task complexity or crew fit.'
        : 'Job completed near estimate.'

  const summary = [overallTrend, ...summaryParts].join(' ')

  return summary
}

/**
 * Generate a narrative profile summary for an employee based on their skills and outcomes.
 */
export async function generateEmployeeSummary(employeeId: number): Promise<string> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
  if (!employee) return ''

  let skills: SkillsJson
  try {
    skills = JSON.parse(employee.skillsJson) as SkillsJson
  } catch {
    return `${employee.name} — profile data unavailable.`
  }

  // Find best and worst job types
  const jobTypes = ['interior', 'exterior', 'cabinet', 'trim', 'fullHouse'] as const
  const sorted = jobTypes.slice().sort((a, b) => (skills[b] ?? 0) - (skills[a] ?? 0))
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  const speedFactor = skills.speedFactor ?? 1.0
  const speedDesc = speedFactor >= 1.08 ? 'fast' : speedFactor >= 0.98 ? 'steady' : 'methodical'

  const parts = [
    `${employee.name} excels at ${best} work (${(skills[best] * 100).toFixed(0)}% skill).`,
    `Weaker on ${worst} (${(skills[worst] * 100).toFixed(0)}%).`,
    `Overall pace: ${speedDesc} (speed factor ${speedFactor.toFixed(2)}x).`,
  ]

  // Check flags
  const flags = JSON.parse(employee.flagsJson || '{}')
  if (flags.lead) parts.push('Certified crew lead.')
  if (flags.licensed) parts.push('Licensed painter.')

  return parts.join(' ')
}
