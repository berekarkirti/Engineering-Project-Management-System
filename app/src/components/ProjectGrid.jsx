"use client";

import { useState } from "react";
import ProjectEditModal from "./ProjectEditModal";

function ProgressUpdateModal({ isOpen, onClose, phaseData, onUpdate }) {
  const [status, setStatus] = useState(phaseData?.progress || 0);
  const [remarks, setRemarks] = useState(phaseData?.remarks || "");

  const handleSubmit = () => {
    if (onUpdate) {
      onUpdate({
        phaseId: phaseData.id,
        phaseName: phaseData.name,
        progress: status,
        remarks: remarks,
      });
    }
    onClose();
  };

  if (!isOpen || !phaseData) return null;

  return (
    <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w/full border-2 border-blue-400">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Update Status - {phaseData.name}</h3>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-lg font-semibold text-gray-900">{status}%</span>
              <div className="flex-1 relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${status}%` }} />
                </div>
                <div
                  className="absolute top-[-35px] bg-gray-700 text-white text-xs px-2 py-1 rounded transform -translate-x-1/2 pointer-events-none"
                  style={{ left: `${status}%` }}
                >
                  {status}
                </div>
              </div>
              <div className="w-6 h-6 flex items-center justify-center">
                {status === 100 && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={status}
              onChange={(e) => setStatus(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${status}%, #e5e7eb ${status}%, #e5e7eb 100%)` }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add your remarks here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="4"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-6 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectGrid({ projects, onProjectSelect, onProjectEdit, onClientView }) {
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [progressModal, setProgressModal] = useState({ isOpen: false, phaseData: null });
  const [editModal, setEditModal] = useState({ isOpen: false, projectData: null });
  const [projectProgress, setProjectProgress] = useState({});

  const toggleProjectExpansion = (projectId) => {
    const next = new Set(expandedProjects);
    next.has(projectId) ? next.delete(projectId) : next.add(projectId);
    setExpandedProjects(next);
  };

  const getProgressColor = (p) => (p >= 75 ? "#28a745" : p >= 50 ? "#fd7e14" : p >= 30 ? "#dc3545" : "#6c757d");

  const calculateOverallProgress = (project) => {
    const phases = ["Documentation", "Procurement", "Manufacturing", "Testing"];
    const defaults = [75, 60, 45, 20];
    const custom = projectProgress[project.id] || {};
    const values = phases.map((phase, i) => (custom[phase] !== undefined ? custom[phase] : defaults[i]));
    return Math.round(values.reduce((s, v) => s + v, 0) / phases.length);
  };

  const getPhaseProgress = (pid, name, defVal) => projectProgress[pid]?.[name] ?? defVal;

  const handleProgressDoubleClick = (projectId, phaseName, currentProgress) =>
    setProgressModal({ isOpen: true, phaseData: { id: `${projectId}-${phaseName}`, name: phaseName, progress: currentProgress, remarks: `${phaseName} phase remarks for project ${projectId}` } });

  const handleProgressUpdate = (u) => {
    const [projectId, phaseName] = u.phaseId.split("-");
    setProjectProgress((prev) => ({ ...prev, [projectId]: { ...prev[projectId], [phaseName]: u.progress } }));
  };

  // OPEN EDIT (same fields as Add)
  const handleProjectEdit = (project) => setEditModal({ isOpen: true, projectData: project });

  // BUBBLE UPDATE UP (parent can persist)
  const handleProjectUpdate = (updatedProject) => {
    onProjectEdit && onProjectEdit(updatedProject);
  };

  const closeEditModal = () => setEditModal({ isOpen: false, projectData: null });
  const closeProgressModal = () => setProgressModal({ isOpen: false, phaseData: null });

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No projects found matching your criteria</div>
        <div className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Projects ({projects.length})</h3>

        {projects.map((project) => {
          const isExpanded = expandedProjects.has(project.id);
          const overall = calculateOverallProgress(project);
          const equipmentCount = project.equipment?.length || 0;
          const phases = ["Documentation", "Procurement", "Manufacturing", "Testing"];
          const defaults = [75, 50, 30, 0];

          return (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <div>
                  <h4 className="project-title">{project.project_title}</h4>
                  <div className="project-po">PO: {project.po_number}</div>
                  <div className="project-client">{project.client_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {project.sales_order_date ? <>Order Date: {new Date(project.sales_order_date).toLocaleDateString()}</> : <>Order Date: —</>}
                  </div>
                  {project.total_value !== undefined && project.total_value !== null && (
                    <div className="text-lg font-semibold text-green-600">₹{(Number(project.total_value) / 100000).toFixed(1)}L</div>
                  )}
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-title">Overall Progress: {overall}%</div>
                <div className="progress-grid">
                  {phases.map((phase, i) => {
                    const pp = getPhaseProgress(project.id, phase, defaults[i]);
                    return (
                      <div key={phase} className="progress-item">
                        <div
                          className="progress-circle cursor-pointer hover:scale-105 transition-transform"
                          style={{ background: `conic-gradient(${getProgressColor(pp)} ${pp * 3.6}deg, #ecf0f1 0deg)` }}
                          onDoubleClick={() => handleProgressDoubleClick(project.id, phase, pp)}
                          title="Double click to update progress"
                        >
                          <span>{pp}%</span>
                        </div>
                        <div className="progress-label">{phase}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`project-summary ${isExpanded ? "active" : ""}`}>
                <div className="summary-grid">
                  <div className="summary-item">
                    <strong>Project Manager:</strong>
                    <span>{project.project_manager || "Not assigned"}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Plant Location:</strong>
                    <span>{project.plant_location || "Not specified"}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Industry:</strong>
                    <span>{project.client_industry || "Not specified"}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Equipment Count:</strong>
                    <span>{equipmentCount} items</span>
                  </div>
                  <div className="summary-item">
                    <strong>Consultant:</strong>
                    <span>{project.consultant || "Not assigned"}</span>
                  </div>
                  <div className="summary-item">
                    <strong>TPI Agency:</strong>
                    <span>{project.tpi_agency || "Not assigned"}</span>
                  </div>
                </div>

                {Array.isArray(project.scope) && project.scope.length > 0 && (
                  <div className="mt-4">
                    <strong className="text-sm text-gray-700">Project Scope:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.scope.map((item, index) => (
                        <span key={index} className="scope-badge">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {project.kickoff_notes && (
                  <div className="mt-4">
                    <strong className="text-sm text-gray-700">Kickoff Notes:</strong>
                    <p className="text-sm text-gray-600 mt-1">{project.kickoff_notes}</p>
                  </div>
                )}
              </div>

              <div className="action-buttons">
                <button className="btn btn-primary" onClick={() => onProjectSelect(project)}>
                  View Details
                </button>
                <button className="btn btn-secondary" onClick={() => handleProjectEdit(project)}>
                  Edit
                </button>
                <button className="btn btn-outline" onClick={() => onClientView(project)}>
                  Client View
                </button>
                <button className="toggle-btn" onClick={() => toggleProjectExpansion(project.id)}>
                  {isExpanded ? "Show Less" : "Show More"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT modal: EXACT same fields/flow as Add */}
      <ProjectEditModal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        projectData={editModal.projectData}
        onUpdate={handleProjectUpdate}
      />

      <ProgressUpdateModal
        isOpen={progressModal.isOpen}
        onClose={closeProgressModal}
        phaseData={progressModal.phaseData}
        onUpdate={handleProgressUpdate}
      />
    </>
  );
}
