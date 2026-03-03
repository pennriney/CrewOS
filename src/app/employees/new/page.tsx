import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

async function createEmployee(formData: FormData) {
  'use server'

  const skills = {
    interior: parseFloat(formData.get('interior') as string) / 100,
    exterior: parseFloat(formData.get('exterior') as string) / 100,
    cabinet: parseFloat(formData.get('cabinet') as string) / 100,
    trim: parseFloat(formData.get('trim') as string) / 100,
    fullHouse: parseFloat(formData.get('fullHouse') as string) / 100,
    speedFactor: 1.0,
  }

  const avail = {
    mon: formData.get('mon') === 'on',
    tue: formData.get('tue') === 'on',
    wed: formData.get('wed') === 'on',
    thu: formData.get('thu') === 'on',
    fri: formData.get('fri') === 'on',
    sat: formData.get('sat') === 'on',
    sun: formData.get('sun') === 'on',
  }

  const flags = {
    lead: formData.get('lead') === 'on',
    licensed: formData.get('licensed') === 'on',
  }

  await prisma.employee.create({
    data: {
      name: formData.get('name') as string,
      hourlyCost: parseFloat(formData.get('hourlyCost') as string),
      homeZip: formData.get('homeZip') as string,
      skillsJson: JSON.stringify(skills),
      availabilityJson: JSON.stringify(avail),
      flagsJson: JSON.stringify(flags),
      notes: (formData.get('notes') as string) || '',
    },
  })

  redirect('/employees')
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const SKILL_TYPES = [
  { key: 'interior', label: 'Interior' },
  { key: 'exterior', label: 'Exterior' },
  { key: 'cabinet', label: 'Cabinet' },
  { key: 'trim', label: 'Trim' },
  { key: 'fullHouse', label: 'Full House' },
]

export default function NewEmployeePage() {
  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Add Employee</h1>
      </div>

      <div className="card p-6">
        <form action={createEmployee} className="space-y-6">
          {/* Basic Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Full Name</label>
              <input name="name" required className="input" placeholder="e.g. Jane Smith" />
            </div>
            <div>
              <label className="label">Hourly Cost ($)</label>
              <input name="hourlyCost" type="number" step="0.5" min="10" required className="input" placeholder="e.g. 25" />
            </div>
            <div>
              <label className="label">Home ZIP</label>
              <input name="homeZip" required className="input" placeholder="e.g. 98101" />
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="label">Skill Levels (0–100)</p>
            <div className="space-y-3 mt-2">
              {SKILL_TYPES.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24 shrink-0">{label}</span>
                  <input
                    type="range"
                    name={key}
                    min={0}
                    max={100}
                    defaultValue={70}
                    className="flex-1 accent-sky-600"
                  />
                  <span className="text-sm text-gray-500 w-8 text-right" id={`${key}-val`}>70</span>
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <p className="label">Availability</p>
            <div className="flex gap-3 flex-wrap mt-2">
              {DAYS.map((day) => (
                <label key={day} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name={day}
                    defaultChecked={!['sat', 'sun'].includes(day)}
                    className="rounded accent-sky-600"
                  />
                  <span className="text-sm text-gray-700 capitalize">{day}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div>
            <p className="label">Certifications</p>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" name="lead" className="rounded accent-sky-600" />
                <span className="text-sm text-gray-700">Crew Lead</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" name="licensed" className="rounded accent-sky-600" />
                <span className="text-sm text-gray-700">Licensed Painter</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" rows={3} className="input" placeholder="Strengths, preferences, or notes about this employee" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary">Create Employee</button>
            <a href="/employees" className="btn-secondary">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  )
}
