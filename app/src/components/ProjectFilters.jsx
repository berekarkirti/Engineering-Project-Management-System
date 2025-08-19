// "use client";

// export default function ProjectFilters({
//   searchTerm,
//   onSearchChange,
//   filters,
//   onFiltersChange,
//   onAddProject,
// }) {
//   const handleFilterChange = (key, value) => {
//     onFiltersChange({ ...filters, [key]: value });
//   };

//   return (
//     <div className="bg-white rounded-xl p-4 sm:p-6 mb-6 shadow-md">
//       {/* header: stack on mobile, row on md+ */}
//       <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5 sm:mb-6">
//         <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Project Filters</h3>
//         <button
//           className="btn btn-primary w-full md:w-auto rounded-lg"
//           onClick={onAddProject}
//         >
//           + Add New Project
//         </button>
//       </div>

//       {/* grid: 1 → 2 → 3 → 5 */}
//       <div
//         className="
//           grid grid-cols-1
//           sm:grid-cols-2
//           md:grid-cols-3
//           xl:grid-cols-5
//           gap-3 sm:gap-4
//         "
//       >
//         <div className="flex flex-col">
//           <label className="font-medium mb-2 text-gray-700">Sort by Client</label>
//           <select
//             className="p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
//             value={filters.client}
//             onChange={(e) => handleFilterChange("client", e.target.value)}
//             aria-label="Sort by client"
//           >
//             <option value="">All Clients</option>
//             <option value="reliance">Reliance Industries</option>
//             <option value="tata">Tata Group</option>
//             <option value="adani">Adani Ports</option>
//           </select>
//         </div>

//         <div className="flex flex-col">
//           <label className="font-medium mb-2 text-gray-700">Equipment Type</label>
//           <select
//             className="p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
//             value={filters.equipment}
//             onChange={(e) => handleFilterChange("equipment", e.target.value)}
//             aria-label="Filter by equipment type"
//           >
//             <option value="">All Equipment</option>
//             <option value="heat-exchanger">Heat Exchanger</option>
//             <option value="pressure-vessel">Pressure Vessel</option>
//             <option value="reactor">Reactor</option>
//           </select>
//         </div>

//         <div className="flex flex-col">
//           <label className="font-medium mb-2 text-gray-700">Status</label>
//           <select
//             className="p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
//             value={filters.status}
//             onChange={(e) => handleFilterChange("status", e.target.value)}
//             aria-label="Filter by status"
//           >
//             <option value="">All Status</option>
//             <option value="active">Active</option>
//             <option value="delayed">Delayed</option>
//             <option value="completed">Completed</option>
//           </select>
//         </div>

//         <div className="flex flex-col">
//           <label className="font-medium mb-2 text-gray-700">Assigned Manager</label>
//           <select
//             className="p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
//             value={filters.manager}
//             onChange={(e) => handleFilterChange("manager", e.target.value)}
//             aria-label="Filter by manager"
//           >
//             <option value="">All Managers</option>
//             <option value="sharma">A. Sharma</option>
//             <option value="patel">R. Patel</option>
//             <option value="gupta">S. Gupta</option>
//           </select>
//         </div>

//         {/* search spans full width on sm/md for breathing room */}

//         <div className="flex flex-col sm:col-span-2 md:col-span-3 xl:col-span-1">
//           <label htmlFor="projectSearch" className="font-medium mb-2 text-gray-700">
//             Search Projects
//           </label>
//           <div className="relative">
//             <svg
//               className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
//               viewBox="0 0 24 24"
//               fill="currentColor"
//               aria-hidden="true"
//             >
//               <path d="M10 4a6 6 0 104.472 10.06l3.734 3.734a1 1 0 001.414-1.414l-3.734-3.734A6 6 0 0010 4zm-4 6a4 4 0 118 0 4 4 0 01-8 0z" />
//             </svg>
//             <input
//               id="projectSearch"
//               type="text"
//               className="
//                 w-full h-11 sm:h-12
//                 rounded-lg border-2 border-gray-200 bg-white
//                 text-sm placeholder-gray-400
//                 pl-10 sm:pl-11 pr-3
//                 transition-colors focus:border-blue-500 focus:outline-none
//               "
//               placeholder="Search by project name, PO number, or client..."
//               value={searchTerm}
//               onChange={(e) => onSearchChange(e.target.value)}
//               aria-label="Search projects"
//             />
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }

"use client";

import { useMemo } from "react";

export default function ProjectFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onAddProject,
  projects = [], // Add projects prop to extract dynamic options
}) {
  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Extract unique values from projects for dynamic options
  const filterOptions = useMemo(() => {
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      return {
        clients: [],
        equipmentTypes: [],
        managers: [],
        statuses: []
      };
    }

    const clients = [...new Set(
      projects
        .map(p => p.client_name)
        .filter(Boolean)
        .sort()
    )];

    const equipmentTypes = [...new Set(
      projects
        .flatMap(p => {
          // Handle different possible equipment data structures
          if (Array.isArray(p.equipment)) {
            return p.equipment.map(e => e.equipment_type || e.type).filter(Boolean);
          }
          if (typeof p.equipment_type === 'string') {
            return [p.equipment_type];
          }
          if (Array.isArray(p.scope)) {
            return p.scope;
          }
          if (typeof p.scope === 'string') {
            return p.scope.split(',').map(s => s.trim());
          }
          return [];
        })
        .filter(Boolean)
        .sort()
    )];

    const managers = [...new Set(
      projects
        .map(p => p.project_manager)
        .filter(Boolean)
        .sort()
    )];

    // Determine project status based on progress or other indicators
    const statuses = [...new Set(
      projects
        .map(p => {
          if (p.status) return p.status;
          if (p.is_completed) return 'Completed';
          if (p.is_active === false) return 'Inactive';
          // You can add more logic here based on your project structure
          return 'Active';
        })
        .filter(Boolean)
        .sort()
    )];

    return { clients, equipmentTypes, managers, statuses };
  }, [projects]);

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 mb-6 shadow-md">
      {/* header: stack on mobile, row on md+ */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Project Filters</h3>
        <button
          className="btn btn-primary w-full md:w-auto rounded-lg"
          onClick={onAddProject}
        >
          + Add New Project
        </button>
      </div>

      {/* grid: 1 → 2 → 3 → 5 */}
      <div
        className="
          grid grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          xl:grid-cols-5
          gap-3 sm:gap-4
        "
      >
        <div className="flex flex-col">
          <label className="font-medium mb-2 text-gray-700">Sort by Client</label>
          <select
            className="p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
            value={filters.client || ''}
            onChange={(e) => handleFilterChange("client", e.target.value)}
            aria-label="Sort by client"
          >
            <option value="">All Clients</option>
            {filterOptions.clients.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="font-medium mb-2 text-gray-700">Equipment Type</label>
          <select
            className="p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
            value={filters.equipment || ''}
            onChange={(e) => handleFilterChange("equipment", e.target.value)}
            aria-label="Filter by equipment type"
          >
            <option value="">All Equipment</option>
            {filterOptions.equipmentTypes.map(equipment => (
              <option key={equipment} value={equipment}>{equipment}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="font-medium mb-2 text-gray-700">Status</label>
          <select
            className="p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            {filterOptions.statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="font-medium mb-2 text-gray-700">Assigned Manager</label>
          <select
            className="p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
            value={filters.manager || ''}
            onChange={(e) => handleFilterChange("manager", e.target.value)}
            aria-label="Filter by manager"
          >
            <option value="">All Managers</option>
            {filterOptions.managers.map(manager => (
              <option key={manager} value={manager}>{manager}</option>
            ))}
          </select>
        </div>

        {/* search spans full width on sm/md for breathing room */}
        <div className="flex flex-col sm:col-span-2 md:col-span-3 xl:col-span-1">
          <label htmlFor="projectSearch" className="font-medium mb-2 text-gray-700">
            Search Projects
          </label>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 4a6 6 0 104.472 10.06l3.734 3.734a1 1 0 001.414-1.414l-3.734-3.734A6 6 0 0010 4zm-4 6a4 4 0 118 0 4 4 0 01-8 0z" />
            </svg>
            <input
              id="projectSearch"
              type="text"
              className="
                w-full h-11 sm:h-12
                rounded-lg border-2 border-gray-200 bg-white
                text-sm placeholder-gray-400
                pl-10 sm:pl-11 pr-3
                transition-colors focus:border-blue-500 focus:outline-none
              "
              placeholder="Search by project name, PO number, or client..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search projects"
            />
          </div>
        </div>
      </div>

      {/* Show filter summary if any filters are active */}
      {(filters.client || filters.equipment || filters.status || filters.manager || searchTerm) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-blue-800">Active Filters:</span>
            {filters.client && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Client: {filters.client}
                <button
                  onClick={() => handleFilterChange("client", "")}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                  aria-label="Remove client filter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.equipment && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Equipment: {filters.equipment}
                <button
                  onClick={() => handleFilterChange("equipment", "")}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                  aria-label="Remove equipment filter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Status: {filters.status}
                <button
                  onClick={() => handleFilterChange("status", "")}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                  aria-label="Remove status filter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.manager && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Manager: {filters.manager}
                <button
                  onClick={() => handleFilterChange("manager", "")}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                  aria-label="Remove manager filter"
                >
                  ×
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Search: "{searchTerm}"
                <button
                  onClick={() => onSearchChange("")}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                  aria-label="Clear search"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                onFiltersChange({});
                onSearchChange("");
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}