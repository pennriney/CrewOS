import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import SkillBar from '@/components/SkillBar'
import type { SkillsJson, FlagsJson } from '@/types'

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Employees</h1>
        <Link href="/employees/new" className="btn-primary">+ Add Employee</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {employees.map((emp) => {
          let skills: SkillsJson
          try { skills = JSON.parse(emp.skillsJson) } catch { skills = {} as SkillsJson }
          const flags: FlagsJson = JSON.parse(emp.flagsJson || '{}')

          return (
            <Link
              key={emp.id}
              href={`/employees/${emp.id}`}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{emp.name}</p>
                  <p className="text-sm text-gray-500">${emp.hourlyCost}/hr · ZIP {emp.homeZip}</p>
                </div>
                <div className="flex gap-1">
                  {flags.lead && <span className="badge bg-amber-100 text-amber-700">Lead</span>}
                  {flags.licensed && <span className="badge bg-green-100 text-green-700">Lic.</span>}
                </div>
              </div>

              <div className="space-y-1.5">
                <SkillBar label="Interior" value={skills.interior ?? 0} />
                <SkillBar label="Exterior" value={skills.exterior ?? 0} />
                <SkillBar label="Cabinet" value={skills.cabinet ?? 0} />
              </div>

              {emp.notes && (
                <p className="mt-3 text-xs text-gray-500 line-clamp-2">{emp.notes}</p>
              )}
            </Link>
          )
        })}
      </div>

      {employees.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-lg">No employees yet.</p>
          <Link href="/employees/new" className="btn-primary mt-4 inline-flex">Add your first employee</Link>
        </div>
      )}
    </div>
  )
}
