export interface SkillsJson {
  interior: number
  exterior: number
  cabinet: number
  trim: number
  fullHouse: number
  speedFactor: number
  [key: string]: number
}

export interface AvailabilityJson {
  mon: boolean
  tue: boolean
  wed: boolean
  thu: boolean
  fri: boolean
  sat: boolean
  sun: boolean
}

export interface FlagsJson {
  lead?: boolean
  licensed?: boolean
  [key: string]: boolean | undefined
}

export interface ConstraintsJson {
  noSaturdayWork?: boolean
  requiresLift?: boolean
  buildingAccessHours?: string
  historicHome?: boolean
  newConstruction?: boolean
  weekendOk?: boolean
  [key: string]: unknown
}

export type JobType = 'interior' | 'exterior' | 'cabinet' | 'trim' | 'fullHouse'
export type SizeBand = 'S' | 'M' | 'L'

export interface PlanItem {
  jobId: number
  jobName: string
  jobType: string
  sizeBand: string
  crew: number[]
  crewNames: string[]
  plannedHours: number
  rationale: string
  conflictFlags?: string[]
}

export interface ActualHoursJson {
  [employeeId: string]: number
}
