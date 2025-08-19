// "use client";

// import { useEffect, useMemo, useState } from "react";
// import {
//   formatDate,
//   formatCurrency,
//   calculateOverallProjectProgress,
// } from "@/lib/data-helpers";

// /* tiny class combiner */
// const cx = (...a) => a.filter(Boolean).join(" ");

// // Safe fetch function that handles 404 errors gracefully
// const safeFetch = async (url) => {
//   try {
//     const response = await fetch(url);
//     if (response.status === 404) {
//       console.warn(`Table not found: ${url}`);
//       return { data: [], error: null };
//     }
//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//     }
//     const data = await response.json();
//     return { data, error: null };
//   } catch (error) {
//     console.error(`Fetch error for ${url}:`, error);
//     return { data: [], error: error.message };
//   }
// };

// export default function ProjectDetailModal({ project, onClose }) {
//   /** -------------------- STATE -------------------- **/
//   const [activeTab, setActiveTab] = useState("equipment");
//   const [activeEquipType, setActiveEquipType] = useState("");
//   const [activePhase, setActivePhase] = useState("documentation");

//   const [detailedProject, setDetailedProject] = useState(null);
//   const [equipment, setEquipment] = useState([]);
//   const [progressData, setProgressData] = useState([]);
//   const [vdcrRows, setVdcrRows] = useState([]);
//   const [deviations, setDeviations] = useState([]);
//   const [tpiLogs, setTpiLogs] = useState([]);
//   const [chronology, setChronology] = useState([]);
//   const [photos, setPhotos] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [tableErrors, setTableErrors] = useState({});

//   /** expand/collapse per-equipment details */
//   const [openEquipIds, setOpenEquipIds] = useState(() => new Set());

//   /** -------------------- FETCH -------------------- **/
//   useEffect(() => {
//     if (!project?.id) {
//       setLoading(false);
//       setError("No project selected or project data is incomplete.");
//       return;
//     }

//     const pid = project.id;
//     setLoading(true);
//     setError(null);
//     setTableErrors({});

//     const fetchData = async () => {
//       try {
//         // Try different possible table/column names
//         const queries = [
//           { key: 'project', url: `/api/projects/${pid}`, fallback: () => project },
//           { key: 'equipment', url: `/api/equipment?project_id=${pid}`, fallback: () => [] },
//           { key: 'progress', url: `/api/progress-tracking?project_id=${pid}`, fallback: () => [] },
//           { key: 'vdcr', url: `/api/vdcr?project_id=${pid}`, fallback: () => [] },
//           { key: 'deviations', url: `/api/deviations?project_id=${pid}`, fallback: () => [] },
//           { key: 'tpi', url: `/api/tpi-logs?project_id=${pid}`, fallback: () => [] },
//           { key: 'chronology', url: `/api/chronology-entries?project_id=${pid}`, fallback: () => [] },
//           { key: 'photos', url: `/api/progress-photos?project_id=${pid}`, fallback: () => [] },
//         ];

//         const results = await Promise.all(
//           queries.map(async (query) => {
//             const result = await safeFetch(query.url);
//             return {
//               key: query.key,
//               data: result.data || query.fallback(),
//               error: result.error
//             };
//           })
//         );

//         const errors = {};
//         results.forEach(result => {
//           if (result.error) {
//             errors[result.key] = result.error;
//           }
//         });

//         setTableErrors(errors);

//         // Set state with results
//         const projectData = results.find(r => r.key === 'project')?.data || project;
//         const equipmentData = results.find(r => r.key === 'equipment')?.data || [];
        
//         setDetailedProject(projectData);
//         setEquipment(equipmentData);
//         setProgressData(results.find(r => r.key === 'progress')?.data || []);
//         setVdcrRows(results.find(r => r.key === 'vdcr')?.data || []);
//         setDeviations(results.find(r => r.key === 'deviations')?.data || []);
//         setTpiLogs(results.find(r => r.key === 'tpi')?.data || []);
//         setChronology(results.find(r => r.key === 'chronology')?.data || []);
//         setPhotos(results.find(r => r.key === 'photos')?.data || []);

//         // Set default equipment type
//         if (equipmentData?.length && !activeEquipType) {
//           const firstType = equipmentData[0].equipment_type || equipmentData[0].type || 'Equipment';
//           setActiveEquipType(firstType);
//         }

//       } catch (err) {
//         console.error('Fetch error:', err);
//         setError("Failed to load project details. Some features may not be available.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [project?.id]);

//   /** -------------------- DERIVED -------------------- **/
//   const equipTypes = useMemo(
//     () => {
//       if (!equipment?.length) return [];
//       const types = equipment.map(e => e.equipment_type || e.type || 'Equipment');
//       return Array.from(new Set(types)).filter(Boolean);
//     },
//     [equipment]
//   );

//   const filteredEquip = useMemo(
//     () => (equipment || []).filter((e) => 
//       (e.equipment_type || e.type || 'Equipment') === activeEquipType
//     ),
//     [equipment, activeEquipType]
//   );

//   const overallProgress = useMemo(
//     () => {
//       if (!progressData?.length) return 0;
//       try {
//         return calculateOverallProjectProgress(progressData);
//       } catch {
//         // Fallback calculation if the helper function fails
//         const total = progressData.reduce((sum, item) => {
//           const progress = item.progress_percentage || item.progress || 0;
//           return sum + Number(progress);
//         }, 0);
//         return progressData.length > 0 ? Math.round(total / progressData.length) : 0;
//       }
//     },
//     [progressData]
//   );

//   const phasePerc = useMemo(() => {
//     const keys = ["documentation", "procurement", "manufacturing", "testing"];
//     const agg = Object.fromEntries(keys.map((k) => [k, { sum: 0, w: 0 }]));
    
//     for (const it of progressData || []) {
//       const phase = (it.phase || it.phase_name || "").toLowerCase();
//       if (agg[phase]) {
//         const weight = it.weight ?? 1;
//         const progress = it.progress_percentage || it.progress || 0;
//         agg[phase].sum += Number(progress) * weight;
//         agg[phase].w += weight;
//       }
//     }
    
//     return Object.fromEntries(
//       keys.map((k) => [k, agg[k].w ? Math.round(agg[k].sum / agg[k].w) : 0])
//     );
//   }, [progressData]);

//   /** -------------------- VDCR COLUMNS -------------------- **/
//   const vdcrColumns = useMemo(
//     () => [
//       { id: "sr", label: "Sr. No", width: 80, render: (_, i) => String(i + 1).padStart(3, "0") },
//       {
//         id: "equip_tags",
//         label: "Equipment Tag No.",
//         width: 220,
//         render: (r) => {
//           const tags = r.equipment_tags || r.tags || [];
//           return Array.isArray(tags) ? tags.map((t) => (
//             <span key={t} className="inline-block mr-1 mb-1 scope-badge bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
//               {t}
//             </span>
//           )) : <span className="text-gray-500">{tags || "—"}</span>;
//         },
//       },
//       {
//         id: "mfg_serials",
//         label: "Mfg Serial No.",
//         width: 220,
//         render: (r) => {
//           const serials = r.mfg_serials || r.serials || [];
//           return Array.isArray(serials) ? serials.map((t) => (
//             <span key={t} className="inline-block mr-1 mb-1 scope-badge bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs">
//               {t}
//             </span>
//           )) : <span className="text-gray-500">{serials || "—"}</span>;
//         },
//       },
//       {
//         id: "job_numbers",
//         label: "Job No.",
//         width: 180,
//         render: (r) => {
//           const jobs = r.job_numbers || r.job_number || [];
//           const jobArray = Array.isArray(jobs) ? jobs : jobs ? [jobs] : [];
//           return jobArray.map((t) => (
//             <span key={t} className="inline-block mr-1 mb-1 scope-badge bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs">
//               {t}
//             </span>
//           ));
//         },
//       },
//       {
//         id: "client_doc_no",
//         label: "Client Doc. No.",
//         width: 200,
//         render: (r) => <span className="scope-badge bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">{r.client_doc_no || r.client_document_number || "—"}</span>,
//       },
//       {
//         id: "internal_doc_no",
//         label: "Internal Doc. No.",
//         width: 200,
//         render: (r) => <span className="scope-badge bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">{r.internal_doc_no || r.internal_document_number || "—"}</span>,
//       },
//       { id: "doc_name", label: "Document Name", width: 260, render: (r) => r.document_name || r.name || "—" },
//       { id: "revision", label: "Revision", width: 120, render: (r) => r.revision || "Rev-00" },
//       { id: "code_status", label: "Code Status", width: 120, render: (r) => r.code_status || r.status_code || "Code 1" },
//       {
//         id: "status",
//         label: "Status",
//         width: 180,
//         render: (r) => {
//           const status = r.status || "—";
//           const base = "px-2 py-1 rounded-full text-xs font-medium";
//           const cls =
//             status === "Approved"
//               ? "bg-green-100 text-green-700"
//               : status === "Sent for Approval"
//               ? "bg-amber-100 text-amber-700"
//               : status === "Received for Comment"
//               ? "bg-rose-100 text-rose-700"
//               : "bg-gray-100 text-gray-700";
//           return <span className={`${base} ${cls}`}>{status}</span>;
//         },
//       },
//       { 
//         id: "updated_at", 
//         label: "Last Update", 
//         width: 140, 
//         render: (r) => {
//           const date = r.updated_at || r.last_updated || r.created_at;
//           return formatDate ? formatDate(date) : (date ? new Date(date).toLocaleDateString() : "—");
//         }
//       },
//       { id: "remarks", label: "Remarks", width: 220, render: (r) => r.remarks || r.comments || "" },
//       {
//         id: "actions",
//         label: "",
//         width: 120,
//         render: () => (
//           <button className="btn-small btn-outline px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
//             View
//           </button>
//         ),
//       },
//     ],
//     []
//   );

//   /** pinned columns state: { colId: 'left' | 'right' | null } */
//   const [pinned, setPinned] = useState(() =>
//     Object.fromEntries(vdcrColumns.map((c) => [c.id, null]))
//   );

//   const togglePin = (colId) =>
//     setPinned((prev) => {
//       const cur = prev[colId];
//       const next = cur === null ? "left" : cur === "left" ? "right" : null;
//       return { ...prev, [colId]: next };
//     });

//   /** -------------------- EARLY RETURNS -------------------- **/
//   if (loading) {
//     return (
//       <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
//         <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 flex items-center">
//           <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-b-blue-500" />
//           <p className="ml-4 text-base text-gray-700">Loading Project Details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error && !detailedProject) {
//     return (
//       <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
//         <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
//           <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Project</h2>
//           <p className="text-gray-700 mb-6">{error}</p>
//           {Object.keys(tableErrors).length > 0 && (
//             <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//               <p className="text-sm text-yellow-800 font-medium mb-2">Missing Database Tables:</p>
//               <ul className="text-xs text-yellow-700 space-y-1">
//                 {Object.entries(tableErrors).map(([table, err]) => (
//                   <li key={table}>• {table}: {err}</li>
//                 ))}
//               </ul>
//             </div>
//           )}
//           <button
//             className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700"
//             onClick={onClose}
//           >
//             ✕ Close
//           </button>
//         </div>
//       </div>
//     );
//   }

//   /** -------------------- UI helpers -------------------- **/
//   const phaseBarClass =
//     {
//       documentation: "bg-[#2E6FD0]",
//       procurement: "bg-[#2E7D32]",
//       manufacturing: "bg-[#EF8F2C]",
//       testing: "bg-[#C63939]",
//     }[activePhase] || "bg-blue-500";

//   const toggleEquipOpen = (id) => {
//     setOpenEquipIds((prev) => {
//       const next = new Set(prev);
//       next.has(id) ? next.delete(id) : next.add(id);
//       return next;
//     });
//   };

//   // Safe currency formatting
//   const safeCurrency = (value) => {
//     if (!value) return "—";
//     try {
//       return formatCurrency ? formatCurrency(value) : `₹${Number(value).toLocaleString()}`;
//     } catch {
//       return `₹${value}`;
//     }
//   };

//   // Safe date formatting
//   const safeDate = (date) => {
//     if (!date) return "—";
//     try {
//       return formatDate ? formatDate(date) : new Date(date).toLocaleDateString();
//     } catch {
//       return date;
//     }
//   };

//   /** -------------------- RENDER -------------------- **/
//   return (
//     <div
//       className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
//       role="dialog"
//       aria-modal="true"
//     >
//       <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl mx-auto">
//         {/* Header */}
//         <div
//           className="text-white p-4 sm:p-5 rounded-t-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
//           style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
//         >
//           <div>
//             <h2 className="text-lg sm:text-xl font-semibold">
//               {detailedProject?.project_title || detailedProject?.title || "Project Details"}
//             </h2>
//             <div className="text-xs sm:text-sm text-white/90">
//               PO: {detailedProject?.po_number || "—"} • Client: {detailedProject?.client_name || "—"}
//             </div>
//           </div>
//           <button
//             className="self-end sm:self-auto bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md text-sm"
//             onClick={onClose}
//             aria-label="Close project details"
//           >
//             ✕ Close
//           </button>
//         </div>

//         {/* Warning about missing tables */}
//         {Object.keys(tableErrors).length > 0 && (
//           <div className="mx-4 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//             <p className="text-sm text-yellow-800">
//               <strong>Note:</strong> Some database tables are missing. Limited functionality available.
//               <details className="mt-2">
//                 <summary className="cursor-pointer text-xs font-medium">View missing tables</summary>
//                 <ul className="text-xs mt-1 space-y-1">
//                   {Object.entries(tableErrors).map(([table, err]) => (
//                     <li key={table}>• {table}: {err}</li>
//                   ))}
//                 </ul>
//               </details>
//             </p>
//           </div>
//         )}

//         {/* Tabs (scrollable on mobile) */}
//         <div className="border-b border-gray-200 bg-white sticky top-0 z-30">
//           <div className="flex gap-2 overflow-x-auto no-scrollbar px-2 sm:px-4 py-2">
//             {[
//               { id: "overview", label: "Overview" },
//               { id: "equipment", label: "Equipment Overview" },
//               { id: "progress", label: "Progress Management" },
//               { id: "vdcr", label: "VDCR Management" },
//               { id: "deviations", label: "Deviations" },
//               { id: "photos", label: "Progress Photos" },
//               { id: "tpi", label: "TPI Logs" },
//               { id: "chronology", label: "Project Chronology" },
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 className={cx(
//                   "whitespace-nowrap rounded-full px-3 py-1.5 text-sm border",
//                   activeTab === tab.id
//                     ? "bg-blue-50 text-blue-700 border-blue-200"
//                     : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
//                 )}
//                 onClick={() => setActiveTab(tab.id)}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* CONTENT */}
//         <div className="p-4 sm:p-6">
//           {/* Overview */}
//           <section className={cx(activeTab === "overview" ? "block" : "hidden")}>
//             <div className="space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="bg-white border border-gray-200 rounded-lg p-4">
//                   <h3 className="text-base sm:text-lg font-semibold mb-4">Project Details</h3>
//                   <dl className="space-y-3 text-sm">
//                     <div className="flex justify-between">
//                       <dt className="text-gray-600">Project Manager</dt>
//                       <dd className="text-gray-900">{detailedProject?.project_manager || "N/A"}</dd>
//                     </div>
//                     <div className="flex justify-between">
//                       <dt className="text-gray-600">Plant Location</dt>
//                       <dd className="text-gray-900">{detailedProject?.plant_location || "N/A"}</dd>
//                     </div>
//                     <div className="flex justify-between">
//                       <dt className="text-gray-600">Industry</dt>
//                       <dd className="text-gray-900">{detailedProject?.client_industry || detailedProject?.industry || "N/A"}</dd>
//                     </div>
//                     <div className="flex justify-between">
//                       <dt className="text-gray-600">Consultant</dt>
//                       <dd className="text-gray-900">{detailedProject?.consultant || "N/A"}</dd>
//                     </div>
//                     <div className="flex justify-between">
//                       <dt className="text-gray-600">TPI Agency</dt>
//                       <dd className="text-gray-900">{detailedProject?.tpi_agency || "N/A"}</dd>
//                     </div>
//                     <div className="flex justify-between">
//                       <dt className="text-gray-600">Client Focal Point</dt>
//                       <dd className="text-gray-900">{detailedProject?.client_focal_point || "N/A"}</dd>
//                     </div>
//                   </dl>
//                 </div>

//                 <div className="bg-white border border-gray-200 rounded-lg p-4">
//                   <h3 className="text-base sm:text-lg font-semibold mb-4">Financial Information</h3>
//                   <dl className="space-y-3 text-sm">
//                     <div className="flex justify-between">
//                       <dt className="text-gray-600">Total Value</dt>
//                       <dd className="text-gray-900">{safeCurrency(detailedProject?.total_value)}</dd>
//                     </div>
//                     <div className="flex justify-between">
//                       <dt className="text-gray-600">Payment Terms</dt>
//                       <dd className="text-gray-900">{detailedProject?.payment_terms || "N/A"}</dd>
//                     </div>
//                     <div className="flex justify-between">
//                       <dt className="text-gray-600">Order Date</dt>
//                       <dd className="text-gray-900">{safeDate(detailedProject?.sales_order_date || detailedProject?.order_date)}</dd>
//                     </div>
//                     <div className="flex justify-between">
//                       <dt className="text-gray-600">Payment Milestones</dt>
//                       <dd className="text-gray-900">{detailedProject?.payment_milestones || "N/A"}</dd>
//                     </div>
//                   </dl>
//                 </div>
//               </div>

//               {/* Project Scope */}
//               {(() => {
//                 const scope = detailedProject?.scope;
//                 const scopeArray = Array.isArray(scope) ? scope : 
//                                  typeof scope === 'string' ? scope.split(',').map(s => s.trim()) : 
//                                  [];
                
//                 return scopeArray.length > 0 ? (
//                   <div>
//                     <h3 className="text-base sm:text-lg font-semibold mb-3">Project Scope</h3>
//                     <div className="flex flex-wrap gap-2">
//                       {scopeArray.map((item, index) => (
//                         <span
//                           key={index}
//                           className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
//                         >
//                           {item}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 ) : null;
//               })()}

//               {/* Notes */}
//               {detailedProject?.kickoff_notes && (
//                 <div>
//                   <h3 className="text-base sm:text-lg font-semibold mb-3">Kickoff Notes</h3>
//                   <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
//                     {detailedProject.kickoff_notes}
//                   </div>
//                 </div>
//               )}

//               {detailedProject?.production_notes && (
//                 <div>
//                   <h3 className="text-base sm:text-lg font-semibold mb-3">Production Notes</h3>
//                   <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
//                     {detailedProject.production_notes}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </section>

//           {/* Equipment */}
//           <section className={cx(activeTab === "equipment" ? "block" : "hidden")}>
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
//               <div className="text-lg font-semibold">Equipment Overview</div>
//               <button className="btn btn-primary px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
//                 + Add Equipment
//               </button>
//             </div>

//             {equipTypes.length > 0 && (
//               <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
//                 {equipTypes.map((type) => (
//                   <button
//                     key={type}
//                     className={cx(
//                       "whitespace-nowrap rounded-full px-3 py-1.5 text-sm border",
//                       activeEquipType === type
//                         ? "bg-blue-50 text-blue-700 border-blue-200"
//                         : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
//                     )}
//                     onClick={() => setActiveEquipType(type)}
//                   >
//                     {type}
//                     <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
//                       {(equipment || []).filter((e) => (e.equipment_type || e.type || 'Equipment') === type).length} Units
//                     </span>
//                   </button>
//                 ))}
//               </div>
//             )}

//             <div className="space-y-4">
//               {filteredEquip.length ? (
//                 filteredEquip.map((eq) => {
//                   const open = openEquipIds.has(eq.id);
//                   return (
//                     <div key={eq.id} className="bg-white border border-gray-200 rounded-lg">
//                       <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between p-4">
//                         <div>
//                           <h4 className="text-base sm:text-lg font-semibold text-gray-900">
//                             {eq.tag_number || eq.equipment_name || eq.name || "Equipment"}
//                           </h4>
//                           <div className="text-xs sm:text-sm text-gray-600">
//                             Tag: {eq.tag_number || "—"} • Serial: {eq.manufacturing_serial || eq.serial_number || "N/A"}
//                           </div>
//                         </div>
//                         <div className="flex gap-2">
//                           <button className="btn-small btn-outline px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
//                             Edit
//                           </button>
//                           <button className="btn-small btn-secondary px-3 py-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100">
//                             Delete
//                           </button>
//                         </div>
//                       </div>

//                       {/* Collapsible details */}
//                       <div className={cx(open ? "block" : "hidden", "px-4 pb-4")}>
//                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
//                           <div className="flex justify-between">
//                             <span className="text-gray-600">Job Number</span>
//                             <span className="text-gray-900">{eq.job_number || "N/A"}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-600">Value</span>
//                             <span className="text-gray-900">{safeCurrency(eq.value)}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-600">MOC</span>
//                             <span className="text-gray-900">{eq.moc || eq.material || "N/A"}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-600">Dimensions</span>
//                             <span className="text-gray-900">{eq.dimensions || "N/A"}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-600">Design Engineer</span>
//                             <span className="text-gray-900">{eq.design_engineer || "N/A"}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-600">Quality In-charge</span>
//                             <span className="text-gray-900">{eq.quality_incharge || eq.quality_engineer || "N/A"}</span>
//                           </div>
//                         </div>
//                       </div>

//                       <button
//                         className="w-full text-sm text-blue-700 hover:bg-blue-50 border-t border-gray-200 px-4 py-2 text-left"
//                         onClick={() => toggleEquipOpen(eq.id)}
//                         aria-expanded={open}
//                       >
//                         {open ? "Hide Details ▲" : "View More Details ▾"}
//                       </button>
//                     </div>
//                   );
//                 })
//               ) : (
//                 <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
//                   {tableErrors.equipment ? 
//                     "Equipment data unavailable (table not found)" : 
//                     "No equipment for this type."
//                   }
//                 </div>
//               )}
//             </div>
//           </section>

//           {/* Progress */}
//           <section className={cx(activeTab === "progress" ? "block" : "hidden")}>
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
//               <div className="text-lg font-semibold">Progress Management</div>
//               <div className="text-right mr-auto sm:mr-0 sm:ml-6">
//                 <div className="text-[11px] text-gray-500 leading-tight">Overall Progress</div>
//                 <div className="text-red-500 font-semibold text-sm">{overallProgress}%</div>
//               </div>
//               <button className="btn btn-primary px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
//                 + Add Progress
//               </button>
//             </div>

//             {tableErrors.progress && (
//               <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//                 <p className="text-sm text-yellow-800">
//                   Progress tracking data unavailable (table not found)
//                 </p>
//               </div>
//             )}

//             <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
//               {[
//                 { id: "documentation", label: "Documentation" },
//                 { id: "procurement", label: "Procurement" },
//                 { id: "manufacturing", label: "Manufacturing" },
//                 { id: "testing", label: "Testing & Dispatch" },
//               ].map((p) => (
//                 <button
//                   key={p.id}
//                   className={cx(
//                     "whitespace-nowrap rounded-full px-3 py-1.5 text-sm border",
//                     activePhase === p.id
//                       ? "bg-blue-50 text-blue-700 border-blue-200"
//                       : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
//                   )}
//                   onClick={() => setActivePhase(p.id)}
//                 >
//                   {p.label}
//                 </button>
//               ))}
//             </div>

//             {/* Phase summary bar */}
//             <div className="rounded-lg border border-gray-200 p-4 mb-6 bg-white">
//               <div className="flex justify-between text-sm font-medium mb-2">
//                 <span className="text-gray-800 capitalize">{activePhase} Phase Progress</span>
//                 <span className="text-gray-800">{phasePerc[activePhase] || 0}%</span>
//               </div>
//               <div className="w-full bg-[#E9EDF3] rounded-full h-[10px]">
//                 <div
//                   className={cx("h-[10px] rounded-full", phaseBarClass)}
//                   style={{ width: `${phasePerc[activePhase] || 0}%` }}
//                 />
//               </div>
//               <div className="mt-2 text-[12px] text-[#6B7A8C] flex justify-between">
//                 <span>Items: {progressData.length} tracked • Weight used: — / 100%</span>
//                 <span>
//                   Target: <b>—</b>
//                 </span>
//               </div>
//             </div>

//             {/* Common docs */}
//             <div className="rounded-lg border border-gray-200 p-4 mb-6 bg-white">
//               <div className="text-[12px] font-semibold text-gray-700 mb-2">COMMON DOCUMENTS</div>
//               <div className="border-2 border-dashed border-[#DFE3EA] rounded-md p-6 text-sm text-gray-500 text-center">
//                 No common documents added yet. Click "Add Progress" to get started.
//               </div>
//             </div>

//             {/* Equipment-specific placeholders */}
//             <div className="rounded-lg border border-gray-200 p-4 bg-white">
//               <div className="text-[12px] font-semibold text-gray-700 mb-4">
//                 EQUIPMENT-SPECIFIC {activePhase.toUpperCase()}
//               </div>

//               {equipTypes.map((type) => (
//                 <div key={type} className="mb-6 last:mb-0">
//                   <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
//                     {type} <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
//                       {equipment.filter(e => (e.equipment_type || e.type || 'Equipment') === type).length} Units
//                     </span>
//                   </div>
//                   <div className="border-2 border-dashed border-[#DFE3EA] rounded-md p-6 text-sm text-gray-500 text-center">
//                     No {type.toLowerCase()} {activePhase} items added yet.
//                   </div>
//                 </div>
//               ))}

//               {equipTypes.length === 0 && (
//                 <div className="border-2 border-dashed border-[#DFE3EA] rounded-md p-6 text-sm text-gray-500 text-center">
//                   No equipment-specific {activePhase} items available.
//                 </div>
//               )}
//             </div>
//           </section>

//           {/* VDCR */}
//           <section className={cx(activeTab === "vdcr" ? "block" : "hidden")}>
//             <div className="flex flex-wrap gap-2 mb-4">
//               <button className="btn btn-primary px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
//                 + Add New Row
//               </button>
//               <button className="btn btn-secondary px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700">
//                 Edit VDCR
//               </button>
//               <button className="btn btn-outline px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
//                 Export to Excel
//               </button>
//             </div>

//             {tableErrors.vdcr && (
//               <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//                 <p className="text-sm text-yellow-800">
//                   VDCR data unavailable (table not found)
//                 </p>
//               </div>
//             )}

//             {(() => {
//               // order columns: left-pinned, unpinned, right-pinned
//               const leftCols = vdcrColumns.filter((c) => pinned[c.id] === "left");
//               const midCols = vdcrColumns.filter((c) => !pinned[c.id]);
//               const rightCols = vdcrColumns.filter((c) => pinned[c.id] === "right");
//               const ordered = [...leftCols, ...midCols, ...rightCols];

//               // sticky offsets
//               const leftOffsets = {};
//               let acc = 0;
//               leftCols.forEach((c) => {
//                 leftOffsets[c.id] = acc;
//                 acc += c.width;
//               });

//               const rightOffsets = {};
//               acc = 0;
//               rightCols
//                 .slice()
//                 .reverse()
//                 .forEach((c) => {
//                   rightOffsets[c.id] = acc;
//                   acc += c.width;
//                 });

//               const stickyStyle = (c) => {
//                 if (pinned[c.id] === "left") {
//                   return { position: "sticky", left: leftOffsets[c.id], zIndex: 2, background: "#fff" };
//                 }
//                 if (pinned[c.id] === "right") {
//                   return { position: "sticky", right: rightOffsets[c.id], zIndex: 2, background: "#fff" };
//                 }
//                 return {};
//               };

//               return (
//                 <div className="rounded-lg border border-gray-200 overflow-auto bg-white">
//                   <table className="min-w-full text-sm">
//                     <thead className="bg-[#F7F9FC]">
//                       <tr className="text-[#5B6B7A]">
//                         {ordered.map((c) => (
//                           <th
//                             key={c.id}
//                             className={cx(
//                               "text-left font-medium px-3 py-2 border-b border-gray-200 whitespace-nowrap",
//                               pinned[c.id] && "bg-white"
//                             )}
//                             style={{ width: c.width, minWidth: c.width, ...stickyStyle(c) }}
//                           >
//                             <div className="flex items-center justify-between gap-2">
//                               <span className="truncate">{c.label}</span>
//                               <button
//                                 className={cx(
//                                   "text-xs",
//                                   pinned[c.id] === "left" && "text-blue-600",
//                                   pinned[c.id] === "right" && "text-purple-600"
//                                 )}
//                                 title={pinned[c.id] ? `Unpin (${pinned[c.id]})` : "Pin column"}
//                                 onClick={() => togglePin(c.id)}
//                               >
//                                 📌
//                               </button>
//                             </div>
//                           </th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {(vdcrRows || []).length ? (
//                         (vdcrRows || []).map((row, i) => (
//                           <tr key={row.id || i} className="align-top even:bg-gray-50">
//                             {ordered.map((c) => (
//                               <td
//                                 key={c.id}
//                                 className={cx(
//                                   "px-3 py-2 border-t border-gray-100 align-top",
//                                   pinned[c.id] && "bg-white"
//                                 )}
//                                 style={{ width: c.width, minWidth: c.width, ...stickyStyle(c) }}
//                               >
//                                 {c.render(row, i)}
//                               </td>
//                             ))}
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td
//                             colSpan={ordered.length}
//                             className="px-3 py-10 text-center text-gray-500 border-t"
//                           >
//                             {tableErrors.vdcr ? "VDCR data unavailable" : "No VDCR rows found."}
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               );
//             })()}
//           </section>

//           {/* Deviations */}
//           <section className={cx(activeTab === "deviations" ? "block" : "hidden")}>
//             <div className="text-lg font-semibold mb-4">
//               Deviations ({deviations?.length || 0})
//             </div>

//             {tableErrors.deviations && (
//               <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//                 <p className="text-sm text-yellow-800">
//                   Deviations data unavailable (table not found)
//                 </p>
//               </div>
//             )}

//             {(deviations || []).length ? (
//               <div className="space-y-4">
//                 {deviations.map((d) => (
//                   <div key={d.id} className="bg-white rounded-lg border border-gray-200 p-4">
//                     <div className="flex justify-between">
//                       <div className="font-medium text-gray-800">{d.title || d.description || "Deviation"}</div>
//                       <span
//                         className={cx(
//                           "px-2 py-1 rounded-full text-xs font-medium",
//                           d.status === "Approved" && "bg-green-100 text-green-700",
//                           d.status === "Sent for Approval" && "bg-amber-100 text-amber-700",
//                           d.status === "Received for Comment" && "bg-rose-100 text-rose-700",
//                           !d.status && "bg-gray-100 text-gray-700"
//                         )}
//                       >
//                         {d.status || "—"}
//                       </span>
//                     </div>
//                     <div className="text-sm text-gray-700 mt-1">{d.description || d.details || ""}</div>
//                     <div className="text-[12px] text-[#6B7A8C] mt-2">
//                       Raised by: {d.raised_by || d.created_by || "—"} • Priority: {d.priority || d.severity || "—"}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
//                 {tableErrors.deviations ? "Deviations data unavailable" : "No deviations recorded."}
//               </div>
//             )}
//           </section>

//           {/* Photos */}
//           <section className={cx(activeTab === "photos" ? "block" : "hidden")}>
//             <div className="text-lg font-semibold mb-4">
//               Progress Photos ({photos?.length || 0})
//             </div>

//             {tableErrors.photos && (
//               <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//                 <p className="text-sm text-yellow-800">
//                   Progress photos data unavailable (table not found)
//                 </p>
//               </div>
//             )}

//             {(photos || []).length ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {photos.map((p) => (
//                   <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-4">
//                     <img
//                       className="w-full h-40 object-cover rounded-md mb-3"
//                       src={
//                         p.url || p.image_url ||
//                         `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=200&fit=crop&crop=center`
//                       }
//                       alt={p.activity || p.title || "Progress"}
//                       onError={(e) => {
//                         e.target.src = `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=200&fit=crop&crop=center`;
//                       }}
//                     />
//                     <div className="font-medium text-gray-800">{p.activity || p.title || "Progress Photo"}</div>
//                     <div className="text-sm text-gray-700">{p.description || p.notes || ""}</div>
//                     <div className="text-[12px] text-[#6B7A8C] mt-1">
//                       Date: {safeDate(p.photo_date || p.taken_at || p.created_at)} • Location: {p.location || "—"}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
//                 {tableErrors.photos ? "Progress photos data unavailable" : "No progress photos available."}
//               </div>
//             )}
//           </section>

//           {/* TPI */}
//           <section className={cx(activeTab === "tpi" ? "block" : "hidden")}>
//             <div className="text-lg font-semibold mb-4">
//               TPI Logs ({tpiLogs?.length || 0})
//             </div>

//             {tableErrors.tpi && (
//               <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//                 <p className="text-sm text-yellow-800">
//                   TPI logs data unavailable (table not found)
//                 </p>
//               </div>
//             )}

//             {(tpiLogs || []).length ? (
//               <div className="space-y-4">
//                 {tpiLogs.map((t) => (
//                   <div key={t.id} className="bg-white rounded-lg border border-gray-200 p-4">
//                     <div className="flex justify-between">
//                       <div className="font-medium text-gray-800">
//                         {t.agency || t.inspector_agency || "TPI Agency"} - {safeDate(t.visit_date || t.inspection_date)}
//                       </div>
//                       <span
//                         className={cx(
//                           "px-2 py-1 rounded-full text-xs font-medium",
//                           t.result === "Pass" && "bg-green-100 text-green-700",
//                           t.result === "Fail" && "bg-rose-100 text-rose-700",
//                           t.result === "Conditional" && "bg-amber-100 text-amber-700",
//                           !t.result && "bg-gray-100 text-gray-700"
//                         )}
//                       >
//                         {t.result || t.status || "—"}
//                       </span>
//                     </div>
//                     <div className="text-sm text-gray-700 mt-1">{t.remarks || t.notes || t.comments || ""}</div>
//                     <div className="text-[12px] text-[#6B7A8C] mt-2">
//                       Inspector: {t.inspector || t.inspector_name || "—"} • Visit Type: {t.visit_type || t.inspection_type || "—"}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
//                 {tableErrors.tpi ? "TPI logs data unavailable" : "No TPI logs available."}
//               </div>
//             )}
//           </section>

//           {/* Chronology */}
//           <section className={cx(activeTab === "chronology" ? "block" : "hidden")}>
//             <div className="text-lg font-semibold mb-4">
//               Project Chronology ({chronology?.length || 0})
//             </div>

//             {tableErrors.chronology && (
//               <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//                 <p className="text-sm text-yellow-800">
//                   Chronology data unavailable (table not found)
//                 </p>
//               </div>
//             )}

//             {(chronology || []).length ? (
//               <div className="space-y-4">
//                 {chronology
//                   .slice()
//                   .sort((a, b) => {
//                     const dateA = new Date(a.entry_date || a.date || a.created_at || 0);
//                     const dateB = new Date(b.entry_date || b.date || b.created_at || 0);
//                     return dateB - dateA;
//                   })
//                   .map((c) => (
//                     <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-4">
//                       <div className="flex justify-between">
//                         <div className="font-medium text-gray-800">{c.title || c.event || c.description || "Chronology Entry"}</div>
//                         <div className="text-sm text-gray-600">
//                           {safeDate(c.entry_date || c.date || c.created_at)} {c.entry_time || c.time ? `• ${c.entry_time || c.time}` : ""}
//                         </div>
//                       </div>
//                       <div className="text-sm text-gray-700 mt-1">{c.description || c.details || c.notes || ""}</div>
//                     </div>
//                   ))}
//               </div>
//             ) : (
//               <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
//                 {tableErrors.chronology ? "Chronology data unavailable" : "No chronology entries available."}
//               </div>
//             )}
//           </section>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useEffect, useMemo, useState } from "react";

/* tiny class combiner */
const cx = (...a) => a.filter(Boolean).join(" ");

// Safe fetch function that handles 404 errors gracefully
const safeFetch = async (url) => {
  try {
    const response = await fetch(url);
    if (response.status === 404) {
      console.warn(`Table not found: ${url}`);
      return { data: [], error: null };
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    return { data: [], error: error.message };
  }
};

// Safe currency formatting
const safeCurrency = (value) => {
  if (!value) return "—";
  try {
    const numValue = Number(value);
    if (numValue >= 100000) {
      return `₹${(numValue / 100000).toFixed(1)}L`;
    }
    return `₹${numValue.toLocaleString()}`;
  } catch {
    return `₹${value}`;
  }
};

// Safe date formatting
const safeDate = (date) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString('en-IN');
  } catch {
    return date;
  }
};

export default function ProjectDetailModal({ project, onClose }) {
  /** -------------------- STATE -------------------- **/
  const [activeTab, setActiveTab] = useState("overview");
  const [activeEquipType, setActiveEquipType] = useState("");
  const [activePhase, setActivePhase] = useState("documentation");

  const [detailedProject, setDetailedProject] = useState(project || null);
  const [equipment, setEquipment] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [vdcrRows, setVdcrRows] = useState([]);
  const [deviations, setDeviations] = useState([]);
  const [tpiLogs, setTpiLogs] = useState([]);
  const [chronology, setChronology] = useState([]);
  const [photos, setPhotos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tableErrors, setTableErrors] = useState({});

  /** expand/collapse per-equipment details */
  const [openEquipIds, setOpenEquipIds] = useState(() => new Set());

  /** -------------------- FETCH -------------------- **/
  useEffect(() => {
    if (!project?.id) {
      setError("No project selected or project data is incomplete.");
      return;
    }

    // Set the project data immediately from props
    setDetailedProject(project);

    const pid = project.id;
    setLoading(true);
    setError(null);
    setTableErrors({});

    const fetchAdditionalData = async () => {
      try {
        // Create mock equipment data if not available
        const mockEquipment = project.equipment || [
          {
            id: 1,
            equipment_type: "Heat Exchangers",
            tag_number: "HE-001",
            equipment_name: "Shell & Tube Heat Exchanger",
            manufacturing_serial: "HE001-2024",
            job_number: "JOB-001",
            value: 150000,
            moc: "SS316L",
            dimensions: "2000 x 800 x 1200",
            design_engineer: "John Doe",
            quality_incharge: "Jane Smith"
          },
          {
            id: 2,
            equipment_type: "Heat Exchangers",
            tag_number: "HE-002",
            equipment_name: "Plate Heat Exchanger",
            manufacturing_serial: "HE002-2024",
            job_number: "JOB-002",
            value: 120000,
            moc: "SS304",
            dimensions: "1500 x 600 x 800",
            design_engineer: "John Doe",
            quality_incharge: "Jane Smith"
          },
          {
            id: 3,
            equipment_type: "Pressure Vessels",
            tag_number: "PV-001",
            equipment_name: "Storage Tank",
            manufacturing_serial: "PV001-2024",
            job_number: "JOB-003",
            value: 200000,
            moc: "CS+SS Cladding",
            dimensions: "3000 x 1500 x 1500",
            design_engineer: "Mike Johnson",
            quality_incharge: "Sarah Wilson"
          }
        ];

        // Create mock progress data
        const mockProgress = [
          { id: 1, phase: "documentation", progress_percentage: 85, equipment_type: "Heat Exchangers" },
          { id: 2, phase: "procurement", progress_percentage: 60, equipment_type: "Heat Exchangers" },
          { id: 3, phase: "manufacturing", progress_percentage: 30, equipment_type: "Heat Exchangers" },
          { id: 4, phase: "testing", progress_percentage: 0, equipment_type: "Heat Exchangers" },
          { id: 5, phase: "documentation", progress_percentage: 90, equipment_type: "Pressure Vessels" },
          { id: 6, phase: "procurement", progress_percentage: 70, equipment_type: "Pressure Vessels" },
          { id: 7, phase: "manufacturing", progress_percentage: 45, equipment_type: "Pressure Vessels" },
          { id: 8, phase: "testing", progress_percentage: 10, equipment_type: "Pressure Vessels" }
        ];

        // Try to fetch real data, but fall back to mock data
        const queries = [
          { key: 'equipment', url: `/api/equipment?project_id=${pid}`, fallback: () => mockEquipment },
          { key: 'progress', url: `/api/progress-tracking?project_id=${pid}`, fallback: () => mockProgress },
          { key: 'vdcr', url: `/api/vdcr?project_id=${pid}`, fallback: () => [] },
          { key: 'deviations', url: `/api/deviations?project_id=${pid}`, fallback: () => [] },
          { key: 'tpi', url: `/api/tpi-logs?project_id=${pid}`, fallback: () => [] },
          { key: 'chronology', url: `/api/chronology-entries?project_id=${pid}`, fallback: () => [] },
          { key: 'photos', url: `/api/progress-photos?project_id=${pid}`, fallback: () => [] },
        ];

        const results = await Promise.all(
          queries.map(async (query) => {
            const result = await safeFetch(query.url);
            return {
              key: query.key,
              data: result.data && result.data.length > 0 ? result.data : query.fallback(),
              error: result.error
            };
          })
        );

        const errors = {};
        results.forEach(result => {
          if (result.error) {
            errors[result.key] = result.error;
          }
        });

        setTableErrors(errors);

        // Set state with results
        const equipmentData = results.find(r => r.key === 'equipment')?.data || mockEquipment;
        
        setEquipment(equipmentData);
        setProgressData(results.find(r => r.key === 'progress')?.data || mockProgress);
        setVdcrRows(results.find(r => r.key === 'vdcr')?.data || []);
        setDeviations(results.find(r => r.key === 'deviations')?.data || []);
        setTpiLogs(results.find(r => r.key === 'tpi')?.data || []);
        setChronology(results.find(r => r.key === 'chronology')?.data || []);
        setPhotos(results.find(r => r.key === 'photos')?.data || []);

        // Set default equipment type
        if (equipmentData?.length && !activeEquipType) {
          const firstType = equipmentData[0].equipment_type || equipmentData[0].type || 'Equipment';
          setActiveEquipType(firstType);
        }

      } catch (err) {
        console.error('Fetch error:', err);
        setError("Failed to load some project details. Showing available data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdditionalData();
  }, [project?.id]);

  /** -------------------- DERIVED -------------------- **/
  const equipTypes = useMemo(
    () => {
      if (!equipment?.length) return [];
      const types = equipment.map(e => e.equipment_type || e.type || 'Equipment');
      return Array.from(new Set(types)).filter(Boolean);
    },
    [equipment]
  );

  const filteredEquip = useMemo(
    () => (equipment || []).filter((e) => 
      (e.equipment_type || e.type || 'Equipment') === activeEquipType
    ),
    [equipment, activeEquipType]
  );

  const overallProgress = useMemo(
    () => {
      if (!progressData?.length) return 0;
      const total = progressData.reduce((sum, item) => {
        const progress = item.progress_percentage || item.progress || 0;
        return sum + Number(progress);
      }, 0);
      return progressData.length > 0 ? Math.round(total / progressData.length) : 0;
    },
    [progressData]
  );

  const phasePerc = useMemo(() => {
    const keys = ["documentation", "procurement", "manufacturing", "testing"];
    const agg = Object.fromEntries(keys.map((k) => [k, { sum: 0, w: 0 }]));
    
    for (const it of progressData || []) {
      const phase = (it.phase || it.phase_name || "").toLowerCase();
      if (agg[phase]) {
        const weight = it.weight ?? 1;
        const progress = it.progress_percentage || it.progress || 0;
        agg[phase].sum += Number(progress) * weight;
        agg[phase].w += weight;
      }
    }
    
    return Object.fromEntries(
      keys.map((k) => [k, agg[k].w ? Math.round(agg[k].sum / agg[k].w) : 0])
    );
  }, [progressData]);

  /** -------------------- EARLY RETURNS -------------------- **/
  if (!project) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">No Project Selected</h2>
          <p className="text-gray-700 mb-6">Please select a project to view details.</p>
          <button
            className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700"
            onClick={onClose}
          >
            ✕ Close
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 flex items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-b-blue-500" />
          <p className="ml-4 text-base text-gray-700">Loading Additional Data...</p>
        </div>
      </div>
    );
  }

  /** -------------------- UI helpers -------------------- **/
  const phaseBarClass =
    {
      documentation: "bg-[#2E6FD0]",
      procurement: "bg-[#2E7D32]",
      manufacturing: "bg-[#EF8F2C]",
      testing: "bg-[#C63939]",
    }[activePhase] || "bg-blue-500";

  const toggleEquipOpen = (id) => {
    setOpenEquipIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /** -------------------- RENDER -------------------- **/
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl mx-auto">
        {/* Header */}
        <div
          className="text-white p-4 sm:p-5 rounded-t-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
        >
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">
              {detailedProject?.project_title || detailedProject?.title || "Project Details"}
            </h2>
            <div className="text-xs sm:text-sm text-white/90">
              PO: {detailedProject?.po_number || "—"} • Client: {detailedProject?.client_name || "—"}
            </div>
          </div>
          <button
            className="self-end sm:self-auto bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md text-sm"
            onClick={onClose}
            aria-label="Close project details"
          >
            ✕ Close
          </button>
        </div>

        {/* Warning about missing tables */}
        {Object.keys(tableErrors).length > 0 && (
          <div className="mx-4 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Some database tables are missing. Using mock data where needed.
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-medium">View missing tables</summary>
                <ul className="text-xs mt-1 space-y-1">
                  {Object.entries(tableErrors).map(([table, err]) => (
                    <li key={table}>• {table}: {err}</li>
                  ))}
                </ul>
              </details>
            </p>
          </div>
        )}

        {/* Tabs (scrollable on mobile) */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-30">
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-2 sm:px-4 py-2">
            {[
              { id: "overview", label: "Overview" },
              { id: "equipment", label: "Equipment Overview" },
              { id: "progress", label: "Progress Management" },
              { id: "vdcr", label: "VDCR Management" },
              { id: "deviations", label: "Deviations" },
              { id: "photos", label: "Progress Photos" },
              { id: "tpi", label: "TPI Logs" },
              { id: "chronology", label: "Project Chronology" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={cx(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-sm border",
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-6">
          {/* Overview */}
          <section className={cx(activeTab === "overview" ? "block" : "hidden")}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Project Details</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Project Manager</dt>
                      <dd className="text-gray-900">{detailedProject?.project_manager || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Plant Location</dt>
                      <dd className="text-gray-900">{detailedProject?.plant_location || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Industry</dt>
                      <dd className="text-gray-900">{detailedProject?.client_industry || detailedProject?.industry || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Consultant</dt>
                      <dd className="text-gray-900">{detailedProject?.consultant || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">TPI Agency</dt>
                      <dd className="text-gray-900">{detailedProject?.tpi_agency || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Client Focal Point</dt>
                      <dd className="text-gray-900">{detailedProject?.client_focal_point || "N/A"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Financial Information</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Total Value</dt>
                      <dd className="text-gray-900">{safeCurrency(detailedProject?.total_value)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Payment Terms</dt>
                      <dd className="text-gray-900">{detailedProject?.payment_terms || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Order Date</dt>
                      <dd className="text-gray-900">{safeDate(detailedProject?.sales_order_date || detailedProject?.order_date)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Payment Milestones</dt>
                      <dd className="text-gray-900">{detailedProject?.payment_milestones || "N/A"}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Project Scope */}
              {(() => {
                const scope = detailedProject?.scope;
                const scopeArray = Array.isArray(scope) ? scope : 
                                 typeof scope === 'string' ? scope.split(',').map(s => s.trim()) : 
                                 [];
                
                return scopeArray.length > 0 ? (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-3">Project Scope</h3>
                    <div className="flex flex-wrap gap-2">
                      {scopeArray.map((item, index) => (
                        <span
                          key={index}
                          className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Notes */}
              {detailedProject?.kickoff_notes && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Kickoff Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                    {detailedProject.kickoff_notes}
                  </div>
                </div>
              )}

              {detailedProject?.production_notes && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Production Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                    {detailedProject.production_notes}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Equipment */}
          <section className={cx(activeTab === "equipment" ? "block" : "hidden")}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div className="text-lg font-semibold">Equipment Overview</div>
              <button className="btn btn-primary px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                + Add Equipment
              </button>
            </div>

            {equipTypes.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                {equipTypes.map((type) => (
                  <button
                    key={type}
                    className={cx(
                      "whitespace-nowrap rounded-full px-3 py-1.5 text-sm border",
                      activeEquipType === type
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                    )}
                    onClick={() => setActiveEquipType(type)}
                  >
                    {type}
                    <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                      {(equipment || []).filter((e) => (e.equipment_type || e.type || 'Equipment') === type).length} Units
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {filteredEquip.length ? (
                filteredEquip.map((eq) => {
                  const open = openEquipIds.has(eq.id);
                  return (
                    <div key={eq.id} className="bg-white border border-gray-200 rounded-lg">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between p-4">
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                            {eq.tag_number || eq.equipment_name || eq.name || "Equipment"}
                          </h4>
                          <div className="text-xs sm:text-sm text-gray-600">
                            Tag: {eq.tag_number || "—"} • Serial: {eq.manufacturing_serial || eq.serial_number || "N/A"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-small btn-outline px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                            Edit
                          </button>
                          <button className="btn-small btn-secondary px-3 py-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100">
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Collapsible details */}
                      <div className={cx(open ? "block" : "hidden", "px-4 pb-4")}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Job Number</span>
                            <span className="text-gray-900">{eq.job_number || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Value</span>
                            <span className="text-gray-900">{safeCurrency(eq.value)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">MOC</span>
                            <span className="text-gray-900">{eq.moc || eq.material || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Dimensions</span>
                            <span className="text-gray-900">{eq.dimensions || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Design Engineer</span>
                            <span className="text-gray-900">{eq.design_engineer || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quality In-charge</span>
                            <span className="text-gray-900">{eq.quality_incharge || eq.quality_engineer || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        className="w-full text-sm text-blue-700 hover:bg-blue-50 border-t border-gray-200 px-4 py-2 text-left"
                        onClick={() => toggleEquipOpen(eq.id)}
                        aria-expanded={open}
                      >
                        {open ? "Hide Details ▲" : "View More Details ▾"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
                  {tableErrors.equipment ? 
                    "Equipment data unavailable (using mock data)" : 
                    "No equipment for this type."
                  }
                </div>
              )}
            </div>
          </section>

          {/* Progress */}
          <section className={cx(activeTab === "progress" ? "block" : "hidden")}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div className="text-lg font-semibold">Progress Management</div>
              <div className="text-right mr-auto sm:mr-0 sm:ml-6">
                <div className="text-[11px] text-gray-500 leading-tight">Overall Progress</div>
                <div className="text-red-500 font-semibold text-sm">{overallProgress}%</div>
              </div>
              <button className="btn btn-primary px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                + Add Progress
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
              {[
                { id: "documentation", label: "Documentation" },
                { id: "procurement", label: "Procurement" },
                { id: "manufacturing", label: "Manufacturing" },
                { id: "testing", label: "Testing & Dispatch" },
              ].map((p) => (
                <button
                  key={p.id}
                  className={cx(
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-sm border",
                    activePhase === p.id
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                  )}
                  onClick={() => setActivePhase(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Phase summary bar */}
            <div className="rounded-lg border border-gray-200 p-4 mb-6 bg-white">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-gray-800 capitalize">{activePhase} Phase Progress</span>
                <span className="text-gray-800">{phasePerc[activePhase] || 0}%</span>
              </div>
              <div className="w-full bg-[#E9EDF3] rounded-full h-[10px]">
                <div
                  className={cx("h-[10px] rounded-full", phaseBarClass)}
                  style={{ width: `${phasePerc[activePhase] || 0}%` }}
                />
              </div>
              <div className="mt-2 text-[12px] text-[#6B7A8C] flex justify-between">
                <span>Items: {progressData.length} tracked • Weight used: — / 100%</span>
                <span>
                  Target: <b>—</b>
                </span>
              </div>
            </div>

            {/* Equipment-specific progress */}
            <div className="rounded-lg border border-gray-200 p-4 bg-white">
              <div className="text-[12px] font-semibold text-gray-700 mb-4">
                EQUIPMENT-SPECIFIC {activePhase.toUpperCase()}
              </div>

              {equipTypes.map((type) => {
                const typeProgress = progressData.filter(p => 
                  p.equipment_type === type && (p.phase || "").toLowerCase() === activePhase
                );
                const avgProgress = typeProgress.length > 0 
                  ? Math.round(typeProgress.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / typeProgress.length)
                  : 0;

                return (
                  <div key={type} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      {type} 
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                        {equipment.filter(e => (e.equipment_type || e.type || 'Equipment') === type).length} Units
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                        {avgProgress}% Complete
                      </span>
                    </div>
                    
                    {typeProgress.length > 0 ? (
                      <div className="space-y-2">
                        {typeProgress.map((progress, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded border">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">
                                {progress.activity || `${activePhase} Activity ${idx + 1}`}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {progress.progress_percentage || 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className={cx("h-2 rounded-full", phaseBarClass)}
                                style={{ width: `${progress.progress_percentage || 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-[#DFE3EA] rounded-md p-6 text-sm text-gray-500 text-center">
                        No {type.toLowerCase()} {activePhase} items added yet.
                      </div>
                    )}
                  </div>
                );
              })}

              {equipTypes.length === 0 && (
                <div className="border-2 border-dashed border-[#DFE3EA] rounded-md p-6 text-sm text-gray-500 text-center">
                  No equipment-specific {activePhase} items available.
                </div>
              )}
            </div>
          </section>

          {/* VDCR */}
          <section className={cx(activeTab === "vdcr" ? "block" : "hidden")}>
            <div className="flex flex-wrap gap-2 mb-4">
              <button className="btn btn-primary px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                + Add New Row
              </button>
              <button className="btn btn-secondary px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700">
                Edit VDCR
              </button>
              <button className="btn btn-outline px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                Export to Excel
              </button>
            </div>

            {tableErrors.vdcr && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  VDCR data unavailable (table not found)
                </p>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 overflow-auto bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F7F9FC]">
                  <tr className="text-[#5B6B7A]">
                    <th className="text-left font-medium px-3 py-2 border-b border-gray-200">Sr. No</th>
                    <th className="text-left font-medium px-3 py-2 border-b border-gray-200">Equipment Tag</th>
                    <th className="text-left font-medium px-3 py-2 border-b border-gray-200">Document Name</th>
                    <th className="text-left font-medium px-3 py-2 border-b border-gray-200">Revision</th>
                    <th className="text-left font-medium px-3 py-2 border-b border-gray-200">Status</th>
                    <th className="text-left font-medium px-3 py-2 border-b border-gray-200">Last Update</th>
                    <th className="text-left font-medium px-3 py-2 border-b border-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(vdcrRows || []).length ? (
                    (vdcrRows || []).map((row, i) => (
                      <tr key={row.id || i} className="align-top even:bg-gray-50">
                        <td className="px-3 py-2 border-t border-gray-100">{String(i + 1).padStart(3, "0")}</td>
                        <td className="px-3 py-2 border-t border-gray-100">{row.equipment_tag || "—"}</td>
                        <td className="px-3 py-2 border-t border-gray-100">{row.document_name || "—"}</td>
                        <td className="px-3 py-2 border-t border-gray-100">{row.revision || "Rev-00"}</td>
                        <td className="px-3 py-2 border-t border-gray-100">
                          <span className={cx(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            row.status === "Approved" && "bg-green-100 text-green-700",
                            row.status === "Sent for Approval" && "bg-amber-100 text-amber-700",
                            row.status === "Received for Comment" && "bg-rose-100 text-rose-700",
                            !row.status && "bg-gray-100 text-gray-700"
                          )}>
                            {row.status || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-t border-gray-100">{safeDate(row.updated_at)}</td>
                        <td className="px-3 py-2 border-t border-gray-100">
                          <button className="btn-small btn-outline px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-gray-500 border-t">
                        {tableErrors.vdcr ? "VDCR data unavailable" : "No VDCR rows found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Deviations */}
          <section className={cx(activeTab === "deviations" ? "block" : "hidden")}>
            <div className="text-lg font-semibold mb-4">
              Deviations ({deviations?.length || 0})
            </div>

            {tableErrors.deviations && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Deviations data unavailable (table not found)
                </p>
              </div>
            )}

            {(deviations || []).length ? (
              <div className="space-y-4">
                {deviations.map((d) => (
                  <div key={d.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between">
                      <div className="font-medium text-gray-800">{d.title || d.description || "Deviation"}</div>
                      <span
                        className={cx(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          d.status === "Approved" && "bg-green-100 text-green-700",
                          d.status === "Sent for Approval" && "bg-amber-100 text-amber-700",
                          d.status === "Received for Comment" && "bg-rose-100 text-rose-700",
                          !d.status && "bg-gray-100 text-gray-700"
                        )}
                      >
                        {d.status || "—"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{d.description || d.details || ""}</div>
                    <div className="text-[12px] text-[#6B7A8C] mt-2">
                      Raised by: {d.raised_by || d.created_by || "—"} • Priority: {d.priority || d.severity || "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
                {tableErrors.deviations ? "Deviations data unavailable" : "No deviations recorded."}
              </div>
            )}
          </section>

          {/* Photos */}
          <section className={cx(activeTab === "photos" ? "block" : "hidden")}>
            <div className="text-lg font-semibold mb-4">
              Progress Photos ({photos?.length || 0})
            </div>

            {tableErrors.photos && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Progress photos data unavailable (table not found)
                </p>
              </div>
            )}

            {(photos || []).length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((p) => (
                  <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <img
                      className="w-full h-40 object-cover rounded-md mb-3"
                      src={
                        p.url || p.image_url ||
                        `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=200&fit=crop&crop=center`
                      }
                      alt={p.activity || p.title || "Progress"}
                      onError={(e) => {
                        e.target.src = `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=200&fit=crop&crop=center`;
                      }}
                    />
                    <div className="font-medium text-gray-800">{p.activity || p.title || "Progress Photo"}</div>
                    <div className="text-sm text-gray-700">{p.description || p.notes || ""}</div>
                    <div className="text-[12px] text-[#6B7A8C] mt-1">
                      Date: {safeDate(p.photo_date || p.taken_at || p.created_at)} • Location: {p.location || "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
                {tableErrors.photos ? "Progress photos data unavailable" : "No progress photos available."}
              </div>
            )}
          </section>

          {/* TPI */}
          <section className={cx(activeTab === "tpi" ? "block" : "hidden")}>
            <div className="text-lg font-semibold mb-4">
              TPI Logs ({tpiLogs?.length || 0})
            </div>

            {tableErrors.tpi && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  TPI logs data unavailable (table not found)
                </p>
              </div>
            )}

            {(tpiLogs || []).length ? (
              <div className="space-y-4">
                {tpiLogs.map((t) => (
                  <div key={t.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between">
                      <div className="font-medium text-gray-800">
                        {t.agency || t.inspector_agency || "TPI Agency"} - {safeDate(t.visit_date || t.inspection_date)}
                      </div>
                      <span
                        className={cx(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          t.result === "Pass" && "bg-green-100 text-green-700",
                          t.result === "Fail" && "bg-rose-100 text-rose-700",
                          t.result === "Conditional" && "bg-amber-100 text-amber-700",
                          !t.result && "bg-gray-100 text-gray-700"
                        )}
                      >
                        {t.result || t.status || "—"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{t.remarks || t.notes || t.comments || ""}</div>
                    <div className="text-[12px] text-[#6B7A8C] mt-2">
                      Inspector: {t.inspector || t.inspector_name || "—"} • Visit Type: {t.visit_type || t.inspection_type || "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
                {tableErrors.tpi ? "TPI logs data unavailable" : "No TPI logs available."}
              </div>
            )}
          </section>

          {/* Chronology */}
          <section className={cx(activeTab === "chronology" ? "block" : "hidden")}>
            <div className="text-lg font-semibold mb-4">
              Project Chronology ({chronology?.length || 0})
            </div>

            {tableErrors.chronology && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Chronology data unavailable (table not found)
                </p>
              </div>
            )}

            {(chronology || []).length ? (
              <div className="space-y-4">
                {chronology
                  .slice()
                  .sort((a, b) => {
                    const dateA = new Date(a.entry_date || a.date || a.created_at || 0);
                    const dateB = new Date(b.entry_date || b.date || b.created_at || 0);
                    return dateB - dateA;
                  })
                  .map((c) => (
                    <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex justify-between">
                        <div className="font-medium text-gray-800">{c.title || c.event || c.description || "Chronology Entry"}</div>
                        <div className="text-sm text-gray-600">
                          {safeDate(c.entry_date || c.date || c.created_at)} {c.entry_time || c.time ? `• ${c.entry_time || c.time}` : ""}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">{c.description || c.details || c.notes || ""}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
                {tableErrors.chronology ? "Chronology data unavailable" : "No chronology entries available."}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}