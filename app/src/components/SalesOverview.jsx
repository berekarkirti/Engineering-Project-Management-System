// import React from 'react';

// const SalesOverview = () => {
//   return (
//      <div className="bg-gray-50  mb-8 ">
      
//       <div className="grid grid-cols-2 gap-5">
//         {/* Total Sales */}
//         <div className="card">
//           <div className="card-value text-gray-900">₹2.4M</div>
//           <div className="card-label">Total Sales</div>
//           <div className="card-label">75% of Target Achieved</div>
//         </div>
        
//         {/* Targeted Sales */}
//         <div className="card">
//           <div className="card-value text-orange-500">₹3.2M</div>
//           <div className="card-label">Targeted Sales</div>
//           <div className="card-label">FY 2024-25 Goal</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SalesOverview;

import React, { useMemo } from 'react';

const SalesOverview = ({ projects = [] }) => {
  const salesData = useMemo(() => {
    if (!projects || projects.length === 0) {
      return {
        totalSales: 0,
        targetSales: 0,
        targetAchieved: 0,
        formattedTotalSales: '₹0',
        formattedTargetSales: '₹0'
      };
    }

    // Calculate total sales from projects
    const totalSales = projects.reduce((sum, project) => {
      const value = project.total_value || 0;
      return sum + Number(value);
    }, 0);

    // Calculate target sales (you can modify this logic based on your requirements)
    // For now, setting target as 1.3x of total current sales or a minimum of 50L
    const targetSales = Math.max(totalSales * 1.3, 5000000); // Minimum 50L target

    // Calculate achievement percentage
    const targetAchieved = targetSales > 0 ? Math.round((totalSales / targetSales) * 100) : 0;

    // Format currency values
    const formatCurrency = (value) => {
      if (value >= 10000000) { // 1 Crore
        return `₹${(value / 10000000).toFixed(1)}Cr`;
      } else if (value >= 100000) { // 1 Lakh
        return `₹${(value / 100000).toFixed(1)}L`;
      } else {
        return `₹${(value / 1000).toFixed(0)}K`;
      }
    };

    return {
      totalSales,
      targetSales,
      targetAchieved,
      formattedTotalSales: formatCurrency(totalSales),
      formattedTargetSales: formatCurrency(targetSales)
    };
  }, [projects]);

  return (
    <div className="bg-gray-50 mb-8">
      <div className="grid grid-cols-2 gap-5">
        {/* Total Sales */}
        <div className="card">
          <div className="card-value text-gray-900">{salesData.formattedTotalSales}</div>
          <div className="card-label">Total Sales</div>
          <div className="card-label">
            {salesData.targetAchieved}% of Target Achieved
          </div>
        </div>
        
        {/* Targeted Sales */}
        <div className="card">
          <div className="card-value text-orange-500">{salesData.formattedTargetSales}</div>
          <div className="card-label">Targeted Sales</div>
          <div className="card-label">FY 2024-25 Goal</div>
        </div>
      </div>
    </div>
  );
};

export default SalesOverview;