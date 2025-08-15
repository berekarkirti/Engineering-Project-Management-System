export default function SummaryCards({ projects }) {
  const totalProjects = projects.length
  const totalEquipment = projects.reduce((sum, project) => sum + (project.equipment?.length || 0), 0)
  const activeJobs = projects.filter(
    (p) => new Date(p.sales_order_date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  ).length
  const delayedJobs = 3 // This would be calculated based on actual progress
  const nearingCompletion = 7 // This would be calculated based on progress
  const upcomingDispatches = 12 // This would be calculated based on schedules

  const cards = [
    { value: totalProjects, label: "Total Projects", color: "text-blue-600" },
    { value: totalEquipment, label: "Equipment in Hand", color: "text-green-600" },
    { value: activeJobs, label: "Active Jobs", color: "text-blue-600" },
    { value: delayedJobs, label: "Delayed Jobs", color: "text-red-600" },
    { value: nearingCompletion, label: "Nearing Completion", color: "text-orange-600" },
    { value: upcomingDispatches, label: "Upcoming Dispatches", color: "text-blue-600" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="card">
          <div className={`card-value ${card.color}`}>{card.value}</div>
          <div className="card-label">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
