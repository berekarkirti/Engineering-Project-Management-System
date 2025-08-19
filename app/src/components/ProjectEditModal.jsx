"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import axios from 'axios';

/* ====== Reusable Addable dropdown (+ Add New … / Existing …) ====== */
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
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filtered = filter
    ? items.filter((x) => (x || "").toLowerCase().includes(filter.toLowerCase()))
    : items;

  const pick = (v) => {
    onChange(v);
    setOpen(false);
    setAdding(false);
    setNewVal("");
  };

  return (
    <div ref={ref} className="w-full">
      <label className="block text-sm font-medium text-gray-600 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="w-full text-left px-3 py-2 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={value || ""}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={value ? "text-gray-800" : "text-gray-400"}>
              {value || placeholder}
            </span>
            <span className="text-gray-500">▾</span>
          </div>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="p-2">
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
                      if (e.key === "Enter" && newVal.trim()) pick(newVal.trim());
                      if (e.key === "Escape") {
                        setAdding(false);
                        setNewVal("");
                      }
                    }}
                  />
                  <button
                    onClick={() => newVal.trim() && pick(newVal.trim())}
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

              <div className="mt-2">
                <input
                  className="w-full px-2 py-1 border border-gray-200 rounded"
                  placeholder="Search…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>

              <div className="mt-2 text-xs font-semibold text-gray-500 px-1">
                {existingHeader}
              </div>
              <div className="max-h-48 overflow-auto">
                {filtered.length ? (
                  filtered.map((it) => (
                    <button
                      key={it}
                      type="button"
                      onClick={() => pick(it)}
                      className={`w-full text-left px-2 py-2 hover:bg-gray-50 ${
                        value === it ? "bg-blue-50 text-blue-700" : "text-gray-800"
                      }`}
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

/* ======================= MAIN ======================= */
export default function ProjectEditModal({ isOpen, onClose, projectData, onUpdate }) {
  const { supabase } = useSession();

  const [currentStep, setCurrentStep] = useState(1);
  const [xlsxLoaded, setXlsxLoaded] = useState(false);

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

  // suggestions for AddableCombo
  const [knownClients, setKnownClients] = useState([]);
  const [knownIndustries, setKnownIndustries] = useState([]);

  const baseDetails = { tagNumber: "", jobNumber: "", manufacturingSerial: "", documentFile: null };

  const [equipmentData, setEquipmentData] = useState({
    "Heat Exchanger": { selected: false, quantity: 0, details: { ...baseDetails } },
    "Pressure Vessel": { selected: false, quantity: 0, details: { ...baseDetails } },
    Reactor: { selected: false, quantity: 0, details: { ...baseDetails } },
    "Storage Tank": { selected: false, quantity: 0, details: { ...baseDetails } },
    "Distillation Column": { selected: false, quantity: 0, details: { ...baseDetails } },
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
  const [localCustomKey, setLocalCustomKey] = useState(0);

  /* Load XLSX when open */
  useEffect(() => {
    if (isOpen && !xlsxLoaded) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.onload = () => setXlsxLoaded(true);
      script.onerror = () => setUploadStatus("❌ Excel processing unavailable. Please fill the form manually.");
      document.head.appendChild(script);
      return () => document.head.removeChild(script);
    }
  }, [isOpen, xlsxLoaded]);

  /* Prefill & ensure details shape */
  const projectToForm = (p) =>
    !p
      ? null
      : {
          projectTitle: p.project_title || "",
          poNumber: p.po_number || "",
          clientName: p.client_name || "",
          salesOrderDate: p.sales_order_date ? String(p.sales_order_date).split("T")[0] : "",
          plantLocation: p.plant_location || "",
          clientIndustry: p.client_industry || "",
          projectManager: p.project_manager || "",
          consultant: p.consultant || "",
          tpiAgency: p.tpi_agency || "",
          clientFocalPoint: p.client_focal_point || "",
          totalValue: p.total_value ?? "",
          paymentTerms: p.payment_terms || "",
          paymentMilestones: p.payment_milestones || "",
          kickoffNotes: p.kickoff_notes || "",
          productionNotes: p.production_notes || "",
          scope: Array.isArray(p.scope) ? p.scope : [],
        };

  useEffect(() => {
    if (!isOpen) return;
    setCurrentStep(1);

    // prefill from incoming project
    if (projectData) {
      const pre = projectToForm(projectData);
      if (pre) setFormData(pre);

      const fallback = {
        "Heat Exchanger": { selected: false, quantity: 0, details: { ...baseDetails } },
        "Pressure Vessel": { selected: false, quantity: 0, details: { ...baseDetails } },
        Reactor: { selected: false, quantity: 0, details: { ...baseDetails } },
        "Storage Tank": { selected: false, quantity: 0, details: { ...baseDetails } },
        "Distillation Column": { selected: false, quantity: 0, details: { ...baseDetails } },
      };

      const withDoc = (obj) =>
        Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [
            k,
            {
              ...v,
              details: {
                tagNumber: v?.details?.tagNumber || "",
                jobNumber: v?.details?.jobNumber || "",
                manufacturingSerial: v?.details?.manufacturingSerial || "",
                documentFile: v?.details?.documentFile || null,
              },
            },
          ])
        );

      setEquipmentData(projectData.equipmentData ? withDoc(projectData.equipmentData) : fallback);

      const custom = Array.isArray(projectData.customEquipment) ? projectData.customEquipment : [];
      setCustomEquipment(
        custom.map((it) => ({
          ...it,
          details: {
            tagNumber: it?.details?.tagNumber || "",
            jobNumber: it?.details?.jobNumber || "",
            manufacturingSerial: it?.details?.manufacturingSerial || "",
            documentFile: it?.details?.documentFile || null,
          },
        }))
      );

      setUploadedFiles(
        projectData.uploadedFiles || {
          unpricedPO: null,
          clientReference: null,
          designInputs: null,
          otherDocuments: [],
        }
      );
    }
  }, [isOpen, projectData]);

  /* Load suggestions for Client & Industry from projects */
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
        /* ignore */
      }
    })();
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  /* helpers */
  const handleInputChange = (field, value) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const handleScopeChange = (scope, checked) =>
    setFormData((p) => ({
      ...p,
      scope: checked ? [...p.scope, scope] : p.scope.filter((s) => s !== scope),
    }));

  const handleFileUpload = (fileType, event) => {
    const files = event.target.files;
    if (!files) return;
    setUploadedFiles((p) => ({
      ...p,
      [fileType]: fileType === "otherDocuments" ? Array.from(files) : files[0],
    }));
  };

  const handleEquipmentChange = (type, field, value) =>
    setEquipmentData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]:
          field === "selected"
            ? value
            : field === "quantity"
            ? Math.max(0, parseInt(value) || 0)
            : value,
      },
    }));

  const handleEquipmentDetailChange = (type, field, value) =>
    setEquipmentData((prev) => ({
      ...prev,
      [type]: { ...prev[type], details: { ...prev[type].details, [field]: value } },
    }));

  const handleEquipmentDetailFileChange = (type, file) =>
    setEquipmentData((prev) => ({
      ...prev,
      [type]: { ...prev[type], details: { ...prev[type].details, documentFile: file || null } },
    }));

  const addCustomEquipment = () => {
    setCustomEquipment((prev) => [
      ...prev,
      { name: "", quantity: 0, selected: false, details: { ...baseDetails } },
    ]);
    setLocalCustomKey((k) => k + 1);
  };

  const handleCustomEquipmentChange = (index, field, value) =>
    setCustomEquipment((prev) => {
      const c = [...prev];
      if (field === "selected") {
        c[index].selected = value;
        if (!value) c[index].quantity = 0;
      } else if (field === "quantity") {
        c[index].quantity = Math.max(0, parseInt(value) || 0);
      } else {
        c[index][field] = value;
      }
      return c;
    });

  const handleCustomEquipmentDetailChange = (index, field, value) =>
    setCustomEquipment((prev) => {
      const c = [...prev];
      c[index].details[field] = value;
      return c;
    });

  const handleCustomEquipmentDetailFileChange = (index, file) =>
    setCustomEquipment((prev) => {
      const c = [...prev];
      c[index].details.documentFile = file || null;
      return c;
    });

  const getTotalEquipment =
    () =>
      Object.values(equipmentData).reduce((s, it) => s + (it.selected ? it.quantity : 0), 0) +
      customEquipment.reduce((s, it) => s + (it.selected ? it.quantity : 0), 0);

  const nextStep = () => currentStep < 3 && setCurrentStep((s) => s + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep((s) => s - 1);

// This is the corrected handleUpdateProject function for your EditProjectModal
// Replace your existing handleUpdateProject function with this:

const handleUpdateProject = async () => {
  try {
    // Starting project update
    setUploadStatus("🔄 Updating project and uploading files...");
    
    // Validate required fields
    const requiredFields = ['projectTitle', 'poNumber', 'clientName', 'salesOrderDate'];
    const missing = requiredFields.filter(field => !formData[field]?.trim());
    
    if (missing.length > 0) {
      setUploadStatus("");
      alert(`Please fill in required fields: ${missing.join(', ')}`);
      return;
    }

    if (!projectData?.id) {
      setUploadStatus("");
      alert('Project ID is missing. Cannot update project.');
      return;
    }

    // Prepare update payload
    const updatePayload = {
      id: projectData.id,
      project_title: formData.projectTitle,
      po_number: formData.poNumber,
      client_name: formData.clientName,
      sales_order_date: formData.salesOrderDate,
      plant_location: formData.plantLocation || null,
      client_industry: formData.clientIndustry || null,
      project_manager: formData.projectManager || null,
      consultant: formData.consultant || null,
      tpi_agency: formData.tpiAgency || null,
      client_focal_point: formData.clientFocalPoint || null,
      total_value: formData.totalValue ? Number(formData.totalValue) : 0,
      payment_terms: formData.paymentTerms || null,
      payment_milestones: formData.paymentMilestones || null,
      kickoff_notes: formData.kickoffNotes || null,
      production_notes: formData.productionNotes || null,
      scope: formData.scope || [],
    };

    // Sending update payload

    // Make API call to update project
    const response = await fetch('/api/projects', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update project');
    }

    const updatedProject = await response.json();
    // Project updated successfully

    // Update equipment data if needed
    await updateEquipmentData(projectData.id);

    // Upload new project documents if any
    const documentUploads = [
      { file: uploadedFiles.unpricedPO, docType: "unpriced-po" },
      { file: uploadedFiles.clientReference, docType: "client-reference" },
      { file: uploadedFiles.designInputs, docType: "design-inputs" }
    ];

    for (const { file, docType } of documentUploads) {
      if (!file) continue;
      
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const path = `${projectData.id}/${fileName}`;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);
        formData.append('bucket', 'project-docs');
        
        const uploadRes = await fetch('/api/upload-file', {
          method: 'POST',
          body: formData
        });
        
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          
          await fetch("/api/project-documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project_id: projectData.id,
              file_name: file.name,
              url: url,
              doc_type: docType,
            }),
          });
          
          // Project document uploaded successfully
        } else {
          // Failed to upload project document
        }
      } catch (err) {
        console.error('Project document upload error:', err);
      }
    }

    // Upload other documents
    if (uploadedFiles.otherDocuments?.length) {
      for (const file of uploadedFiles.otherDocuments) {
        try {
          const fileName = `${Date.now()}-${file.name}`;
          const path = `${projectData.id}/${fileName}`;
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('path', path);
          formData.append('bucket', 'project-docs');
          
          const uploadRes = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData
          });
          
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            
            await fetch("/api/project-documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                project_id: projectData.id,
                file_name: file.name,
                url: url,
                doc_type: "other",
              }),
            });
            
            // Other document uploaded successfully
          } else {
            // Failed to upload other document
          }
        } catch (err) {
          console.error('Other document upload error:', err);
        }
      }
    }

    // Upload equipment documents
    const stdEntries = Object.entries(equipmentData)
      .filter(([_, d]) => d.selected && d.quantity > 0 && d.details.documentFile);
    
    const customEntries = customEquipment
      .filter((it) => it.selected && it.quantity > 0 && it.details.documentFile);

    for (const [type, data] of stdEntries) {
      if (data.details.documentFile) {
        try {
          const fileName = `${Date.now()}-${data.details.documentFile.name}`;
          const path = `${projectData.id}/equipment/${fileName}`;
          
          const formData = new FormData();
          formData.append('file', data.details.documentFile);
          formData.append('path', path);
          formData.append('bucket', 'equipment-docs');
          
          const uploadRes = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData
          });
          
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            // Equipment document uploaded successfully
          }
        } catch (err) {
          console.error(`Equipment document upload error for ${type}:`, err);
        }
      }
    }

    for (const [index, item] of customEntries.entries()) {
      if (item.details.documentFile) {
        try {
          const fileName = `${Date.now()}-${item.details.documentFile.name}`;
          const path = `${projectData.id}/equipment/${fileName}`;
          
          const formData = new FormData();
          formData.append('file', item.details.documentFile);
          formData.append('path', path);
          formData.append('bucket', 'equipment-docs');
          
          const uploadRes = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData
          });
          
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            // Custom equipment document uploaded successfully
          }
        } catch (err) {
          console.error(`Custom equipment document upload error for ${item.name}:`, err);
        }
      }
    }

    setUploadStatus("✅ Project updated successfully!");
    setTimeout(() => setUploadStatus(""), 2000);

    // Show success message
    alert('✅ Project updated successfully with all documents uploaded!');

    // Notify parent component
    if (onUpdate) {
      onUpdate(updatedProject);
    }
    
    // Close modal
    if (onClose) {
      onClose();
    }

  } catch (error) {
    console.error('Error updating project:', error);
    setUploadStatus("");
    
    // Handle error response
    const errorMessage = error.message || 'Unknown error occurred';
    alert(`❌ Failed to update project: ${errorMessage}`);
  }
};

// Enhanced updateEquipmentData function
const updateEquipmentData = async (projectId) => {
  try {
    const stdEntries = Object.entries(equipmentData)
      .filter(([_, d]) => d.selected && d.quantity > 0)
      .map(([type, d]) => ({ type, ...d }));
    
    const customEntries = customEquipment
      .filter((it) => it.selected && it.quantity > 0)
      .map((it) => ({ type: it.name, ...it }));
    
    const allEquip = [...stdEntries, ...customEntries];

    for (const item of allEquip) {
      const eqData = {
        project_id: projectId,
        equipment_type: item.type,
        quantity: item.quantity,
        tag_number: item.details?.tagNumber || null,
        job_number: item.details?.jobNumber || null,
        manufacturing_serial: item.details?.manufacturingSerial || null,
      };

      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eqData),
      });

      if (response.ok) {
        // Equipment updated successfully
      } else {
        // Failed to update equipment
      }
    }
  } catch (error) {
    console.error('Equipment update failed:', error);
  }
};


  /* ------------------ STEP 1 ------------------ */
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Excel Upload */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-md font-medium text-gray-700">Import from Excel File</h3>
          <span className="text-xs text-gray-500">Optional</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !xlsxLoaded || !window.XLSX) {
                setUploadStatus("❌ Excel library not loaded yet. Please try again.");
                return;
              }
              setUploadStatus("Processing…");
              try {
                const buf = await file.arrayBuffer();
                const wb = window.XLSX.read(buf);
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
                const headers = rows[0] || [];
                const dataRow = rows[1] || [];
                const map = {};
                headers.forEach((h, i) => {
                  if (h && dataRow[i] !== undefined)
                    map[h.toString().toLowerCase().trim()] = dataRow[i];
                });

                const newForm = { ...formData };
                const newEq = { ...equipmentData };

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
                  if (map[k]) newForm[v] = String(map[k]);
                });

                const eqMap = {
                  "heat exchanger": "Heat Exchanger",
                  "pressure vessel": "Pressure Vessel",
                  reactor: "Reactor",
                  "storage tank": "Storage Tank",
                  "distillation column": "Distillation Column",
                };
                Object.entries(eqMap).forEach(([k, type]) => {
                  if (map[k] && !isNaN(map[k])) {
                    const q = parseInt(map[k]);
                    if (q > 0) newEq[type] = { ...newEq[type], selected: true, quantity: q };
                  }
                });

                const required = [];
                ["projectTitle", "poNumber", "clientName", "salesOrderDate"].forEach((f) => {
                  if (!newForm[f]) required.push(f);
                });

                setFormData(newForm);
                setEquipmentData(newEq);
                setMissingFields(required);
                setUploadStatus("✅ Excel data loaded successfully!");
                setTimeout(() => setUploadStatus(""), 3000);
              } catch {
                setUploadStatus("❌ Error reading Excel file. Please check the format.");
                setTimeout(() => setUploadStatus(""), 5000);
              }
            }}
            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50"
            disabled={!xlsxLoaded}
          />
          {!xlsxLoaded && (
            <span className="text-sm text-orange-600">Loading Excel library...</span>
          )}
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
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Project Title *{" "}
              {missingFields.includes("projectTitle") && (
                <span className="text-red-500">(Required)</span>
              )}
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                missingFields.includes("projectTitle")
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
              value={formData.projectTitle}
              onChange={(e) => handleInputChange("projectTitle", e.target.value)}
              placeholder="Enter project title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              PO Number *{" "}
              {missingFields.includes("poNumber") && (
                <span className="text-red-500">(Required)</span>
              )}
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                missingFields.includes("poNumber")
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
              value={formData.poNumber}
              onChange={(e) => handleInputChange("poNumber", e.target.value)}
              placeholder="Enter PO number"
            />
          </div>

          {/* Client Name — AddableCombo */}
          <AddableCombo
            label="Client Name"
            required
            placeholder="Select or enter client"
            value={formData.clientName}
            onChange={(v) => handleInputChange("clientName", v)}
            items={knownClients}
            addNewText="+ Add New Client"
            existingHeader="Existing Clients"
          />

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Sales Order Date *{" "}
              {missingFields.includes("salesOrderDate") && (
                <span className="text-red-500">(Required)</span>
              )}
            </label>
            <input
              type="date"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                missingFields.includes("salesOrderDate")
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
              value={formData.salesOrderDate}
              onChange={(e) => handleInputChange("salesOrderDate", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Plant Location
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Jamnagar, Gujarat"
              value={formData.plantLocation}
              onChange={(e) => handleInputChange("plantLocation", e.target.value)}
            />
          </div>

          {/* Client Industry — AddableCombo */}
          <AddableCombo
            label="Client Industry"
            placeholder="Select or enter industry"
            value={formData.clientIndustry}
            onChange={(v) => handleInputChange("clientIndustry", v)}
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
              <label className="block text-sm font-medium text-gray-600 mb-2">
                {label}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData[key]}
                onChange={(e) => handleInputChange(key, e.target.value)}
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
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Total Value (₹)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.totalValue}
              onChange={(e) => handleInputChange("totalValue", e.target.value)}
              placeholder="Enter total project value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Payment Terms
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.paymentTerms}
              onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
              placeholder="e.g., 30% Advance, 40% On Dispatch, 30% On Commissioning"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Payment Milestones
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.paymentMilestones}
              onChange={(e) => handleInputChange("paymentMilestones", e.target.value)}
              placeholder="Describe payment milestones"
            />
          </div>
        </div>
      </div>

      {/* Scope */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Project Scope</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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

      {/* General Uploads */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Document Uploads</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            ["unpricedPO", "Unpriced PO File", ".pdf,.doc,.docx,.xlsx,.xls"],
            ["clientReference", "Client's Reference Document", ".pdf,.doc,.docx,.xlsx,.xls"],
            ["designInputs", "Design Inputs/PID", ".pdf,.doc,.docx,.xlsx,.xls,.dwg"],
          ].map(([key, label, accept]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
              <input
                type="file"
                accept={accept}
                onChange={(e) => handleFileUpload(key, e)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploadedFiles[key] && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ {uploadedFiles[key].name || "Selected"}
                </p>
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Other Documents
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xlsx,.xls,.dwg,.jpg,.png"
              onChange={(e) => handleFileUpload("otherDocuments", e)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadedFiles.otherDocuments?.length > 0 && (
              <p className="text-xs text-green-600 mt-1">
                ✓ {uploadedFiles.otherDocuments.length} file(s) selected
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /* ------------------ STEP 2 (equipment) ------------------ */
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Equipment Information</h3>
        <h4 className="text-sm sm:text-md font-medium text-gray-600 mb-6">
          Select Equipment Types & Quantities
        </h4>

        <div className="space-y-3">
          {Object.entries(equipmentData).map(([type, data]) => (
            <div key={type}>
              <div
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 border-2 rounded-lg transition-all ${
                  data.selected ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600"
                    checked={data.selected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      handleEquipmentChange(type, "selected", checked);
                      if (checked && data.quantity === 0)
                        handleEquipmentChange(type, "quantity", 1);
                    }}
                  />
                  <label className="text-sm font-medium text-gray-700">{type}</label>
                </div>
                <input
                  type="number"
                  className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.quantity}
                  onChange={(e) => handleEquipmentChange(type, "quantity", e.target.value)}
                  disabled={!data.selected}
                  min="0"
                />
              </div>

              {data.selected && data.quantity > 0 && (
                <div className="mt-3 sm:ml-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 pb-2 border-b border-gray-300">
                    <h5 className="text-base sm:text-lg font-semibold text-gray-800">
                      {type} - Unit 1
                    </h5>
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
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
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          {label}
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={data.details[key]}
                          onChange={(e) =>
                            handleEquipmentDetailChange(type, key, e.target.value)
                          }
                        />
                      </div>
                    ))}

                    {/* upload per-equipment doc */}
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Supporting Document
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xlsx,.xls,.dwg,.jpg,.png"
                        onChange={(e) =>
                          handleEquipmentDetailFileChange(type, e.target.files?.[0] || null)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {data.details.documentFile && (
                        <p className="text-xs text-green-700 mt-1">
                          ✓ {data.details.documentFile.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Upload spec sheet / drawing / certificate
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {customEquipment.map((item, index) => (
            <div key={`${localCustomKey}-${index}`}>
              <div
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 border-2 rounded-lg transition-all ${
                  item.selected ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600"
                    checked={item.selected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      handleCustomEquipmentChange(index, "selected", checked);
                      if (checked && item.quantity === 0)
                        handleCustomEquipmentChange(index, "quantity", 1);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Enter equipment type name..."
                    className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={item.name}
                    onChange={(e) => handleCustomEquipmentChange(index, "name", e.target.value)}
                  />
                </div>
                <input
                  type="number"
                  className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={item.quantity}
                  onChange={(e) => handleCustomEquipmentChange(index, "quantity", e.target.value)}
                  disabled={!item.selected}
                  min="0"
                />
              </div>

              {item.selected && item.quantity > 0 && (
                <div className="mt-3 sm:ml-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 pb-2 border-b border-gray-300">
                    <h5 className="text-base sm:text-lg font-semibold text-gray-800">
                      {item.name || "Custom Equipment"} - Unit 1
                    </h5>
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
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
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          {label}
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={item.details[key]}
                          onChange={(e) =>
                            handleCustomEquipmentDetailChange(index, key, e.target.value)
                          }
                        />
                      </div>
                    ))}

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Supporting Document
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xlsx,.xls,.dwg,.jpg,.png"
                        onChange={(e) =>
                          handleCustomEquipmentDetailFileChange(
                            index,
                            e.target.files?.[0] || null
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {item.details.documentFile && (
                        <p className="text-xs text-green-700 mt-1">
                          ✓ {item.details.documentFile.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Upload spec sheet / drawing / certificate
                      </p>
                    </div>
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

  /* ------------------ STEP 3 (review) ------------------ */
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Review Project Details</h3>
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg space-y-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {Object.entries(equipmentData)
                .filter(([_, d]) => d.selected && d.quantity > 0)
                .map(([type, d]) => (
                  <div key={type} className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>{type}:</span>
                      <span>{d.quantity} units</span>
                    </div>
                    {d.details.documentFile && (
                      <div className="text-xs text-gray-600">• Doc: {d.details.documentFile.name}</div>
                    )}
                  </div>
                ))}
              {customEquipment
                .filter((it) => it.selected && it.quantity > 0)
                .map((it, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>{it.name}:</span>
                      <span>{it.quantity} units</span>
                    </div>
                    {it.details.documentFile && (
                      <div className="text-xs text-gray-600">• Doc: {it.details.documentFile.name}</div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Uploaded Documents</h4>
            <div className="text-sm space-y-1">
              {uploadedFiles.unpricedPO && <div>• Unpriced PO: {uploadedFiles.unpricedPO.name || "Selected"}</div>}
              {uploadedFiles.clientReference && <div>• Client Reference: {uploadedFiles.clientReference.name || "Selected"}</div>}
              {uploadedFiles.designInputs && <div>• Design Inputs: {uploadedFiles.designInputs.name || "Selected"}</div>}
              {uploadedFiles.otherDocuments?.length > 0 && <div>• Other Documents: {uploadedFiles.otherDocuments.length} file(s)</div>}
              {!uploadedFiles.unpricedPO && !uploadedFiles.clientReference && !uploadedFiles.designInputs && (uploadedFiles.otherDocuments?.length || 0) === 0 && (
                <div className="text-gray-500">No documents uploaded</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ------------------ SHELL ------------------ */
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mt-6 mb-6">
        <div
          style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
          className="text-white p-3 sm:p-4 rounded-t-lg flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <h2 className="text-lg sm:text-xl font-semibold">Edit Project</h2>
          <button
            onClick={onClose}
            className="self-end sm:self-auto bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-sm transition text-white"
            aria-label="Close modal"
          >
            ✕ Close
          </button>
        </div>

        <div className="flex justify-center items-center p-3 sm:p-4 border-b border-gray-200 gap-3 sm:gap-4 overflow-x-auto">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex items-center gap-2 ${
                currentStep === step ? "text-blue-600 font-semibold" : currentStep > step ? "text-green-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep === step ? "bg-blue-600 text-white" : currentStep > step ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                {step}
              </div>
              <span className="text-xs sm:text-sm">{step === 1 ? "Basic Info" : step === 2 ? "Equipment" : "Review"}</span>
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-6 max-h-[72vh] sm:max-h-[68vh] overflow-y-auto">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <div className="border-t p-3 sm:p-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sticky bottom-0 bg-white">
          <div>
            {currentStep > 1 && (
              <button onClick={prevStep} className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
                Previous
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep < 3 ? (
              <button onClick={nextStep} className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                Next
              </button>
            ) : (
              <button onClick={handleUpdateProject} className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                Update Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
