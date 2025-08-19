"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/SessionProvider";

// UUID Utility Functions
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
 // Enhanced Excel handling function for AddProjectModal
const handleExcelUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  if (!xlsxLoaded || !window.XLSX) {
    setUploadStatus("❌ Excel library not loaded yet. Please try again.");
    return;
  }
  
  setUploadStatus("📋 Processing Excel file...");
  
  try {
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
    
    // Create a data object from Excel
    const data = {};
    const headers = rows[0] || [];
    const dataRow = rows[1] || [];
    
    // Map headers to data
    headers.forEach((h, i) => {
      if (h && dataRow[i] !== undefined && dataRow[i] !== null && dataRow[i] !== "") {
        const key = h.toString().toLowerCase().trim();
        let value = dataRow[i];
        
        // Handle different data types
        if (typeof value === 'number') {
          value = value.toString();
        } else if (value instanceof Date) {
          value = value.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        } else if (typeof value === 'string') {
          value = value.trim();
        }
        
        data[key] = value;
      }
    });
    
    // Excel data parsed successfully
    
    // Create new form data object
    const newForm = { ...formData };
    const newEquip = { ...equipmentData };
    const foundFields = [];
    const missingFieldsList = [];
    
    // Enhanced field mapping with multiple possible column names
    const fieldMappings = {
      // Project Title mappings
      projectTitle: [
        'project title', 'project_title', 'title', 'project name', 'project_name',
        'name', 'प्रोजेक्ट टाइटल', 'प्रोजेक्ट नाम'
      ],
      
      // PO Number mappings
      poNumber: [
        'po number', 'po_number', 'po', 'purchase order', 'purchase_order',
        'order number', 'order_number', 'पीओ नंबर', 'ऑर्डर नंबर'
      ],
      
      // Client Name mappings
      clientName: [
        'client name', 'client_name', 'client', 'customer', 'customer name',
        'customer_name', 'company', 'company name', 'क्लाइंट नाम', 'ग्राहक नाम'
      ],
      
      // Sales Order Date mappings
      salesOrderDate: [
        'sales order date', 'sales_order_date', 'order date', 'order_date',
        'date', 'so date', 'so_date', 'ऑर्डर डेट', 'सेल्स ऑर्डर डेट'
      ],
      
      // Plant Location mappings
      plantLocation: [
        'plant location', 'plant_location', 'location', 'site', 'plant',
        'address', 'place', 'city', 'स्थान', 'प्लांट लोकेशन'
      ],
      
      // Client Industry mappings
      clientIndustry: [
        'client industry', 'client_industry', 'industry', 'sector',
        'business type', 'business_type', 'इंडस्ट्री', 'व्यवसाय'
      ],
      
      // Project Manager mappings
      projectManager: [
        'project manager', 'project_manager', 'manager', 'pm', 'lead',
        'project lead', 'प्रोजेक्ट मैनेजर', 'मैनेजर'
      ],
      
      // Consultant mappings
      consultant: [
        'consultant', 'consulting', 'advisor', 'consultancy',
        'कंसल्टेंट', 'सलाहकार'
      ],
      
      // TPI Agency mappings
      tpiAgency: [
        'tpi agency', 'tpi_agency', 'tpi', 'third party', 'third_party',
        'inspector', 'inspection agency', 'टीपीआई एजेंसी'
      ],
      
      // Client Focal Point mappings
      clientFocalPoint: [
        'client focal point', 'client_focal_point', 'focal point', 'focal_point',
        'contact person', 'contact_person', 'client contact', 'point of contact',
        'संपर्क व्यक्ति', 'क्लाइंट कॉन्टैक्ट'
      ],
      
      // Total Value mappings
      totalValue: [
        'total value', 'total_value', 'value', 'amount', 'total amount',
        'total_amount', 'project value', 'project_value', 'cost',
        'price', 'कुल राशि', 'मूल्य'
      ],
      
      // Payment Terms mappings
      paymentTerms: [
        'payment terms', 'payment_terms', 'terms', 'payment condition',
        'payment_condition', 'भुगतान शर्तें'
      ],
      
      // Payment Milestones mappings
      paymentMilestones: [
        'payment milestones', 'payment_milestones', 'milestones',
        'payment schedule', 'payment_schedule', 'भुगतान मील के पत्थर'
      ],
      
      // Kickoff Notes mappings
      kickoffNotes: [
        'kickoff notes', 'kickoff_notes', 'kickoff', 'meeting notes',
        'meeting_notes', 'notes', 'किकऑफ नोट्स'
      ],
      
      // Production Notes mappings
      productionNotes: [
        'production notes', 'production_notes', 'production',
        'manufacturing notes', 'manufacturing_notes', 'प्रोडक्शन नोट्स'
      ]
    };
    
    // Map Excel data to form fields
    Object.entries(fieldMappings).forEach(([formField, possibleKeys]) => {
      let found = false;
      for (const key of possibleKeys) {
        if (data[key] !== undefined) {
          let value = data[key];
          
          // Special handling for date fields
          if (formField === 'salesOrderDate') {
            if (typeof value === 'string') {
              // Try to parse different date formats
              const dateFormats = [
                /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
                /^\d{2}[-\/]\d{2}[-\/]\d{4}$/, // DD-MM-YYYY or DD/MM/YYYY
                /^\d{2}[-\/]\d{2}[-\/]\d{2}$/, // DD-MM-YY or DD/MM/YY
              ];
              
              for (const format of dateFormats) {
                if (format.test(value)) {
                  if (value.includes('/') || value.includes('-')) {
                    const parts = value.split(/[-\/]/);
                    if (parts.length === 3) {
                      if (parts[2].length === 2) {
                        parts[2] = '20' + parts[2]; // Convert YY to YYYY
                      }
                      if (parts[0].length === 2 && parts[1].length === 2) {
                        // DD-MM-YYYY format, convert to YYYY-MM-DD
                        value = `${parts[2]}-${parts[1]}-${parts[0]}`;
                      }
                    }
                  }
                  break;
                }
              }
            }
          }
          
          // Special handling for numeric fields
          if (formField === 'totalValue') {
            // Remove currency symbols and convert to number
            value = value.toString().replace(/[₹$,\s]/g, '');
            if (!isNaN(value) && value !== '') {
              value = parseFloat(value).toString();
            }
          }
          
          newForm[formField] = value;
          foundFields.push(`${formField} (from "${key}")`);
          found = true;
          break;
        }
      }
      
      if (!found && ['projectTitle', 'poNumber', 'clientName', 'salesOrderDate'].includes(formField)) {
        missingFieldsList.push(formField);
      }
    });
    
    // Handle Scope (multiple values in one cell or separate columns)
    const scopeFields = [
      'scope', 'services', 'work scope', 'project scope', 'scope of work',
      'design', 'manufacturing', 'testing', 'documentation', 'installation', 'commissioning'
    ];
    
    const scopeItems = [];
    scopeFields.forEach(field => {
      if (data[field]) {
        const value = data[field].toString();
        if (field === 'scope' || field === 'services' || field === 'work scope' || field === 'project scope' || field === 'scope of work') {
          // Split by comma and check each item
          const items = value.split(',').map(s => s.trim());
          items.forEach(item => {
            const scopeOptions = ['Design', 'Manufacturing', 'Testing', 'Documentation', 'Installation', 'Commissioning'];
            const matchedScope = scopeOptions.find(opt => 
              item.toLowerCase().includes(opt.toLowerCase()) || 
              opt.toLowerCase().includes(item.toLowerCase())
            );
            if (matchedScope && !scopeItems.includes(matchedScope)) {
              scopeItems.push(matchedScope);
            }
          });
        } else {
          // Individual scope columns
          const scopeMap = {
            'design': 'Design',
            'manufacturing': 'Manufacturing', 
            'testing': 'Testing',
            'documentation': 'Documentation',
            'installation': 'Installation',
            'commissioning': 'Commissioning'
          };
          
          if (scopeMap[field] && (value.toLowerCase() === 'yes' || value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'y')) {
            if (!scopeItems.includes(scopeMap[field])) {
              scopeItems.push(scopeMap[field]);
            }
          }
        }
      }
    });
    
    if (scopeItems.length > 0) {
      newForm.scope = scopeItems;
      foundFields.push(`scope (${scopeItems.join(', ')})`);
    }
    
    // Handle Equipment Data
    const equipmentTypes = {
      'heat exchanger': 'Heat Exchanger',
      'heat_exchanger': 'Heat Exchanger',
      'pressure vessel': 'Pressure Vessel', 
      'pressure_vessel': 'Pressure Vessel',
      'reactor': 'Reactor',
      'storage tank': 'Storage Tank',
      'storage_tank': 'Storage Tank',
      'distillation column': 'Distillation Column',
      'distillation_column': 'Distillation Column'
    };
    
    Object.entries(equipmentTypes).forEach(([excelKey, equipmentType]) => {
      if (data[excelKey] && !isNaN(data[excelKey])) {
        const quantity = parseInt(data[excelKey]);
        if (quantity > 0) {
          newEquip[equipmentType] = {
            ...newEquip[equipmentType],
            selected: true,
            quantity: quantity
          };
          foundFields.push(`${equipmentType} (${quantity} units)`);
        }
      }
    });
    
    // Update state
    setFormData(newForm);
    setEquipmentData(newEquip);
    setMissingFields(missingFieldsList);
    
    // Show status message
    if (foundFields.length > 0) {
      setUploadStatus(`✅ Excel data loaded successfully! Found: ${foundFields.length} fields`);
      
      if (missingFieldsList.length > 0) {
        setTimeout(() => {
          setUploadStatus(`⚠️ Please fill missing required fields: ${missingFieldsList.join(', ')}`);
        }, 3000);
      }
    } else {
      setUploadStatus("⚠️ No matching fields found in Excel. Please check column headers and try again.");
    }
    
    // Clear status after some time
    setTimeout(() => {
      if (missingFieldsList.length === 0) {
        setUploadStatus("");
      }
    }, 6000);
    
    // Form updated with parsed data
    
  } catch (error) {
    console.error("Excel processing error:", error);
    setUploadStatus("❌ Error reading Excel file. Please check the format and try again.");
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

  /* ---------- Create project with UUID validation ---------- */
// This is the corrected handleCreateProject function for your AddProjectModal
// Replace your existing handleCreateProject function with this:

const handleCreateProject = async () => {
  try {
    // Show loading state
    setUploadStatus("🚀 Creating project and uploading files...");
    
    // Get org_id
    let orgId = window?.localStorage?.getItem("current_org_id");
    if (!orgId || !isValidUUID(orgId)) {
      orgId = generateUUID();
      window.localStorage.setItem("current_org_id", orgId);
    }
    
    // Validate required fields
    const requiredFields = ['projectTitle', 'poNumber', 'clientName', 'salesOrderDate'];
    const missing = requiredFields.filter(field => !formData[field]?.trim());
    
    if (missing.length > 0) {
      setUploadStatus("");
      alert(`Please fill in required fields: ${missing.join(', ')}`);
      return;
    }
    
    // Create project first
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
        org_id: orgId,
        kickoff_notes: formData.kickoffNotes,
        production_notes: formData.productionNotes,
        scope: formData.scope,
      }),
    });
    
    if (!projRes.ok) {
      const errorData = await projRes.json();
      throw new Error(errorData.error || "Project create failed");
    }
    
    const project = await projRes.json();
    // Project created successfully

    // Equipment creation and file uploads
    const stdEntries = Object.entries(equipmentData)
      .filter(([_, d]) => d.selected && d.quantity > 0)
      .map(([type, d]) => ({ type, ...d }));
    const customEntries = customEquipment
      .filter((it) => it.selected && it.quantity > 0)
      .map((it) => ({ type: it.name, ...it }));
    const allEquip = [...stdEntries, ...customEntries];

    // Create equipment and upload documents
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
      
      if (!eqRes.ok) {
        // Equipment creation failed
        continue;
      }
      
      const eq = await eqRes.json();

      // Upload equipment documents
      const files = item.details?.documents || [];
      for (const file of files) {
        try {
          const fileName = `${Date.now()}-${file.name}`;
          const path = `${project.id}/${eq.id}/${fileName}`;
          
          // Upload file to storage
          const formData = new FormData();
          formData.append('file', file);
          formData.append('path', path);
          formData.append('bucket', 'equipment-docs');
          
          const uploadRes = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData
          });
          
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            
            // Save document record
            await fetch("/api/equipment-documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                project_id: project.id,
                equipment_id: eq.id,
                file_name: file.name,
                url: url,
                doc_type: "equipment-attachment",
              }),
            });
            
            // Equipment document uploaded successfully
          } else {
            // Failed to upload equipment document
          }
        } catch (err) {
          console.error('Equipment file upload error:', err);
        }
      }
    }

    // Upload project documents
    const documentUploads = [
      { file: uploadedFiles.unpricedPO, docType: "unpriced-po" },
      { file: uploadedFiles.clientReference, docType: "client-reference" },
      { file: uploadedFiles.designInputs, docType: "design-inputs" }
    ];

    for (const { file, docType } of documentUploads) {
      if (!file) continue;
      
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const path = `${project.id}/${fileName}`;
        
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
              project_id: project.id,
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
          const path = `${project.id}/${fileName}`;
          
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
                project_id: project.id,
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

    setUploadStatus("✅ Project created successfully!");
    setTimeout(() => setUploadStatus(""), 2000);
    
    alert('🎉 Project created successfully with all documents uploaded!');
    onProjectAdded?.();
    onClose();
    
  } catch (e) {
    console.error('Error creating project:', e);
    setUploadStatus("");
    alert(`❌ Failed to create project: ${e.message}`);
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
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm transition-colors text-black"
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
