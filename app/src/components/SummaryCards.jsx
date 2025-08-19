// export default function SummaryCards({ projects }) {
//   const totalProjects = projects.length
//   const totalEquipment = projects.reduce((sum, project) => sum + (project.equipment?.length || 0), 0)
//   const activeJobs = projects.filter(
//     (p) => new Date(p.sales_order_date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
//   ).length
//   const delayedJobs = 3 // This would be calculated based on actual progress
//   const nearingCompletion = 7 // This would be calculated based on progress
//   const upcomingDispatches = 12 // This would be calculated based on schedules

//   const cards = [
//     { value: totalProjects, label: "Total Projects", color: "text-blue-600" },
//     { value: totalEquipment, label: "Equipment in Hand", color: "text-green-600" },
//     { value: activeJobs, label: "Active Jobs", color: "text-blue-600" },
//     { value: delayedJobs, label: "Delayed Jobs", color: "text-red-600" },
//     { value: nearingCompletion, label: "Nearing Completion", color: "text-orange-600" },
//     { value: upcomingDispatches, label: "Upcoming Dispatches", color: "text-blue-600" },
//   ]

//   return (
//     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
//       {cards.map((card, index) => (
//         <div key={index} className="card">
//           <div className={`card-value ${card.color}`}>{card.value}</div>
//           <div className="card-label">{card.label}</div>
//         </div>
//       ))}
//     </div>
//   )
// }


import React, { useMemo } from 'react';

export default function SummaryCards({ projects = [] }) {
  const cardData = useMemo(() => {
    if (!projects || projects.length === 0) {
      return {
        totalProjects: 0,
        totalEquipment: 0,
        activeJobs: 0,
        delayedJobs: 0,
        nearingCompletion: 0,
        upcomingDispatches: 0
      };
    }

    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Total Projects
    const totalProjects = projects.length;

    // Total Equipment - count from equipment arrays or scope
    const totalEquipment = projects.reduce((sum, project) => {
      // Try multiple ways to count equipment
      if (Array.isArray(project.equipment)) {
        return sum + project.equipment.length;
      }
      if (Array.isArray(project.scope)) {
        return sum + project.scope.length;
      }
      if (typeof project.equipment_count === 'number') {
        return sum + project.equipment_count;
      }
      // Default assumption: each project has at least 1 equipment
      return sum + 1;
    }, 0);

    // Active Jobs - projects with recent order dates or active status
    const activeJobs = projects.filter((project) => {
      if (project.status === 'active' || project.is_active === true) return true;
      if (project.sales_order_date) {
        const orderDate = new Date(project.sales_order_date);
        return orderDate > threeMonthsAgo;
      }
      // If no clear date, assume recent projects are active
      if (project.created_at) {
        const createdDate = new Date(project.created_at);
        return createdDate > threeMonthsAgo;
      }
      return false;
    }).length;

    // Delayed Jobs - projects that might be delayed based on dates or status
    const delayedJobs = projects.filter((project) => {
      if (project.status === 'delayed' || project.is_delayed === true) return true;
      
      // Check if project is overdue based on expected completion
      if (project.expected_completion_date) {
        const expectedDate = new Date(project.expected_completion_date);
        return expectedDate < now && project.status !== 'completed';
      }
      
      // Check if project is old and still not completed
      if (project.sales_order_date) {
        const orderDate = new Date(project.sales_order_date);
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        return orderDate < sixMonthsAgo && project.status !== 'completed';
      }
      
      return false;
    }).length;

    // Nearing Completion - projects with high progress or near completion dates
    const nearingCompletion = projects.filter((project) => {
      if (project.status === 'nearing_completion' || project.progress_percentage >= 80) return true;
      
      // Check if expected completion is within next month
      if (project.expected_completion_date) {
        const expectedDate = new Date(project.expected_completion_date);
        return expectedDate <= oneMonthFromNow && expectedDate >= now;
      }
      
      // Check if project has been running for a while (likely near completion)
      if (project.sales_order_date) {
        const orderDate = new Date(project.sales_order_date);
        const fourMonthsAgo = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        return orderDate < fourMonthsAgo && orderDate > sixMonthsAgo && project.status !== 'completed';
      }
      
      return false;
    }).length;

    // Upcoming Dispatches - projects ready for dispatch or with dispatch dates
    const upcomingDispatches = projects.filter((project) => {
      if (project.status === 'ready_for_dispatch' || project.dispatch_date) return true;
      
      // Check if dispatch date is in near future
      if (project.expected_dispatch_date) {
        const dispatchDate = new Date(project.expected_dispatch_date);
        return dispatchDate <= oneMonthFromNow && dispatchDate >= now;
      }
      
      // Assume projects with very high progress are ready for dispatch
      if (project.progress_percentage >= 90) return true;
      
      return false;
    }).length;

    return {
      totalProjects,
      totalEquipment,
      activeJobs,
      delayedJobs,
      nearingCompletion,
      upcomingDispatches
    };
  }, [projects]);

  const cards = [
    { 
      value: cardData.totalProjects, 
      label: "Total Projects", 
      color: "text-blue-600",
      description: "All projects in system"
    },
    { 
      value: cardData.totalEquipment, 
      label: "Equipment in Hand", 
      color: "text-green-600",
      description: "Total equipment units"
    },
    { 
      value: cardData.activeJobs, 
      label: "Active Jobs", 
      color: "text-blue-600",
      description: "Currently active projects"
    },
    { 
      value: cardData.delayedJobs, 
      label: "Delayed Jobs", 
      color: "text-red-600",
      description: "Projects behind schedule"
    },
    { 
      value: cardData.nearingCompletion, 
      label: "Nearing Completion", 
      color: "text-orange-600",
      description: "Projects almost done"
    },
    { 
      value: cardData.upcomingDispatches, 
      label: "Upcoming Dispatches", 
      color: "text-purple-600",
      description: "Ready for dispatch"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="card group hover:shadow-lg transition-shadow duration-200">
          <div className={`card-value ${card.color} group-hover:scale-110 transition-transform duration-200`}>
            {card.value}
          </div>
          <div className="card-label">{card.label}</div>
          <div className="text-xs text-gray-500 mt-1">{card.description}</div>
        </div>
      ))}
    </div>
  );
}