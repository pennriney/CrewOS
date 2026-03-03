import { prisma } from './prisma'
import type { PlanItem, SkillsJson, AvailabilityJson } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const CREW_SIZE: Record<string, number> = { S: 2, M: 3, L: 4 }
const BASE_HOURS: Record<string, number> = { S: 16, M: 40, L: 80 }

// Job-type hour multipliers (some jobs take longer per person)
const HOUR_MULTIPLIERS: Record<string, number> = {
  interior: 1.0,
  exterior: 1.2,
  cabinet: 0.8,
  trim: 0.75,
  fullHouse: 1.3,
}

// Zip proximity penalty: parse first 5 chars as number, scale difference
function zipDistance(zip1: string, zip2: string): number {
  const a = parseInt(zip1.replace(/\D/g, '').slice(0, 5), 10) || 0
  const b = parseInt(zip2.replace(/\D/g, '').slice(0, 5), 10) || 0
  const diff = Math.abs(a - b)
  // Each 10-unit difference = 0.01 penalty, capped at 0.15
  return Math.min(diff * 0.001, 0.15)
}

// Check if an employee is available for any weekday in a given week
function employeeAvailableForWeek(availJson: string): boolean {
  try {
    const avail = JSON.parse(availJson) as AvailabilityJson
    return avail.mon || avail.tue || avail.wed || avail.thu || avail.fri
  } catch {
    return true
  }
}

export async function generatePlan(weekOf: Date): Promise<PlanItem[]> {
  // Fetch all pending/scheduled jobs starting in or near this week
  const weekEnd = new Date(weekOf)
  weekEnd.setDate(weekOf.getDate() + 13) // look 2 weeks ahead

  const jobs = await prisma.job.findMany({
    where: {
      status: { in: ['pending', 'scheduled'] },
      startDate: { lte: weekEnd },
    },
    orderBy: [{ sizeBand: 'desc' }, { startDate: 'asc' }],
  })

  const employees = await prisma.employee.findMany()

  // Load all pair synergies into a lookup map
  const synergies = await prisma.pairSynergy.findMany()
  const synergyMap = new Map<string, number>()
  for (const s of synergies) {
    const key1 = `${s.employeeAId}-${s.employeeBId}`
    const key2 = `${s.employeeBId}-${s.employeeAId}`
    synergyMap.set(key1, s.synergyScore)
    synergyMap.set(key2, s.synergyScore)
  }

  const planItems: PlanItem[] = []
  // Track employee assignment load this week (employeeId -> hours)
  const employeeLoad = new Map<number, number>()

  for (const job of jobs) {
    const crewSize = CREW_SIZE[job.sizeBand] ?? 2
    const baseHours = BASE_HOURS[job.sizeBand] ?? 16
    const multiplier = HOUR_MULTIPLIERS[job.jobType] ?? 1.0
    const plannedHours = Math.round(baseHours * multiplier)

    // Score each employee for this job
    const scored = employees.map((emp) => {
      let skills: SkillsJson
      try {
        skills = JSON.parse(emp.skillsJson) as SkillsJson
      } catch {
        skills = { interior: 0.5, exterior: 0.5, cabinet: 0.5, trim: 0.5, fullHouse: 0.5, speedFactor: 1.0 }
      }

      const skillScore = skills[job.jobType] ?? 0.5
      const speedFactor = skills.speedFactor ?? 1.0
      const distPenalty = zipDistance(emp.homeZip, job.zip)
      const available = employeeAvailableForWeek(emp.availabilityJson)
      const currentLoad = employeeLoad.get(emp.id) ?? 0

      // Load penalty: more than 40 hours already = reduce score
      const loadPenalty = currentLoad > 40 ? 0.2 : 0

      const baseScore = skillScore * speedFactor - distPenalty - loadPenalty

      return {
        employee: emp,
        skills,
        skillScore,
        speedFactor,
        distPenalty,
        available,
        loadPenalty,
        baseScore,
      }
    })

    // Filter to available employees, sort by baseScore desc
    const available = scored.filter((s) => s.available)
    available.sort((a, b) => b.baseScore - a.baseScore)

    // Greedy crew selection with synergy bonus
    const selectedCrew: typeof scored = []
    const conflictFlags: string[] = []

    for (const candidate of available) {
      if (selectedCrew.length >= crewSize) break

      // Compute synergy bonus with already-selected crew
      let synergyBonus = 0
      for (const existing of selectedCrew) {
        const key = `${Math.min(candidate.employee.id, existing.employee.id)}-${Math.max(candidate.employee.id, existing.employee.id)}`
        const syn = synergyMap.get(key) ?? synergyMap.get(`${candidate.employee.id}-${existing.employee.id}`) ?? 0
        synergyBonus += syn * 0.1
      }

      if (candidate.loadPenalty > 0) {
        conflictFlags.push(
          `${candidate.employee.name} is near capacity (${employeeLoad.get(candidate.employee.id) ?? 0}h scheduled)`
        )
      }
      if (!candidate.available) {
        conflictFlags.push(`${candidate.employee.name} has limited availability this week`)
      }

      selectedCrew.push(candidate)
    }

    // If we couldn't fill the crew, flag it
    if (selectedCrew.length < crewSize) {
      conflictFlags.push(
        `Could only assign ${selectedCrew.length}/${crewSize} crew members — consider hiring or rescheduling`
      )
    }

    // Update employee load
    for (const member of selectedCrew) {
      const perPersonHours = Math.round(plannedHours / selectedCrew.length)
      employeeLoad.set(member.employee.id, (employeeLoad.get(member.employee.id) ?? 0) + perPersonHours)
    }

    // Build rationale string
    const rationale = buildRationale(job, selectedCrew, synergyMap, conflictFlags)

    planItems.push({
      jobId: job.id,
      jobName: job.customerName,
      jobType: job.jobType,
      sizeBand: job.sizeBand,
      crew: selectedCrew.map((c) => c.employee.id),
      crewNames: selectedCrew.map((c) => c.employee.name),
      plannedHours,
      rationale,
      conflictFlags: conflictFlags.length > 0 ? conflictFlags : undefined,
    })
  }

  return planItems
}

function buildRationale(
  job: { jobType: string; sizeBand: string; zip: string; customerName: string },
  crew: Array<{
    employee: { id: number; name: string; homeZip: string }
    skillScore: number
    speedFactor: number
    distPenalty: number
    loadPenalty: number
  }>,
  synergyMap: Map<string, number>,
  conflicts: string[]
): string {
  const parts: string[] = []

  // Lead person (highest skill)
  const lead = crew[0]
  if (lead) {
    parts.push(
      `${lead.employee.name} leads as top ${job.jobType} skill (${(lead.skillScore * 100).toFixed(0)}%).`
    )
  }

  // Synergy notes
  const synPairs: string[] = []
  for (let i = 0; i < crew.length; i++) {
    for (let j = i + 1; j < crew.length; j++) {
      const a = crew[i].employee
      const b = crew[j].employee
      const key = `${a.id}-${b.id}`
      const syn = synergyMap.get(key) ?? synergyMap.get(`${b.id}-${a.id}`) ?? null
      if (syn !== null && syn > 0.6) {
        synPairs.push(`${a.name} + ${b.name} synergy ${(syn * 100).toFixed(0)}%`)
      }
    }
  }
  if (synPairs.length > 0) {
    parts.push(`Pair synergy: ${synPairs.join('; ')}.`)
  }

  // Distance
  const farMembers = crew.filter((c) => c.distPenalty > 0.05)
  if (farMembers.length > 0) {
    parts.push(
      `Distance note: ${farMembers.map((c) => c.employee.name).join(', ')} live farther from ${job.zip}.`
    )
  } else {
    parts.push(`All crew live near job zip ${job.zip}.`)
  }

  // Speed
  const fast = crew.filter((c) => c.speedFactor > 1.0)
  if (fast.length > 0) {
    parts.push(`${fast.map((c) => c.employee.name).join(', ')} ${fast.length === 1 ? 'has' : 'have'} above-average speed factor.`)
  }

  // Conflicts
  if (conflicts.length > 0) {
    parts.push(`Flags: ${conflicts.join(' | ')}`)
  }

  return parts.join(' ')
}
