"use client";

import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/** ---------- helpers ---------- */
const fmtMD = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  return dt.toLocaleDateString();
};
const pct = (n) => Math.max(0, Math.min(100, Math.round(Number(n || 0))));
const overallFromWeighted = (items = []) => {
  let num = 0, den = 0;
  for (const it of items) {
    const w = Number(it?.weight ?? 1);
    const p = Number(it?.progress_percentage ?? 0);
    num += w * p; den += w;
  }
  return den > 0 ? Math.round(num / den) : 0;
};
const phaseClass = (p) =>
  p >= 100 ? "bg-green-100 text-green-700" : p > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700";
const phaseText = (p) => (p >= 100 ? "Completed" : p > 0 ? "In Progress" : "Scheduled");

/** ---------- small local UI ---------- */
function Collapse({ title, right, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 bg-white"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <span className="flex items-center gap-3 text-sm text-gray-600">
          {right}
          <svg
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.127l3.71-3.896a.75.75 0 111.08 1.04l-4.24 4.46a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>
      {open && <div className="bg-white rounded-b-lg border border-t-0 border-gray-200 p-4">{children}</div>}
    </div>
  );
}

export default function ClientViewModal({ project, onClose }) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // core entities
  const [proj, setProj] = useState(null);
  const [progress, setProgress] = useState([]);
  const [chronology, setChronology] = useState([]);

  // optional/extended
  const [documents, setDocuments] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [qualityChecks, setQualityChecks] = useState([]);
  const [risks, setRisks] = useState([]);
  const [stakeholders, setStakeholders] = useState([]);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!project?.id) {
        setError("No project selected or project data is incomplete for client view.");
        setLoading(false);
        return;
      }
      setLoading(true); setError(null);

      try {
        const pQ = supabase
          .from("projects")
          .select(`*, equipment:project_equipment(*)`)
          .eq("id", project.id)
          .single();

        const progQ = supabase.from("progress_tracking").select("*").eq("project_id", project.id);
        const chronoQ = supabase
          .from("chronology_entries")
          .select("*")
          .eq("project_id", project.id)
          .order("entry_date", { ascending: false });
        const docQ = supabase
          .from("project_documents")
          .select("*")
          .eq("project_id", project.id)
          .order("uploaded_at", { ascending: false });
        const shipQ = supabase
          .from("shipments")
          .select("*")
          .eq("project_id", project.id)
          .order("planned_date", { ascending: true });
        const qaQ = supabase
          .from("quality_checks")
          .select("*")
          .eq("project_id", project.id)
          .order("check_date", { ascending: false });
        const riskQ = supabase
          .from("project_risks")
          .select("*")
          .eq("project_id", project.id)
          .order("severity", { ascending: false });
        const stakeQ = supabase
          .from("project_stakeholders")
          .select("*")
          .eq("project_id", project.id)
          .order("role", { ascending: true });
        const mileQ = supabase
          .from("project_milestones")
          .select("*")
          .eq("project_id", project.id)
          .order("target_date", { ascending: true });

        const [
          { data: p, error: pErr },
          { data: g, error: gErr },
          { data: c, error: cErr },
          { data: d, error: dErr },
          { data: s, error: sErr },
          { data: qa, error: qaErr },
          { data: rk, error: rkErr },
          { data: st, error: stErr },
          { data: ms, error: msErr },
        ] = await Promise.all([pQ, progQ, chronoQ, docQ, shipQ, qaQ, riskQ, stakeQ, mileQ]);

        if (pErr) throw pErr;
        if (gErr) throw gErr;
        if (cErr) throw cErr;
        if (dErr) throw dErr;
        if (sErr) throw sErr;
        if (qaErr) throw qaErr;
        if (rkErr) throw rkErr;
        if (stErr) throw stErr;
        if (msErr) throw msErr;

        if (!cancelled) {
          setProj(p || project);
          setProgress(g || []);
          setChronology(c || []);
          setDocuments(d || []);
          setShipments(s || []);
          setQualityChecks(qa || []);
          setRisks(rk || []);
          setStakeholders(st || []);
          setMilestones(ms || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load client view.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [project?.id, supabase]);

  /** ---------- states ---------- */
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
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Client View</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>
    );
  }
 

  /** ---------- computed ---------- */
  const equipmentArr = Array.isArray(proj?.equipment) ? proj.equipment : [];
  const equipmentCount = equipmentArr.length || (proj?.equipment_count || 0);
  const overall = overallFromWeighted(progress);

  const byPhase = progress.reduce((acc, item) => {
    const key = item?.phase || "Unknown";
    if (!acc[key]) acc[key] = { sum: 0, w: 0 };
    const w = Number(item?.weight ?? 1);
    const p = Number(item?.progress_percentage ?? 0);
    acc[key].sum += w * p; acc[key].w += w;
    return acc;
  }, {});
  const phases = Object.entries(byPhase).map(([name, v]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    progress: v.w > 0 ? Math.round(v.sum / v.w) : 0,
  }));

  /** ---------- UI ---------- */
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-auto flex flex-col">
        {/* header */}
        <div
          className="sticky top-0 z-10 text-white p-4 sm:p-5 rounded-t-xl"
          style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">{proj?.project_title}</h2>
              <div className="text-xs sm:text-sm text-white/90">
                Client View • PO: {proj?.po_number} {proj?.client_name ? `• ${proj.client_name}` : ""}
              </div>
            </div>
            <button
              className="self-end sm:self-auto bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md text-sm"
              onClick={onClose}
              aria-label="Close client view"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-2xl font-semibold text-gray-900">{equipmentCount}</div>
              <div className="text-sm text-gray-600">Total Equipment</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-2xl font-semibold text-gray-900">{fmtMD(proj?.expected_delivery_date)}</div>
              <div className="text-sm text-gray-600">Expected Delivery</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-2xl font-semibold text-gray-900">{overall}%</div>
              <div className="text-sm text-gray-600">Overall Progress</div>
              <div className="mt-2 h-1.5 rounded-full bg-gray-200">
                <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${pct(overall)}%` }} />
              </div>
            </div>
          </div>

          {/* phases */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Project Phases</h3>
            {phases.length ? (
              <div className="space-y-3">
                {phases.map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="w-40 shrink-0 text-sm text-gray-700">{p.name}</div>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${pct(p.progress)}%` }} />
                      </div>
                    </div>
                    <span className={`ml-3 text-xs px-2 py-1 rounded-full ${phaseClass(p.progress)}`}>
                      {phaseText(p.progress)} • {pct(p.progress)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No phase progress data available.</div>
            )}
          </div>

          {/* timeline */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Recent Updates</h3>
            {chronology.length ? (
              <ul className="space-y-3">
                {chronology.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <div className="w-28 shrink-0 text-xs sm:text-sm text-gray-600">{fmtDate(item.entry_date)}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-700">{item.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4 text-gray-500">No recent updates available.</div>
            )}
          </div>

          {/* optional sections */}
          {equipmentArr.length > 0 && (
            <Collapse title="Equipment Breakdown" right={<span className="text-xs text-gray-500">{equipmentArr.length} items</span>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {equipmentArr.map((eq) => (
                  <div key={eq.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-900">
                        {eq.equipment_type || eq.type || "Equipment"}
                      </div>
                      {pct(eq.unit_progress) > 0 && (
                        <span className="text-xs text-gray-600">{pct(eq.unit_progress)}%</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="mr-3">
                        Tag: <b>{eq.tag_number || "—"}</b>
                      </span>
                      <span>
                        Serial: <b>{eq.manufacturing_serial || "—"}</b>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Collapse>
          )}

          {documents.length > 0 && (
            <Collapse title="Documents" right={<span className="text-xs text-gray-500">{documents.length}</span>}>
              <ul className="space-y-2 text-sm">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">{d.title || d.file_name}</div>
                      <div className="text-gray-500 text-xs">
                        Uploaded: {fmtDate(d.uploaded_at)} • Type: {d.doc_type || "—"}
                      </div>
                    </div>
                    {d.url && (
                      <a
                        className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </Collapse>
          )}

          {shipments.length > 0 && (
            <Collapse title="Shipments">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-2">Item</th>
                      <th className="py-2 pr-2">Planned</th>
                      <th className="py-2 pr-2">Actual</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="py-2 pr-2">{s.title || s.item_code || "—"}</td>
                        <td className="py-2 pr-2">{fmtDate(s.planned_date)}</td>
                        <td className="py-2 pr-2">{fmtDate(s.actual_date)}</td>
                        <td className="py-2">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                            {s.status || (s.actual_date ? "Dispatched" : "Scheduled")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Collapse>
          )}

          {qualityChecks.length > 0 && (
            <Collapse title="Quality & Inspections">
              <div className="space-y-2">
                {qualityChecks.map((q) => (
                  <div key={q.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="font-medium text-gray-900">{q.title || q.check_type}</div>
                    <div className="text-xs text-gray-500">
                      {fmtDate(q.check_date)} • Result: <b>{q.result || "—"}</b>
                      {q.tpi_agency ? ` • TPI: ${q.tpi_agency}` : ""}
                    </div>
                    {q.remarks && <div className="text-sm text-gray-700 mt-1">{q.remarks}</div>}
                  </div>
                ))}
              </div>
            </Collapse>
          )}

          {milestones.length > 0 && (
            <Collapse title="Milestones">
              <ul className="space-y-2">
                {milestones.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div>
                      <div className="font-medium text-gray-900">{m.title}</div>
                      <div className="text-xs text-gray-500">
                        Target: {fmtDate(m.target_date)} {m.actual_date ? `• Actual: ${fmtDate(m.actual_date)}` : ""}
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${phaseClass(pct(m.progress))}`}>
                      {phaseText(pct(m.progress))}
                    </div>
                  </li>
                ))}
              </ul>
            </Collapse>
          )}

          {risks.length > 0 && (
            <Collapse title="Risks / Issues" right={<span className="text-xs text-gray-500">{risks.length}</span>}>
              <ul className="space-y-2">
                {risks.map((r) => (
                  <li key={r.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900">{r.title}</div>
                      <span className="text-xs text-red-600">Severity: {r.severity}</span>
                    </div>
                    {r.mitigation && <div className="text-sm text-gray-700 mt-1">Mitigation: {r.mitigation}</div>}
                    {r.owner && <div className="text-xs text-gray-500 mt-1">Owner: {r.owner}</div>}
                  </li>
                ))}
              </ul>
            </Collapse>
          )}

          {stakeholders.length > 0 && (
            <Collapse title="Key Contacts">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stakeholders.map((p) => (
                  <div key={p.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.role}</div>
                    <div className="text-sm text-gray-700 mt-1">
                      {p.email || "—"} {p.phone ? `• ${p.phone}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </Collapse>
          )}

          {/* info strip */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Project Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Project Manager:</strong> {proj?.project_manager || "N/A"}</div>
              <div><strong>Plant Location:</strong> {proj?.plant_location || "N/A"}</div>
              <div><strong>Order Date:</strong> {fmtDate(proj?.sales_order_date)}</div>
              <div><strong>Client:</strong> {proj?.client_name || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-xl px-4 sm:px-6 py-3 flex justify-end">
          <button
            className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
