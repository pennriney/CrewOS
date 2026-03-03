import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.outcome.deleteMany()
  await prisma.pairSynergy.deleteMany()
  await prisma.plan.deleteMany()
  await prisma.job.deleteMany()
  await prisma.employee.deleteMany()

  // ─── Employees ────────────────────────────────────────────────────────────
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        name: 'Marcus Webb',
        hourlyCost: 28,
        homeZip: '98101',
        skillsJson: JSON.stringify({
          interior: 0.9,
          exterior: 0.8,
          cabinet: 0.6,
          trim: 0.95,
          fullHouse: 0.85,
          speedFactor: 1.05,
        }),
        availabilityJson: JSON.stringify({
          mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false,
        }),
        notes: 'Lead painter. Excellent on trim and detailed work.',
        flagsJson: JSON.stringify({ lead: true, licensed: true }),
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Diane Torres',
        hourlyCost: 24,
        homeZip: '98102',
        skillsJson: JSON.stringify({
          interior: 0.85,
          exterior: 0.7,
          cabinet: 0.9,
          trim: 0.75,
          fullHouse: 0.8,
          speedFactor: 1.0,
        }),
        availabilityJson: JSON.stringify({
          mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false,
        }),
        notes: 'Strong on cabinets and interior finish work.',
        flagsJson: JSON.stringify({ lead: false, licensed: true }),
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Kevin Park',
        hourlyCost: 22,
        homeZip: '98105',
        skillsJson: JSON.stringify({
          interior: 0.75,
          exterior: 0.88,
          cabinet: 0.5,
          trim: 0.7,
          fullHouse: 0.72,
          speedFactor: 0.95,
        }),
        availabilityJson: JSON.stringify({
          mon: true, tue: true, wed: false, thu: true, fri: true, sat: false, sun: false,
        }),
        notes: 'Great exterior painter, especially two-story work.',
        flagsJson: JSON.stringify({ lead: false, licensed: false }),
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Priya Nair',
        hourlyCost: 26,
        homeZip: '98103',
        skillsJson: JSON.stringify({
          interior: 0.88,
          exterior: 0.75,
          cabinet: 0.85,
          trim: 0.8,
          fullHouse: 0.87,
          speedFactor: 1.1,
        }),
        availabilityJson: JSON.stringify({
          mon: true, tue: true, wed: true, thu: true, fri: false, sat: false, sun: false,
        }),
        notes: 'Fast and clean. Versatile across job types.',
        flagsJson: JSON.stringify({ lead: true, licensed: true }),
      },
    }),
    prisma.employee.create({
      data: {
        name: 'James Okafor',
        hourlyCost: 20,
        homeZip: '98115',
        skillsJson: JSON.stringify({
          interior: 0.7,
          exterior: 0.65,
          cabinet: 0.4,
          trim: 0.6,
          fullHouse: 0.65,
          speedFactor: 0.9,
        }),
        availabilityJson: JSON.stringify({
          mon: false, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false,
        }),
        notes: 'Junior painter. Good work ethic, still developing speed.',
        flagsJson: JSON.stringify({ lead: false, licensed: false }),
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Sofia Reyes',
        hourlyCost: 25,
        homeZip: '98107',
        skillsJson: JSON.stringify({
          interior: 0.82,
          exterior: 0.78,
          cabinet: 0.88,
          trim: 0.85,
          fullHouse: 0.83,
          speedFactor: 1.02,
        }),
        availabilityJson: JSON.stringify({
          mon: true, tue: true, wed: true, thu: false, fri: true, sat: false, sun: false,
        }),
        notes: 'Detail-oriented. Shines on cabinet and trim work.',
        flagsJson: JSON.stringify({ lead: false, licensed: true }),
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Derek Holt',
        hourlyCost: 23,
        homeZip: '98108',
        skillsJson: JSON.stringify({
          interior: 0.78,
          exterior: 0.82,
          cabinet: 0.55,
          trim: 0.65,
          fullHouse: 0.76,
          speedFactor: 0.98,
        }),
        availabilityJson: JSON.stringify({
          mon: true, tue: false, wed: true, thu: true, fri: true, sat: true, sun: false,
        }),
        notes: 'Reliable exterior painter. Good ladder work.',
        flagsJson: JSON.stringify({ lead: false, licensed: false }),
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Amy Chen',
        hourlyCost: 27,
        homeZip: '98104',
        skillsJson: JSON.stringify({
          interior: 0.91,
          exterior: 0.72,
          cabinet: 0.93,
          trim: 0.88,
          fullHouse: 0.9,
          speedFactor: 1.08,
        }),
        availabilityJson: JSON.stringify({
          mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false,
        }),
        notes: 'Excellent interior and cabinet specialist. High quality output.',
        flagsJson: JSON.stringify({ lead: true, licensed: true }),
      },
    }),
  ])

  console.log(`Created ${employees.length} employees`)

  // ─── Jobs ─────────────────────────────────────────────────────────────────
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday this week

  const d = (offsetDays: number) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + offsetDays)
    return date
  }

  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        customerName: 'Hartwell Family',
        address: '1420 Pine Ridge Rd',
        zip: '98103',
        jobType: 'interior',
        sizeBand: 'M',
        startDate: d(0),
        dueDate: d(4),
        constraintsJson: JSON.stringify({ noSaturdayWork: true }),
        notes: '3-bedroom interior repaint. Owner has pets.',
        status: 'scheduled',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Greenview HOA',
        address: '800 Greenview Blvd',
        zip: '98105',
        jobType: 'exterior',
        sizeBand: 'L',
        startDate: d(0),
        dueDate: d(7),
        constraintsJson: JSON.stringify({ requiresLift: true }),
        notes: 'Large exterior on 3-story condo building.',
        status: 'scheduled',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Chen Residence',
        address: '342 Birch Ave',
        zip: '98104',
        jobType: 'cabinet',
        sizeBand: 'S',
        startDate: d(1),
        dueDate: d(3),
        constraintsJson: JSON.stringify({}),
        notes: 'Kitchen cabinet repaint. White shaker style.',
        status: 'scheduled',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Marcus & Lee LLC',
        address: '990 Commerce Park Dr',
        zip: '98108',
        jobType: 'trim',
        sizeBand: 'S',
        startDate: d(2),
        dueDate: d(4),
        constraintsJson: JSON.stringify({}),
        notes: 'Commercial trim and baseboard touch-up.',
        status: 'pending',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Svensson Estate',
        address: '2100 Lakeview Dr',
        zip: '98101',
        jobType: 'fullHouse',
        sizeBand: 'L',
        startDate: d(7),
        dueDate: d(14),
        constraintsJson: JSON.stringify({ historicHome: true }),
        notes: 'Full repaint of historic 5-bedroom home. Special prep required.',
        status: 'pending',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Park Condo Unit 4B',
        address: '555 Urban Ave Unit 4B',
        zip: '98102',
        jobType: 'interior',
        sizeBand: 'S',
        startDate: d(3),
        dueDate: d(5),
        constraintsJson: JSON.stringify({ buildingAccessHours: '8am-5pm' }),
        notes: 'Single bedroom and living area repaint.',
        status: 'pending',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Thornton New Build',
        address: '4400 Maple Creek Blvd',
        zip: '98115',
        jobType: 'fullHouse',
        sizeBand: 'L',
        startDate: d(7),
        dueDate: d(17),
        constraintsJson: JSON.stringify({ newConstruction: true }),
        notes: 'New construction full-house paint. Coordinate with GC.',
        status: 'pending',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Alvarez Kitchen',
        address: '212 Fern St',
        zip: '98107',
        jobType: 'cabinet',
        sizeBand: 'S',
        startDate: d(5),
        dueDate: d(7),
        constraintsJson: JSON.stringify({}),
        notes: 'Dark cabinet transformation. Requires two-tone finish.',
        status: 'pending',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Ridgeline Office Park',
        address: '7800 Ridgeline Blvd',
        zip: '98109',
        jobType: 'exterior',
        sizeBand: 'M',
        startDate: d(7),
        dueDate: d(11),
        constraintsJson: JSON.stringify({ weekendOk: true }),
        notes: 'Two-building office complex exterior.',
        status: 'pending',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Nakamura Trim',
        address: '63 Willow Ln',
        zip: '98103',
        jobType: 'trim',
        sizeBand: 'M',
        startDate: d(5),
        dueDate: d(8),
        constraintsJson: JSON.stringify({}),
        notes: 'Full interior trim repaint including crown molding.',
        status: 'pending',
      },
    }),
  ])

  console.log(`Created ${jobs.length} jobs`)

  // ─── PairSynergy ──────────────────────────────────────────────────────────
  const pairs = [
    [0, 1, 0.8, 5],  // Marcus + Diane
    [0, 3, 0.7, 3],  // Marcus + Priya
    [0, 7, 0.9, 4],  // Marcus + Amy
    [1, 7, 0.85, 3], // Diane + Amy
    [2, 6, 0.6, 2],  // Kevin + Derek
    [3, 5, 0.75, 4], // Priya + Sofia
    [1, 5, 0.8, 3],  // Diane + Sofia
    [3, 7, 0.65, 2], // Priya + Amy
    [4, 6, 0.5, 1],  // James + Derek
    [0, 2, 0.55, 2], // Marcus + Kevin
  ]

  for (const [aIdx, bIdx, score, count] of pairs) {
    await prisma.pairSynergy.create({
      data: {
        employeeAId: employees[aIdx].id,
        employeeBId: employees[bIdx].id,
        synergyScore: score,
        sampleCount: count,
      },
    })
  }

  console.log(`Created ${pairs.length} pair synergy records`)

  // ─── Outcomes ─────────────────────────────────────────────────────────────
  // Create some past outcomes for jobs that are "completed"
  const pastJobs = await Promise.all([
    prisma.job.create({
      data: {
        customerName: 'Rivera Bedroom',
        address: '77 Oak Ct',
        zip: '98101',
        jobType: 'interior',
        sizeBand: 'S',
        startDate: d(-14),
        dueDate: d(-10),
        notes: 'Master bedroom repaint.',
        status: 'completed',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Blackwood Exterior',
        address: '310 Cedar Blvd',
        zip: '98107',
        jobType: 'exterior',
        sizeBand: 'M',
        startDate: d(-12),
        dueDate: d(-9),
        notes: 'Full exterior repaint.',
        status: 'completed',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Nguyen Cabinets',
        address: '458 Spruce Way',
        zip: '98103',
        jobType: 'cabinet',
        sizeBand: 'S',
        startDate: d(-10),
        dueDate: d(-8),
        notes: 'Kitchen cabinet refresh.',
        status: 'completed',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Montoya Full House',
        address: '1002 Elm Street',
        zip: '98105',
        jobType: 'fullHouse',
        sizeBand: 'L',
        startDate: d(-21),
        dueDate: d(-12),
        notes: 'Complete interior + exterior.',
        status: 'completed',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Patel Trim',
        address: '88 Ash Ave',
        zip: '98102',
        jobType: 'trim',
        sizeBand: 'S',
        startDate: d(-8),
        dueDate: d(-6),
        notes: 'Interior trim touchup.',
        status: 'completed',
      },
    }),
    prisma.job.create({
      data: {
        customerName: 'Schulz Exterior',
        address: '920 Birch Lane',
        zip: '98108',
        jobType: 'exterior',
        sizeBand: 'S',
        startDate: d(-7),
        dueDate: d(-5),
        notes: 'Garage and fence exterior paint.',
        status: 'completed',
      },
    }),
  ])

  const outcomes = await Promise.all([
    prisma.outcome.create({
      data: {
        jobId: pastJobs[0].id,
        dateCompleted: d(-10),
        actualHoursJson: JSON.stringify({
          [employees[0].id]: 8,
          [employees[3].id]: 7,
        }),
        issuesJson: JSON.stringify([]),
        notes: 'Clean finish. Came in under planned hours.',
      },
    }),
    prisma.outcome.create({
      data: {
        jobId: pastJobs[1].id,
        dateCompleted: d(-9),
        actualHoursJson: JSON.stringify({
          [employees[2].id]: 20,
          [employees[6].id]: 22,
          [employees[4].id]: 18,
        }),
        issuesJson: JSON.stringify(['Weather delay on day 2', 'Extra prep needed for old siding']),
        notes: 'Slightly over budget due to extra prep.',
      },
    }),
    prisma.outcome.create({
      data: {
        jobId: pastJobs[2].id,
        dateCompleted: d(-8),
        actualHoursJson: JSON.stringify({
          [employees[1].id]: 9,
          [employees[7].id]: 8,
        }),
        issuesJson: JSON.stringify([]),
        notes: 'Excellent cabinet work. Client very happy.',
      },
    }),
    prisma.outcome.create({
      data: {
        jobId: pastJobs[3].id,
        dateCompleted: d(-13),
        actualHoursJson: JSON.stringify({
          [employees[0].id]: 28,
          [employees[1].id]: 30,
          [employees[3].id]: 25,
          [employees[7].id]: 27,
        }),
        issuesJson: JSON.stringify(['Client requested color change mid-job']),
        notes: 'Overran due to unplanned color change. Good teamwork.',
      },
    }),
    prisma.outcome.create({
      data: {
        jobId: pastJobs[4].id,
        dateCompleted: d(-6),
        actualHoursJson: JSON.stringify({
          [employees[0].id]: 7,
          [employees[5].id]: 8,
        }),
        issuesJson: JSON.stringify([]),
        notes: 'Quick and clean trim work.',
      },
    }),
    prisma.outcome.create({
      data: {
        jobId: pastJobs[5].id,
        dateCompleted: d(-5),
        actualHoursJson: JSON.stringify({
          [employees[2].id]: 14,
          [employees[6].id]: 15,
        }),
        issuesJson: JSON.stringify(['One section needed a second coat']),
        notes: 'Minor overrun on second coat.',
      },
    }),
  ])

  console.log(`Created ${outcomes.length} outcomes`)

  // ─── Seed a sample Plan ───────────────────────────────────────────────────
  const planItems = [
    {
      jobId: jobs[0].id,
      jobName: 'Hartwell Family',
      jobType: 'interior',
      sizeBand: 'M',
      crew: [employees[0].id, employees[3].id, employees[7].id],
      crewNames: ['Marcus Webb', 'Priya Nair', 'Amy Chen'],
      plannedHours: 40,
      rationale:
        'Marcus leads interior work (skill 0.9), Amy excels at interior (0.91). Priya adds speed and versatility. Strong synergy between Marcus-Amy (0.9) and Diane-Amy (0.85). Distance penalty minimal (zip proximity).',
    },
    {
      jobId: jobs[1].id,
      jobName: 'Greenview HOA',
      jobType: 'exterior',
      sizeBand: 'L',
      crew: [employees[2].id, employees[6].id, employees[4].id, employees[0].id],
      crewNames: ['Kevin Park', 'Derek Holt', 'James Okafor', 'Marcus Webb'],
      plannedHours: 80,
      rationale:
        'Kevin and Derek are top exterior painters. Large job (L) requires 4 crew. Marcus added as lead. Kevin-Derek synergy (0.6) is the best available exterior pair. Requires lift — Kevin flagged as experienced.',
    },
    {
      jobId: jobs[2].id,
      jobName: 'Chen Residence',
      jobType: 'cabinet',
      sizeBand: 'S',
      crew: [employees[1].id, employees[7].id],
      crewNames: ['Diane Torres', 'Amy Chen'],
      plannedHours: 16,
      rationale:
        'Diane (cabinet 0.9) and Amy (cabinet 0.93) are the top cabinet specialists. Strong synergy (0.85). Small job needs only 2. Zip proximity good.',
    },
  ]

  await prisma.plan.create({
    data: {
      weekOf: weekStart,
      itemsJson: JSON.stringify(planItems),
    },
  })

  console.log('Created seed plan')
  console.log('\nSeed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
