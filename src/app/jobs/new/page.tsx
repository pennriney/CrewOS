import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

async function createJob(formData: FormData) {
  'use server'

  const startDate = new Date(formData.get('startDate') as string)
  const dueDate = new Date(formData.get('dueDate') as string)

  await prisma.job.create({
    data: {
      customerName: formData.get('customerName') as string,
      address: formData.get('address') as string,
      zip: formData.get('zip') as string,
      jobType: formData.get('jobType') as string,
      sizeBand: formData.get('sizeBand') as string,
      startDate,
      dueDate,
      notes: (formData.get('notes') as string) || '',
      status: 'pending',
    },
  })

  redirect('/jobs')
}

export default function NewJobPage() {
  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Add Job</h1>
      </div>

      <div className="card p-6">
        <form action={createJob} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Customer Name</label>
              <input name="customerName" required className="input" placeholder="e.g. Smith Family" />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Street Address</label>
              <input name="address" required className="input" placeholder="e.g. 123 Main St" />
            </div>

            <div>
              <label className="label">ZIP Code</label>
              <input name="zip" required className="input" placeholder="e.g. 98101" />
            </div>

            <div>
              <label className="label">Job Type</label>
              <select name="jobType" required className="input">
                <option value="">Select type…</option>
                <option value="interior">Interior</option>
                <option value="exterior">Exterior</option>
                <option value="cabinet">Cabinet</option>
                <option value="trim">Trim</option>
                <option value="fullHouse">Full House</option>
              </select>
            </div>

            <div>
              <label className="label">Size Band</label>
              <select name="sizeBand" required className="input">
                <option value="">Select size…</option>
                <option value="S">S — Small (≈16h)</option>
                <option value="M">M — Medium (≈40h)</option>
                <option value="L">L — Large (≈80h)</option>
              </select>
            </div>

            <div>
              <label className="label">Start Date</label>
              <input type="date" name="startDate" required className="input" />
            </div>

            <div>
              <label className="label">Due Date</label>
              <input type="date" name="dueDate" required className="input" />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea name="notes" rows={3} className="input" placeholder="Special instructions, access notes, etc." />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary">Create Job</button>
            <a href="/jobs" className="btn-secondary">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  )
}
