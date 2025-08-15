
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatDate,
  formatCurrency,
  calculateOverallProjectProgress,
} from "@/lib/data-helpers";

/* tiny class combiner */
const cx = (...a) => a.filter(Boolean).join(" ");

export default function ProjectDetailModal({ project, onClose }) {
  /** -------------------- STATE -------------------- **/
  const [activeTab, setActiveTab] = useState("equipment");
  const [activeEquipType, setActiveEquipType] = useState("");
  const [activePhase, setActivePhase] = useState("documentation");

  const [detailedProject, setDetailedProject] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [vdcrRows, setVdcrRows] = useState([]);
  const [deviations, setDeviations] = useState([]);
  const [tpiLogs, setTpiLogs] = useState([]);
  const [chronology, setChronology] = useState([]);
  const [photos, setPhotos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** expand/collapse per-equipment details */
  const [openEquipIds, setOpenEquipIds] = useState(() => new Set());

  /** -------------------- FETCH -------------------- **/
  useEffect(() => {
    if (!project?.id) {
      setLoading(false);
      setError("No project selected or project data is incomplete.");
      return;
    }

    const pid = project.id;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      fetch(`/api/projects/${pid}`).then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch(`/api/equipment?project_id=${pid}`).then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch(`/api/progress-tracking?project_id=${pid}`).then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch(`/api/vdcr?project_id=${pid}`).then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch(`/api/deviations?project_id=${pid}`).then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch(`/api/tpi-logs?project_id=${pid}`).then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch(`/api/chronology-entries?project_id=${pid}`).then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch(`/api/progress-photos?project_id=${pid}`).then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
    ])
      .then((all) => {
        const get = (i, d = []) => (all[i].status === "fulfilled" ? all[i].value : d);

        const proj = get(0, null);
        setDetailedProject(proj);

        const eq = get(1, []);
        setEquipment(eq);
        if (eq?.length && !activeEquipType) setActiveEquipType(eq[0].equipment_type);

        setProgressData(get(2, []));
        setVdcrRows(get(3, []));
        setDeviations(get(4, []));
        setTpiLogs(get(5, []));
        setChronology(get(6, []));
        setPhotos(get(7, []));
      })
      .catch(() => setError("Failed to load project detail."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  /** -------------------- DERIVED -------------------- **/
  const equipTypes = useMemo(
    () => Array.from(new Set((equipment || []).map((e) => e.equipment_type))).filter(Boolean),
    [equipment]
  );

  const filteredEquip = useMemo(
    () => (equipment || []).filter((e) => e.equipment_type === activeEquipType),
    [equipment, activeEquipType]
  );

  const overallProgress = useMemo(
    () => calculateOverallProjectProgress(progressData || []),
    [progressData]
  );

  const phasePerc = useMemo(() => {
    const keys = ["documentation", "procurement", "manufacturing", "testing"];
    const agg = Object.fromEntries(keys.map((k) => [k, { sum: 0, w: 0 }]));
    for (const it of progressData || []) {
      const k = (it.phase || "").toLowerCase();
      if (agg[k]) {
        const w = it.weight ?? 1;
        agg[k].sum += (it.progress_percentage || 0) * w;
        agg[k].w += w;
      }
    }
    return Object.fromEntries(
      keys.map((k) => [k, agg[k].w ? Math.round(agg[k].sum / agg[k].w) : 0])
    );
  }, [progressData]);

  /** -------------------- VDCR COLUMNS -------------------- **/
  const vdcrColumns = useMemo(
    () => [
      { id: "sr", label: "Sr. No", width: 80, render: (_, i) => String(i + 1).padStart(3, "0") },
      {
        id: "equip_tags",
        label: "Equipment Tag No.",
        width: 220,
        render: (r) =>
          (r.equipment_tags || []).map((t) => (
            <span key={t} className="inline-block mr-1 mb-1 scope-badge bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
              {t}
            </span>
          )),
      },
      {
        id: "mfg_serials",
        label: "Mfg Serial No.",
        width: 220,
        render: (r) =>
          (r.mfg_serials || []).map((t) => (
            <span key={t} className="inline-block mr-1 mb-1 scope-badge bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs">
              {t}
            </span>
          )),
      },
      {
        id: "job_numbers",
        label: "Job No.",
        width: 180,
        render: (r) =>
          (r.job_numbers || []).map((t) => (
            <span key={t} className="inline-block mr-1 mb-1 scope-badge bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs">
              {t}
            </span>
          )),
      },
      {
        id: "client_doc_no",
        label: "Client Doc. No.",
        width: 200,
        render: (r) => <span className="scope-badge bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">{r.client_doc_no || "—"}</span>,
      },
      {
        id: "internal_doc_no",
        label: "Internal Doc. No.",
        width: 200,
        render: (r) => <span className="scope-badge bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">{r.internal_doc_no || "—"}</span>,
      },
      { id: "doc_name", label: "Document Name", width: 260, render: (r) => r.document_name },
      { id: "revision", label: "Revision", width: 120, render: (r) => r.revision || "Rev-00" },
      { id: "code_status", label: "Code Status", width: 120, render: (r) => r.code_status || "Code 1" },
      {
        id: "status",
        label: "Status",
        width: 180,
        render: (r) => {
          const base = "px-2 py-1 rounded-full text-xs font-medium";
          const cls =
            r.status === "Approved"
              ? "bg-green-100 text-green-700"
              : r.status === "Sent for Approval"
              ? "bg-amber-100 text-amber-700"
              : r.status === "Received for Comment"
              ? "bg-rose-100 text-rose-700"
              : "bg-gray-100 text-gray-700";
          return <span className={`${base} ${cls}`}>{r.status || "—"}</span>;
        },
      },
      { id: "updated_at", label: "Last Update", width: 140, render: (r) => formatDate(r.updated_at) },
      { id: "remarks", label: "Remarks", width: 220, render: (r) => r.remarks || "" },
      {
        id: "actions",
        label: "",
        width: 120,
        render: () => (
          <button className="btn-small btn-outline px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
            View
          </button>
        ),
      },
    ],
    []
  );

  /** pinned columns state: { colId: 'left' | 'right' | null } */
  const [pinned, setPinned] = useState(() =>
    Object.fromEntries(vdcrColumns.map((c) => [c.id, null]))
  );

  const togglePin = (colId) =>
    setPinned((prev) => {
      const cur = prev[colId];
      const next = cur === null ? "left" : cur === "left" ? "right" : null;
      return { ...prev, [colId]: next };
    });

  /** -------------------- EARLY RETURNS -------------------- **/
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 flex items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-b-blue-500" />
          <p className="ml-4 text-base text-gray-700">Loading Project Details...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Project</h2>
          <p className="text-gray-700 mb-6">{error}</p>
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
  if (!detailedProject) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Project Not Found</h2>
          <p className="text-gray-700 mb-6">
            The selected project could not be loaded. It might have been deleted or does not exist.
          </p>
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
              {detailedProject?.project_title}
            </h2>
            <div className="text-xs sm:text-sm text-white/90">
              PO: {detailedProject?.po_number} • Client: {detailedProject?.client_name}
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
                      <dd className="text-gray-900">{detailedProject?.client_industry || "N/A"}</dd>
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
                      <dd className="text-gray-900">{formatCurrency(detailedProject?.total_value)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Payment Terms</dt>
                      <dd className="text-gray-900">{detailedProject?.payment_terms || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Order Date</dt>
                      <dd className="text-gray-900">{formatDate(detailedProject?.sales_order_date)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Payment Milestones</dt>
                      <dd className="text-gray-900">{detailedProject?.payment_milestones || "N/A"}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {detailedProject?.scope?.length ? (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Project Scope</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailedProject.scope.map((item, index) => (
                      <span
                        key={index}
                        className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {detailedProject?.kickoff_notes ? (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Kickoff Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                    {detailedProject.kickoff_notes}
                  </div>
                </div>
              ) : null}

              {detailedProject?.production_notes ? (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Production Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                    {detailedProject.production_notes}
                  </div>
                </div>
              ) : null}
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
                      {(equipment || []).filter((e) => e.equipment_type === type).length} Units
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
                            {eq.tag_number || eq.equipment_name}
                          </h4>
                          <div className="text-xs sm:text-sm text-gray-600">
                            Tag: {eq.tag_number || "—"} • Serial: {eq.manufacturing_serial || "N/A"}
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
                            <span className="text-gray-900">{formatCurrency(eq.value)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">MOC</span>
                            <span className="text-gray-900">{eq.moc || "N/A"}</span>
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
                            <span className="text-gray-900">{eq.quality_incharge || "N/A"}</span>
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
                  No equipment for this type.
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
                <span>Items: tracked • Weight used: — / 100%</span>
                <span>
                  Target: <b>—</b>
                </span>
              </div>
            </div>

            {/* Common docs */}
            <div className="rounded-lg border border-gray-200 p-4 mb-6 bg-white">
              <div className="text-[12px] font-semibold text-gray-700 mb-2">COMMON DOCUMENTS</div>
              <div className="border-2 border-dashed border-[#DFE3EA] rounded-md p-6 text-sm text-gray-500 text-center">
                No common documents added yet. Click "Add Progress" to get started.
              </div>
            </div>

            {/* Equipment-specific placeholders */}
            <div className="rounded-lg border border-gray-200 p-4 bg-white">
              <div className="text-[12px] font-semibold text-gray-700 mb-4">
                EQUIPMENT-SPECIFIC {activePhase.toUpperCase()}
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Heat Exchangers <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">8 Units</span>
                </div>
                <div className="border-2 border-dashed border-[#DFE3EA] rounded-md p-6 text-sm text-gray-500 text-center">
                  No heat exchanger {activePhase} items added yet.
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Pressure Vessels <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">4 Units</span>
                </div>
                <div className="border-2 border-dashed border-[#DFE3EA] rounded-md p-6 text-sm text-gray-500 text-center">
                  No pressure vessel {activePhase} items added yet.
                </div>
              </div>
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

            {(() => {
              // order columns: left-pinned, unpinned, right-pinned
              const leftCols = vdcrColumns.filter((c) => pinned[c.id] === "left");
              const midCols = vdcrColumns.filter((c) => !pinned[c.id]);
              const rightCols = vdcrColumns.filter((c) => pinned[c.id] === "right");
              const ordered = [...leftCols, ...midCols, ...rightCols];

              // sticky offsets
              const leftOffsets = {};
              let acc = 0;
              leftCols.forEach((c) => {
                leftOffsets[c.id] = acc;
                acc += c.width;
              });

              const rightOffsets = {};
              acc = 0;
              rightCols
                .slice()
                .reverse()
                .forEach((c) => {
                  rightOffsets[c.id] = acc;
                  acc += c.width;
                });

              const stickyStyle = (c) => {
                if (pinned[c.id] === "left") {
                  return { position: "sticky", left: leftOffsets[c.id], zIndex: 2, background: "#fff" };
                }
                if (pinned[c.id] === "right") {
                  return { position: "sticky", right: rightOffsets[c.id], zIndex: 2, background: "#fff" };
                }
                return {};
              };

              return (
                <div className="rounded-lg border border-gray-200 overflow-auto bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#F7F9FC]">
                      <tr className="text-[#5B6B7A]">
                        {ordered.map((c) => (
                          <th
                            key={c.id}
                            className={cx(
                              "text-left font-medium px-3 py-2 border-b border-gray-200 whitespace-nowrap",
                              pinned[c.id] && "bg-white"
                            )}
                            style={{ width: c.width, minWidth: c.width, ...stickyStyle(c) }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{c.label}</span>
                              <button
                                className={cx(
                                  "text-xs",
                                  pinned[c.id] === "left" && "text-blue-600",
                                  pinned[c.id] === "right" && "text-purple-600"
                                )}
                                title={pinned[c.id] ? `Unpin (${pinned[c.id]})` : "Pin column"}
                                onClick={() => togglePin(c.id)}
                              >
                                📌
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(vdcrRows || []).length ? (
                        (vdcrRows || []).map((row, i) => (
                          <tr key={row.id || i} className="align-top even:bg-gray-50">
                            {ordered.map((c) => (
                              <td
                                key={c.id}
                                className={cx(
                                  "px-3 py-2 border-t border-gray-100 align-top",
                                  pinned[c.id] && "bg-white"
                                )}
                                style={{ width: c.width, minWidth: c.width, ...stickyStyle(c) }}
                              >
                                {c.id === "sr" ? c.render(row, i) : c.render(row, i)}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={ordered.length}
                            className="px-3 py-10 text-center text-gray-500 border-t"
                          >
                            No VDCR rows found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </section>

          {/* Deviations */}
          <section className={cx(activeTab === "deviations" ? "block" : "hidden")}>
            <div className="text-lg font-semibold mb-4">
              Deviations ({deviations?.length || 0})
            </div>
            {(deviations || []).length ? (
              <div className="space-y-4">
                {deviations.map((d) => (
                  <div key={d.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between">
                      <div className="font-medium text-gray-800">{d.title}</div>
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
                    <div className="text-sm text-gray-700 mt-1">{d.description}</div>
                    <div className="text-[12px] text-[#6B7A8C] mt-2">
                      Raised by: {d.raised_by || "—"} • Priority: {d.priority || "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
                No deviations recorded.
              </div>
            )}
          </section>

          {/* Photos */}
          <section className={cx(activeTab === "photos" ? "block" : "hidden")}>
            <div className="text-lg font-semibold mb-4">
              Progress Photos ({photos?.length || 0})
            </div>
            {(photos || []).length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((p) => (
                  <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <img
                      className="w-full h-40 object-cover rounded-md mb-3"
                      src={
                        p.url ||
                        `/abstract-geometric-shapes.png?height=200&width=300&query=${encodeURIComponent(
                          p.activity || ""
                        )}`
                      }
                      alt={p.activity || "Progress"}
                    />
                    <div className="font-medium text-gray-800">{p.activity}</div>
                    <div className="text-sm text-gray-700">{p.description}</div>
                    <div className="text-[12px] text-[#6B7A8C] mt-1">
                      Date: {formatDate(p.photo_date)} • Location: {p.location || "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
                No progress photos available.
              </div>
            )}
          </section>

          {/* TPI */}
          <section className={cx(activeTab === "tpi" ? "block" : "hidden")}>
            <div className="text-lg font-semibold mb-4">
              TPI Logs ({tpiLogs?.length || 0})
            </div>
            {(tpiLogs || []).length ? (
              <div className="space-y-4">
                {tpiLogs.map((t) => (
                  <div key={t.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between">
                      <div className="font-medium text-gray-800">
                        {t.agency} - {formatDate(t.visit_date)}
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
                        {t.result || "—"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{t.remarks}</div>
                    <div className="text-[12px] text-[#6B7A8C] mt-2">
                      Inspector: {t.inspector || "—"} • Visit Type: {t.visit_type || "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
                No TPI logs available.
              </div>
            )}
          </section>

          {/* Chronology */}
          <section className={cx(activeTab === "chronology" ? "block" : "hidden")}>
            <div className="text-lg font-semibold mb-4">
              Project Chronology ({chronology?.length || 0})
            </div>
            {(chronology || []).length ? (
              <div className="space-y-4">
                {chronology
                  .slice()
                  .sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date))
                  .map((c) => (
                    <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex justify-between">
                        <div className="font-medium text-gray-800">{c.title}</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(c.entry_date)} {c.entry_time ? `• ${c.entry_time}` : ""}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">{c.description}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-10 border border-dashed border-gray-300 rounded-lg">
                No chronology entries available.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
