import React from 'react';

const SalesOverview = () => {
  return (
     <div className="bg-gray-50  mb-8 ">
      
      <div className="grid grid-cols-2 gap-5">
        {/* Total Sales */}
        <div className="card">
          <div className="card-value text-gray-900">₹2.4M</div>
          <div className="card-label">Total Sales</div>
          <div className="card-label">75% of Target Achieved</div>
        </div>
        
        {/* Targeted Sales */}
        <div className="card">
          <div className="card-value text-orange-500">₹3.2M</div>
          <div className="card-label">Targeted Sales</div>
          <div className="card-label">FY 2024-25 Goal</div>
        </div>
      </div>
    </div>
  );
};

export default SalesOverview;