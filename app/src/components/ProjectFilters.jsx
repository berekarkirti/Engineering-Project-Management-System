// "use client"

// export default function ProjectFilters({ searchTerm, onSearchChange, filters, onFiltersChange, onAddProject }) {
//   const handleFilterChange = (key, value) => {
//     onFiltersChange({ ...filters, [key]: value })
//   }

//   return (
//     <div className="bg-white rounded-xl p-6 mb-8 shadow-md">
//       <div className="flex justify-between items-center mb-6">
//         <h3 className="text-xl font-semibold text-gray-900">Project Filters</h3>
//         <button className="btn btn-primary" onClick={onAddProject}>
//           + Add New Project
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//         <div className="flex flex-col">
//           <label className="font-medium mb-2 text-gray-700">Sort by Client</label>
//           <select
//             className="p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
//             value={filters.client}
//             onChange={(e) => handleFilterChange("client", e.target.value)}
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
//             className="p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
//             value={filters.equipment}
//             onChange={(e) => handleFilterChange("equipment", e.target.value)}
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
//             className="p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
//             value={filters.status}
//             onChange={(e) => handleFilterChange("status", e.target.value)}
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
//             className="p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
//             value={filters.manager}
//             onChange={(e) => handleFilterChange("manager", e.target.value)}
//           >
//             <option value="">All Managers</option>
//             <option value="sharma">A. Sharma</option>
//             <option value="patel">R. Patel</option>
//             <option value="gupta">S. Gupta</option>
//           </select>
//         </div>

//         <div className="flex flex-col">
//           <label className="font-medium mb-2 text-gray-700">Search Projects</label>
//           <input
//             type="text"
//             className="p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none bg-[url('data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23999' viewBox='0 0 24 24'%3E%3Cpath d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'/%3E%3C/svg%3E')] bg-no-repeat bg-right-4 bg-center pr-12"
//             style={{ backgroundSize: "20px" }}
//             placeholder="Search by project name, PO number, or client..."
//             value={searchTerm}
//             onChange={(e) => onSearchChange(e.target.value)}
//           />
//         </div>
//       </div>
//     </div>
//   )
// }

"use client";

export default function ProjectFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onAddProject,
}) {
  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

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
            value={filters.client}
            onChange={(e) => handleFilterChange("client", e.target.value)}
            aria-label="Sort by client"
          >
            <option value="">All Clients</option>
            <option value="reliance">Reliance Industries</option>
            <option value="tata">Tata Group</option>
            <option value="adani">Adani Ports</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="font-medium mb-2 text-gray-700">Equipment Type</label>
          <select
            className="p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
            value={filters.equipment}
            onChange={(e) => handleFilterChange("equipment", e.target.value)}
            aria-label="Filter by equipment type"
          >
            <option value="">All Equipment</option>
            <option value="heat-exchanger">Heat Exchanger</option>
            <option value="pressure-vessel">Pressure Vessel</option>
            <option value="reactor">Reactor</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="font-medium mb-2 text-gray-700">Status</label>
          <select
            className="p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="delayed">Delayed</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="font-medium mb-2 text-gray-700">Assigned Manager</label>
          <select
            className="p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none"
            value={filters.manager}
            onChange={(e) => handleFilterChange("manager", e.target.value)}
            aria-label="Filter by manager"
          >
            <option value="">All Managers</option>
            <option value="sharma">A. Sharma</option>
            <option value="patel">R. Patel</option>
            <option value="gupta">S. Gupta</option>
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
    </div>
  );
}
