"use client";

import { useState, useEffect } from "react";
import axios from 'axios';
import ProjectEditModal from "./ProjectEditModal";
import { ProgressUpdateModal } from "./ProgressUpdateModal";


export default function ProjectGrid({ onProjectSelect, onProjectEdit, onClientView, refreshTrigger }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [progressModal, setProgressModal] = useState({ isOpen: false, phaseData: null });
  const [editModal, setEditModal] = useState({ isOpen: false, projectData: null });
  const [projectProgress, setProjectProgress] = useState({});

  // Fetch projects and their progress
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const orgId = window?.localStorage?.getItem("current_org_id");

      // Fetch projects
      const projectsResponse = await axios.get('/api/projects', {
        params: orgId ? { org_id: orgId } : {}
      });

      const projectsData = projectsResponse.data || [];
      setProjects(projectsData);

      // Fetch progress for all projects
      if (projectsData.length > 0) {
        await fetchAllProgress(projectsData);
      }

      console.log('Fetched projects:', projectsData);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch progress data for all projects
  const fetchAllProgress = async (projectsList) => {
    try {
      const progressData = {};

      for (const project of projectsList) {
        const response = await axios.get('/api/project-progress', {
          params: { project_id: project.id }
        });

        const phases = response.data || [];
        progressData[project.id] = {};

        phases.forEach(phase => {
          progressData[project.id][phase.phase_name] = phase.progress;
        });
      }

      setProjectProgress(progressData);
      console.log('Loaded progress data:', progressData);
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Don't throw error here, let projects load without progress
    }
  };

  // Fetch projects on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchProjects();
  }, [refreshTrigger]);

  // Delete project function (unchanged)
  const deleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/projects?id=${projectId}`);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      alert('Project deleted successfully!');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  const toggleProjectExpansion = (projectId) => {
    const next = new Set(expandedProjects);
    next.has(projectId) ? next.delete(projectId) : next.add(projectId);
    setExpandedProjects(next);
  };

  const getProgressColor = (p) => (p >= 75 ? "#28a745" : p >= 50 ? "#fd7e14" : p >= 30 ? "#dc3545" : "#6c757d");

  const calculateOverallProgress = (project) => {
    const phases = ["Documentation", "Procurement", "Manufacturing", "Testing"];
    const defaults = [0, 0, 0, 0]; // Start with 0 instead of dummy values
    const custom = projectProgress[project.id] || {};
    const values = phases.map((phase, i) => (custom[phase] !== undefined ? custom[phase] : defaults[i]));
    return Math.round(values.reduce((s, v) => s + v, 0) / phases.length);
  };

  const getPhaseProgress = (pid, name, defVal = 0) => projectProgress[pid]?.[name] ?? defVal;

  // Updated progress double click handler
  const handleProgressDoubleClick = (projectId, phaseName, currentProgress) => {
    const project = projects.find(p => p.id === projectId);

    setProgressModal({
      isOpen: true,
      phaseData: {
        id: `${projectId}-${phaseName}`,
        name: phaseName,
        progress: currentProgress,
        remarks: ``, // Load from database if needed
        projectId: projectId,
        projectTitle: project?.project_title || 'Unknown Project'
      }
    });
  };

  // Updated progress update handler
  const handleProgressUpdate = async (updateData) => {
    try {
      const { projectId, phaseName, progress } = updateData;

      // Update local state immediately for UI responsiveness
      setProjectProgress((prev) => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          [phaseName]: progress
        }
      }));

      console.log('Progress updated locally:', updateData);

      // Optionally refresh all progress data
      // await fetchAllProgress(projects);

    } catch (error) {
      console.error('Error in handleProgressUpdate:', error);
    }
  };

  // Rest of your component code remains the same...
  const handleProjectUpdate = async (updatedProject) => {
    try {
      console.log('Handling project update:', updatedProject);
      setProjects(prev => prev.map(p =>
        p.id === updatedProject.id ? { ...p, ...updatedProject } : p
      ));

      if (onProjectEdit) {
        onProjectEdit(updatedProject);
      }

      await fetchProjects();
      console.log('Project update completed successfully');
    } catch (error) {
      console.error('Error in handleProjectUpdate:', error);
      await fetchProjects();
      alert('Failed to update project. Please try again.');
    }
  };

  const handleProjectEdit = (project) => {
    console.log('Opening edit modal for project:', project);
    setEditModal({ isOpen: true, projectData: project });
  };

  const closeEditModal = () => setEditModal({ isOpen: false, projectData: null });
  const closeProgressModal = () => setProgressModal({ isOpen: false, phaseData: null });

  // Loading, error, and empty states remain the same...
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-500 text-lg">Loading projects...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={fetchProjects}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No projects found</div>
        <div className="text-gray-400 text-sm mt-2">Create your first project to get started</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Projects ({projects.length})</h3>
          <button
            onClick={fetchProjects}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {projects.map((project) => {
          const isExpanded = expandedProjects.has(project.id);
          const overall = calculateOverallProgress(project);
          const equipmentCount = project.equipment?.length || 0;
          const phases = ["Documentation", "Procurement", "Manufacturing", "Testing"];

          return (
            <div key={project.id} className="project-card">
              {/* Project header remains same */}
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

              {/* Updated progress section */}
              <div className="progress-section">
                <div className="progress-title">Overall Progress: {overall}%</div>
                <div className="progress-grid">
                  {phases.map((phase, i) => {
                    const pp = getPhaseProgress(project.id, phase, 0);
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

              {/* Rest of project card remains same */}



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
                  <div className="summary-item">
                    <strong>Client Focal Point:</strong>
                    <span>{project.client_focal_point || "Not assigned"}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Total Value:</strong>
                    <span>
                      {project.total_value ? `₹${(Number(project.total_value) / 100000).toFixed(1)}L` : "Not specified"}
                    </span>
                  </div>
                  <div className="summary-item">
                    <strong>Payment Terms:</strong>
                    <span>{project.payment_terms || "Not specified"}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Payment Milestones:</strong>
                    <span>{project.payment_milestones || "Not specified"}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Order Date:</strong>
                    <span>
                      {project.sales_order_date
                        ? new Date(project.sales_order_date).toLocaleDateString('en-IN')
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="summary-item">
                    <strong>Created:</strong>
                    <span>
                      {project.created_at
                        ? new Date(project.created_at).toLocaleDateString('en-IN')
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Project Scope */}
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

                {/* Kickoff Notes */}
                {project.kickoff_notes && (
                  <div className="mt-4">
                    <strong className="text-sm text-gray-700">Kickoff Notes:</strong>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-blue-50 rounded-md border-l-4 border-blue-500">
                      {project.kickoff_notes}
                    </p>
                  </div>
                )}

                {/* Production Notes */}
                {project.production_notes && (
                  <div className="mt-4">
                    <strong className="text-sm text-gray-700">Production Notes:</strong>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-green-50 rounded-md border-l-4 border-green-500">
                      {project.production_notes}
                    </p>
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
                <button
                  className="btn btn-danger"
                  onClick={() => deleteProject(project.id)}
                >
                  Delete
                </button>
                <button className="toggle-btn" onClick={() => toggleProjectExpansion(project.id)}>
                  {isExpanded ? "Show Less" : "Show More"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

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