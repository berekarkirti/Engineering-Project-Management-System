"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/SessionProvider";

/* ========= Small reusable Combo with "+ Add New" + existing list ========= */
function AddableCombo({
  label,
  required = false,
  placeholder = "Select or enter",
  value,
  onChange,
  items = [],
  addNewText = "+ Add New",
  existingHeader = "Existing",
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  const [filter, setFilter] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered =
    filter?.trim()
      ? items.filter((x) =>
          (x || "").toString().toLowerCase().includes(filter.trim().toLowerCase())
        )
      : items;

  const choose = (v) => {
    onChange(v);
    setOpen(false);
    setAdding(false);
    setNewVal("");
  };

  const saveNew = () => {
    const v = (newVal || "").trim();
    if (!v) return;
    choose(v);
  };

  return (
    <div ref={rootRef} className="w-full">
      <label className="block text-sm font-medium text-gray-600 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="w-full text-left px-3 py-2 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={value || ""}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={value ? "text-gray-800" : "text-gray-400"}>
              {value || placeholder}
            </span>
            <span className="shrink-0 text-gray-500">▾</span>
          </div>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="p-2">
              {/* Add New row */}
              {!adding ? (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="w-full text-left px-2 py-2 rounded hover:bg-gray-50 font-medium text-blue-700"
                >
                  {addNewText}
                </button>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <input
                    autoFocus
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type new value…"
                    value={newVal}
                    onChange={(e) => setNewVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveNew();
                      if (e.key === "Escape") {
                        setAdding(false);
                        setNewVal("");
                      }
                    }}
                  />
                  <button
                    onClick={saveNew}
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setAdding(false);
                      setNewVal("");
                    }}
                    className="px-3 py-1 rounded border hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Optional filter */}
              <div className="mt-2">
                <input
                  className="w-full px-2 py-1 border border-gray-200 rounded"
                  placeholder="Search…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>

              {/* Existing list */}
              <div className="mt-2 text-xs font-semibold text-gray-500 px-1">
                {existingHeader}
              </div>
              <div className="max-h-48 overflow-auto">
                {filtered.length ? (
                  filtered.map((it) => (
                    <button
                      key={it}
                      type="button"
                      onClick={() => choose(it)}
                      className={`w-full text-left px-2 py-2 hover:bg-gray-50 ${
                        value === it ? "bg-blue-50 text-blue-700" : "text-gray-800"
                      }`}
                      title={it}
                    >
                      {it}
                    </button>
                  ))
                ) : (
                  <div className="px-2 py-4 text-sm text-gray-400">No items</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== MAIN MODAL ===================== */
export const AddProjectModal = ({ isOpen, onClose, onProjectAdded }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  const { supabase } = useSession();

  const [formData, setFormData] = useState({
    projectTitle: "",
    poNumber: "",
    clientName: "",
    salesOrderDate: "",
    plantLocation: "",
    clientIndustry: "",
    projectManager: "",
    consultant: "",
    tpiAgency: "",
    clientFocalPoint: "",
    totalValue: "",
    paymentTerms: "",
    paymentMilestones: "",
    kickoffNotes: "",
    productionNotes: "",
    scope: [],
  });

  const [knownClients, setKnownClients] = useState([]);
  const [knownIndustries, setKnownIndustries] = useState([]);
  const [equipmentData, setEquipmentData] = useState({
    "Heat Exchanger": {
      selected: false,
      quantity: 0,
      details: { tagNumber: "", jobNumber: "", manufacturingSerial: "", documents: [] },
    },
    "Pressure Vessel": {
      selected: false,
      quantity: 0,
      details: { tagNumber: "", jobNumber: "", manufacturingSerial: "", documents: [] },
    },
    Reactor: {
      selected: false,
      quantity: 0,
      details: { tagNumber: "", jobNumber: "", manufacturingSerial: "", documents: [] },
    },
    "Storage Tank": {
      selected: false,
      quantity: 0,
      details: { tagNumber: "", jobNumber: "", manufacturingSerial: "", documents: [] },
    },
    "Distillation Column": {
      selected: false,
      quantity: 0,
      details: { tagNumber: "", jobNumber: "", manufacturingSerial: "", documents: [] },
    },
  });
  const [customEquipment, setCustomEquipment] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [missingFields, setMissingFields] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({
    unpricedPO: null,
    clientReference: null,
    designInputs: null,
    otherDocuments: [],
  });

  /* XLSX loader */
  useEffect(() => {
    if (isOpen && !xlsxLoaded) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.onload = () => setXlsxLoaded(true);
      script.onerror = () =>
        setUploadStatus("❌ Excel processing unavailable. Please fill the form manually.");
      document.head.appendChild(script);
      return () => {
        if (document.head.contains(script)) document.head.removeChild(script);
      };
    }
  }, [isOpen, xlsxLoaded]);

  /* suggestions from previous projects */
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("projects")
          .select("client_name, client_industry")
          .order("created_at", { ascending: false })
          .limit(200);
        if (data) {
          setKnownClients(
            [...new Set(data.map((d) => d?.client_name).filter(Boolean))].slice(0, 100)
          );
          setKnownIndustries(
            [...new Set(data.map((d) => d?.client_industry).filter(Boolean))].slice(0, 100)
          );
        }
      } catch {
        /* optional */
      }
    })();
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  /* ---------- Excel helpers ---------- */
  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!xlsxLoaded || !window.XLSX) {
      setUploadStatus("❌ Excel library not loaded yet. Please try again.");
      return;
    }
    setUploadStatus("Processing...");
    try {
      const buf = await file.arrayBuffer();
      const wb = window.XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
      const data = {};
      const headers = rows[0] || [];
      const dataRow = rows[1] || [];
      headers.forEach((h, i) => {
        if (h && dataRow[i] !== undefined) data[h.toString().toLowerCase().trim()] = dataRow[i];
      });

      const newForm = { ...formData };
      const newEquip = { ...equipmentData };
      const fieldMap = {
        "project title": "projectTitle",
        title: "projectTitle",
        "po number": "poNumber",
        po: "poNumber",
        "client name": "clientName",
        client: "clientName",
        "sales order date": "salesOrderDate",
        "order date": "salesOrderDate",
        date: "salesOrderDate",
        "plant location": "plantLocation",
        location: "plantLocation",
        "client industry": "clientIndustry",
        industry: "clientIndustry",
        "project manager": "projectManager",
        manager: "projectManager",
        consultant: "consultant",
        "tpi agency": "tpiAgency",
        tpi: "tpiAgency",
        "client focal point": "clientFocalPoint",
        "focal point": "clientFocalPoint",
        "total value": "totalValue",
        value: "totalValue",
        amount: "totalValue",
        "payment terms": "paymentTerms",
        terms: "paymentTerms",
        "payment milestones": "paymentMilestones",
        milestones: "paymentMilestones",
        "kickoff notes": "kickoffNotes",
        kickoff: "kickoffNotes",
        "production notes": "productionNotes",
        production: "productionNotes",
      };
      Object.entries(fieldMap).forEach(([k, v]) => {
        if (data[k]) newForm[v] = data[k].toString();
      });

      ["scope", "services", "work scope"].forEach((f) => {
        if (data[f]) {
          const items = data[f].toString().split(",").map((s) => s.trim());
          newForm.scope = items.filter((i) =>
            ["Design", "Manufacturing", "Testing", "Documentation", "Installation", "Commissioning"].includes(i)
          );
        }
      });

      const eqFields = {
        "heat exchanger": "Heat Exchanger",
        "pressure vessel": "Pressure Vessel",
        reactor: "Reactor",
        "storage tank": "Storage Tank",
        "distillation column": "Distillation Column",
      };
      Object.entries(eqFields).forEach(([k, type]) => {
        if (data[k] && !isNaN(data[k])) {
          const q = parseInt(data[k]);
          if (q > 0) newEquip[type] = { ...newEquip[type], selected: true, quantity: q };
        }
      });

      ["projectTitle", "poNumber", "clientName", "salesOrderDate"].forEach((f) => {
        if (!newForm[f]) missingFields.push(f);
      });

      setFormData(newForm);
      setEquipmentData(newEquip);
      setUploadStatus("✅ Excel data loaded successfully!");
      setTimeout(() => setUploadStatus(""), 3000);
    } catch {
      setUploadStatus("❌ Error reading Excel file. Please check the format.");
      setTimeout(() => setUploadStatus(""), 5000);
    }
  };

  /* ---------- small handlers ---------- */
  const setField = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  const handleScopeChange = (scope, checked) =>
    setFormData((p) => ({
      ...p,
      scope: checked ? [...p.scope, scope] : p.scope.filter((s) => s !== scope),
    }));

  const handleFileUpload = (fileType, e) => {
    const files = e.target.files;
    if (!files) return;
    setUploadedFiles((p) => ({
      ...p,
      [fileType]: fileType === "otherDocuments" ? Array.from(files) : files[0],
    }));
  };

  const handleEquipmentChange = (type, field, value) => {
    setEquipmentData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]:
          field === "selected" ? value : field === "quantity" ? Math.max(0, parseInt(value) || 0) : value,
      },
    }));
  };
  const handleEquipmentDetailChange = (type, field, value) => {
    setEquipmentData((prev) => ({
      ...prev,
      [type]: { ...prev[type], details: { ...prev[type].details, [field]: value } },
    }));
  };
  const handleEquipmentDocsChange = (type, files) => {
    const list = Array.from(files || []);
    setEquipmentData((prev) => ({
      ...prev,
      [type]: { ...prev[type], details: { ...prev[type].details, documents: list } },
    }));
  };
  const addCustomEquipment = () =>
    setCustomEquipment((prev) => [
      ...prev,
      {
        name: "",
        quantity: 0,
        selected: false,
        details: { tagNumber: "", jobNumber: "", manufacturingSerial: "", documents: [] },
      },
    ]);
  const handleCustomEquipmentChange = (index, field, value) => {
    setCustomEquipment((prev) => {
      const arr = [...prev];
      if (field === "selected") {
        arr[index].selected = value;
        if (!value) arr[index].quantity = 0;
      } else if (field === "quantity") {
        arr[index].quantity = Math.max(0, parseInt(value) || 0);
      } else {
        arr[index][field] = value;
      }
      return arr;
    });
  };
  const handleCustomEquipmentDetailChange = (index, field, value) => {
    setCustomEquipment((prev) => {
      const arr = [...prev];
      arr[index].details[field] = value;
      return arr;
    });
  };
  const handleCustomEquipmentDocsChange = (index, files) => {
    const list = Array.from(files || []);
    setCustomEquipment((prev) => {
      const arr = [...prev];
      arr[index].details.documents = list;
      return arr;
    });
  };

  const getTotalEquipment = () => {
    const std = Object.values(equipmentData).reduce(
      (sum, i) => sum + (i.selected ? i.quantity : 0),
      0
    );
    const cust = customEquipment.reduce((s, i) => s + (i.selected ? i.quantity : 0), 0);
    return std + cust;
  };

  const nextStep = () => currentStep < 3 && setCurrentStep((s) => s + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep((s) => s - 1);

  /* ---------- Create project (unchanged) ---------- */
  const handleCreateProject = async () => {
    try {
      const projRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_title: formData.projectTitle,
          po_number: formData.poNumber,
          client_name: formData.clientName,
          sales_order_date: formData.salesOrderDate,
          plant_location: formData.plantLocation,
          client_industry: formData.clientIndustry,
          project_manager: formData.projectManager,
          consultant: formData.consultant,
          tpi_agency: formData.tpiAgency,
          client_focal_point: formData.clientFocalPoint,
          total_value: formData.totalValue ? Number(formData.totalValue) : 0,
          payment_terms: formData.paymentTerms,
          payment_milestones: formData.paymentMilestones,
          org_id: window?.localStorage?.getItem("current_org_id") || null,
          kickoff_notes: formData.kickoffNotes,
          production_notes: formData.productionNotes,
          scope: formData.scope,
        }),
      });
      if (!projRes.ok) throw new Error("Project create failed");
      const project = await projRes.json();

      const stdEntries = Object.entries(equipmentData)
        .filter(([_, d]) => d.selected && d.quantity > 0)
        .map(([type, d]) => ({ type, ...d }));
      const customEntries = customEquipment
        .filter((it) => it.selected && it.quantity > 0)
        .map((it) => ({ type: it.name, ...it }));
      const allEquip = [...stdEntries, ...customEntries];

      for (const item of allEquip) {
        const eqRes = await fetch("/api/equipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: project.id,
            equipment_type: item.type,
            quantity: item.quantity,
            tag_number: item.details?.tagNumber || null,
            job_number: item.details?.jobNumber || null,
            manufacturing_serial: item.details?.manufacturingSerial || null,
          }),
        });
        if (!eqRes.ok) throw new Error("Equipment create failed");
        const eq = await eqRes.json();

        const files = item.details?.documents || [];
        for (const file of files) {
          const path = `${project.id}/${eq.id}/${Date.now()}-${file.name}`;
          const up = await supabase.storage.from("equipment-docs").upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });
          if (up.error) continue;
          const { data: pub } = supabase.storage.from("equipment-docs").getPublicUrl(path);
          await fetch("/api/equipment-documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project_id: project.id,
              equipment_id: eq.id,
              file_name: file.name,
              url: pub.publicUrl,
              doc_type: "equipment-attachment",
            }),
          });
        }
      }

      const toUpload = [
        ["unpricedPO", "unpriced-po"],
        ["clientReference", "client-reference"],
        ["designInputs", "design-inputs"],
      ];
      for (const [key, docType] of toUpload) {
        const file = uploadedFiles[key];
        if (!file) continue;
        const path = `${project.id}/${Date.now()}-${file.name}`;
        const up = await supabase.storage.from("project-docs").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (up.error) continue;
        const { data: pub } = supabase.storage.from("project-docs").getPublicUrl(path);
        await fetch("/api/project-documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: project.id,
            file_name: file.name,
            url: pub.publicUrl,
            doc_type: docType,
          }),
        });
      }

      if (uploadedFiles.otherDocuments?.length) {
        for (const file of uploadedFiles.otherDocuments) {
          const path = `${project.id}/${Date.now()}-${file.name}`;
          const up = await supabase.storage.from("project-docs").upload(path, file);
          if (up.error) continue;
          const { data: pub } = supabase.storage.from("project-docs").getPublicUrl(path);
          await fetch("/api/project-documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project_id: project.id,
              file_name: file.name,
              url: pub.publicUrl,
              doc_type: "other",
            }),
          });
        }
      }

      onProjectAdded?.();
      onClose();
    } catch (e) {
      alert(e.message || "Failed to create project");
    }
  };

  /* ================ STEPS UI ================ */
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Excel */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-medium text-gray-700">Import from Excel File</h3>
          <span className="text-xs text-gray-500">Optional</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50"
            disabled={!xlsxLoaded}
          />
          {!xlsxLoaded && <span className="text-sm text-orange-600">Loading Excel library...</span>}
          {uploadStatus && (
            <span
              className={`text-sm ${
                uploadStatus.includes("✅")
                  ? "text-green-600"
                  : uploadStatus.includes("⚠️")
                  ? "text-orange-600"
                  : uploadStatus.includes("❌")
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {uploadStatus}
            </span>
          )}
        </div>
      </div>

      {/* Project Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Project Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Project Title *{" "}
              {missingFields.includes("projectTitle") && <span className="text-red-500">(Required)</span>}
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                missingFields.includes("projectTitle") ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              value={formData.projectTitle}
              onChange={(e) => setField("projectTitle", e.target.value)}
              placeholder="Enter project title"
            />
          </div>

          {/* PO */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              PO Number * {missingFields.includes("poNumber") && <span className="text-red-500">(Required)</span>}
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                missingFields.includes("poNumber") ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              value={formData.poNumber}
              onChange={(e) => setField("poNumber", e.target.value)}
              placeholder="Enter PO number"
            />
          </div>

          {/* Client Name — LIKE YOUR "BRAND" UI */}
          <AddableCombo
            label="Client Name"
            required
            placeholder="Select or enter client"
            value={formData.clientName}
            onChange={(v) => setField("clientName", v)}
            items={knownClients}
            addNewText="+ Add New Client"
            existingHeader="Existing Clients"
          />

          {/* Sales Order Date */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Sales Order Date *{" "}
              {missingFields.includes("salesOrderDate") && <span className="text-red-500">(Required)</span>}
            </label>
            <input
              type="date"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                missingFields.includes("salesOrderDate") ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              value={formData.salesOrderDate}
              onChange={(e) => setField("salesOrderDate", e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Plant Location</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Jamnagar, Gujarat"
              value={formData.plantLocation}
              onChange={(e) => setField("plantLocation", e.target.value)}
            />
          </div>

          {/* Client Industry — LIKE YOUR "BRAND" UI */}
          <AddableCombo
            label="Client Industry"
            placeholder="Select or enter industry"
            value={formData.clientIndustry}
            onChange={(v) => setField("clientIndustry", v)}
            items={knownIndustries}
            addNewText="+ Add New Industry"
            existingHeader="Existing Industries"
          />
        </div>
      </div>

      {/* Project Team */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Project Team</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["projectManager", "Project Manager"],
            ["consultant", "Consultant"],
            ["tpiAgency", "TPI Agency"],
            ["clientFocalPoint", "Client Focal Point"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData[key]}
                onChange={(e) => setField(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Financial */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Financial Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Total Value (₹)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.totalValue}
              onChange={(e) => setField("totalValue", e.target.value)}
              placeholder="Enter total project value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Payment Terms</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.paymentTerms}
              onChange={(e) => setField("paymentTerms", e.target.value)}
              placeholder="e.g., 30% Advance, 40% On Dispatch, 30% On Commissioning"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-2">Payment Milestones</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={formData.paymentMilestones}
              onChange={(e) => setField("paymentMilestones", e.target.value)}
              placeholder="Describe payment milestones"
            />
          </div>
        </div>
      </div>

      {/* Scope */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Project Scope</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {["Design", "Manufacturing", "Testing", "Documentation", "Installation", "Commissioning"].map(
            (scope) => (
              <div key={scope} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={scope}
                  className="w-4 h-4 text-blue-600"
                  checked={formData.scope.includes(scope)}
                  onChange={(e) => handleScopeChange(scope, e.target.checked)}
                />
                <label htmlFor={scope} className="text-sm text-gray-700">
                  {scope}
                </label>
              </div>
            )
          )}
        </div>
      </div>

      {/* Uploads */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Document Uploads</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Unpriced PO File</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xlsx,.xls"
              onChange={(e) => handleFileUpload("unpricedPO", e)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">Upload PO file (PDF, DOC, DOCX, XLS, XLSX)</p>
            {uploadedFiles.unpricedPO && <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.unpricedPO.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Client's Reference Document</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xlsx,.xls"
              onChange={(e) => handleFileUpload("clientReference", e)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">Upload client reference document</p>
            {uploadedFiles.clientReference && <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.clientReference.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Design Inputs/PID</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.dwg"
              onChange={(e) => handleFileUpload("designInputs", e)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">Upload design inputs or PID files</p>
            {uploadedFiles.designInputs && <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.designInputs.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Other Documents</label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xlsx,.xls,.dwg,.jpg,.png"
              onChange={(e) => handleFileUpload("otherDocuments", e)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">Upload additional documents (multiple files)</p>
            {uploadedFiles.otherDocuments.length > 0 && (
              <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.otherDocuments.length} file(s) selected</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Additional Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Kick-off Meeting Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={formData.kickoffNotes}
              onChange={(e) => setField("kickoffNotes", e.target.value)}
              placeholder="Enter kick-off meeting notes and important discussion points"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Production Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={formData.productionNotes}
              onChange={(e) => setField("productionNotes", e.target.value)}
              placeholder="Enter production-specific notes and requirements"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Equipment Information</h3>
        <h4 className="text-md font-medium text-gray-600 mb-6">Select Equipment Types & Quantities</h4>

        <div className="space-y-3">
          {Object.entries(equipmentData).map(([type, data]) => (
            <div key={type}>
              <div
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-2 rounded-lg transition-all ${
                  data.selected ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600"
                    checked={data.selected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      handleEquipmentChange(type, "selected", checked);
                      if (checked && data.quantity === 0) handleEquipmentChange(type, "quantity", 1);
                    }}
                  />
                  <label className="text-sm font-medium text-gray-700">{type}</label>
                </div>
                <input
                  type="number"
                  className="w-24 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.quantity}
                  onChange={(e) => handleEquipmentChange(type, "quantity", e.target.value)}
                  disabled={!data.selected}
                  min="0"
                />
              </div>

              {data.selected && data.quantity > 0 && (
                <div className="mt-3 sm:ml-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-2 border-b border-gray-300">
                    <h5 className="text-lg font-semibold text-gray-800">{type} - Unit 1</h5>
                    <span className="self-start sm:self-auto bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Equipment 1
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      ["tagNumber", "Tag Number *"],
                      ["jobNumber", "Job Number *"],
                      ["manufacturingSerial", "Manufacturing Serial *"],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={data.details[key]}
                          onChange={(e) => handleEquipmentDetailChange(type, key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Attach Documents</label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xlsx,.xls,.dwg,.jpg,.jpeg,.png"
                      onChange={(e) => handleEquipmentDocsChange(type, e.target.files)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {data.details.documents?.length > 0 && (
                      <ul className="mt-2 text-xs text-gray-700 list-disc pl-5 space-y-1">
                        {data.details.documents.map((f, i) => (
                          <li key={i}>{f.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {customEquipment.map((item, index) => (
            <div key={index}>
              <div
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-2 rounded-lg transition-all ${
                  item.selected ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600"
                    checked={item.selected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      handleCustomEquipmentChange(index, "selected", checked);
                      if (checked && item.quantity === 0) handleCustomEquipmentChange(index, "quantity", 1);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Enter equipment type name..."
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={item.name}
                    onChange={(e) => handleCustomEquipmentChange(index, "name", e.target.value)}
                  />
                </div>
                <input
                  type="number"
                  className="w-24 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={item.quantity}
                  onChange={(e) => handleCustomEquipmentChange(index, "quantity", e.target.value)}
                  disabled={!item.selected}
                  min="0"
                />
              </div>

              {item.selected && item.quantity > 0 && (
                <div className="mt-3 sm:ml-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-2 border-b border-gray-300">
                    <h5 className="text-lg font-semibold text-gray-800">
                      {item.name || "Custom Equipment"} - Unit 1
                    </h5>
                    <span className="self-start sm:self-auto bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Equipment {Object.keys(equipmentData).length + index + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      ["tagNumber", "Tag Number *"],
                      ["jobNumber", "Job Number *"],
                      ["manufacturingSerial", "Manufacturing Serial *"],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={item.details[key]}
                          onChange={(e) => handleCustomEquipmentDetailChange(index, key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Attach Documents</label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xlsx,.xls,.dwg,.jpg,.jpeg,.png"
                      onChange={(e) => handleCustomEquipmentDocsChange(index, e.target.files)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {item.details.documents?.length > 0 && (
                      <ul className="mt-2 text-xs text-gray-700 list-disc pl-5 space-y-1">
                        {item.details.documents.map((f, i) => (
                          <li key={i}>{f.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center">
            <button
              type="button"
              onClick={addCustomEquipment}
              className="text-blue-500 hover:text-blue-700 font-medium"
            >
              + Click here to add new equipment type
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg text-center">
          <span className="text-lg font-semibold text-green-700">
            Total Equipment: {getTotalEquipment()} units
          </span>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Review Project Details</h3>
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Project Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Title:</strong> {formData.projectTitle}</div>
              <div><strong>PO Number:</strong> {formData.poNumber}</div>
              <div><strong>Client:</strong> {formData.clientName}</div>
              <div><strong>Order Date:</strong> {formData.salesOrderDate}</div>
              <div><strong>Location:</strong> {formData.plantLocation || "Not specified"}</div>
              <div><strong>Industry:</strong> {formData.clientIndustry || "Not specified"}</div>
              <div><strong>Project Manager:</strong> {formData.projectManager || "Not assigned"}</div>
              <div><strong>Total Value:</strong> {formData.totalValue ? `₹${formData.totalValue}` : "Not specified"}</div>
            </div>
          </div>

          {formData.scope.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Project Scope</h4>
              <div className="flex flex-wrap gap-2">
                {formData.scope.map((s) => (
                  <span key={s} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Equipment Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.entries(equipmentData)
                .filter(([_, d]) => d.selected && d.quantity > 0)
                .map(([type, d]) => (
                  <div key={type} className="flex justify-between">
                    <span>{type}:</span>
                    <span>{d.quantity} units</span>
                  </div>
                ))}
              {customEquipment
                .filter((it) => it.selected && it.quantity > 0)
                .map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{it.name}:</span>
                    <span>{it.quantity} units</span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Uploaded Documents</h4>
            <div className="text-sm space-y-1">
              {uploadedFiles.unpricedPO && <div>• Unpriced PO: {uploadedFiles.unpricedPO.name}</div>}
              {uploadedFiles.clientReference && <div>• Client Reference: {uploadedFiles.clientReference.name}</div>}
              {uploadedFiles.designInputs && <div>• Design Inputs: {uploadedFiles.designInputs.name}</div>}
              {uploadedFiles.otherDocuments.length > 0 && (
                <div>• Other Documents: {uploadedFiles.otherDocuments.length} file(s)</div>
              )}
              {!uploadedFiles.unpricedPO &&
                !uploadedFiles.clientReference &&
                !uploadedFiles.designInputs &&
                uploadedFiles.otherDocuments.length === 0 && (
                  <div className="text-gray-500">No documents uploaded</div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ---------- modal shell ---------- */
  return (
    <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mt-6 sm:mt-8 mb-8">
        <div
          style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
          className="text-white p-3 sm:p-4 rounded-t-lg flex items-center justify-between gap-2"
        >
          <h2 className="text-lg sm:text-xl font-semibold">Add New Project</h2>
          <button
            onClick={onClose}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm transition- text-black"
          >
            ✕ Close
          </button>
        </div>

        <div className="flex flex-wrap justify-center items-center p-3 sm:p-4 border-b border-gray-200 gap-3 sm:gap-4">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex items-center gap-2 ${
                currentStep === step
                  ? "text-blue-600 font-semibold"
                  : currentStep > step
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                  currentStep === step
                    ? "bg-blue-600 text-white"
                    : currentStep > step
                    ? "bg-green-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {step}
              </div>
              <span className="text-xs sm:text-sm">
                {step === 1 && "Basic Info"}
                {step === 2 && "Equipment"}
                {step === 3 && "Review"}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-6 max-h-[70vh] sm:max-h-[65vh] overflow-y-auto">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <div className="border-t p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between">
          <div>
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Previous
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreateProject}
                className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Create Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Optional demo wrapper (remove if not needed) */
export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleProjectAdded = () => {};
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Project Management Dashboard</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              + Add New Project
            </button>
          </div>
          <div className="text-center py-12 text-gray-500">
            <p>Click "Add New Project" button to open the modal</p>
          </div>
        </div>
      </div>

      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectAdded={handleProjectAdded}
      />
    </div>
  );
}
