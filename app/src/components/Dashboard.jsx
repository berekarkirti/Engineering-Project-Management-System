"use client"

import { useState, useEffect } from "react"

import SummaryCards from "./SummaryCards"
import ProjectFilters from "./ProjectFilters"
import ProjectGrid from "./ProjectGrid"
import ProjectDetailModal from "./ProjectDetailModal"
import { AddProjectModal } from "./AddProjectModal"
import ClientViewModal from "./ClientViewModal"
import SalesOverview from "./SalesOverview"

// Utility function to generate a valid UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Utility function to validate UUID format
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [showProjectDetail, setShowProjectDetail] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showClientView, setShowClientView] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentOrgId, setCurrentOrgId] = useState("")
  const [filters, setFilters] = useState({
    client: "",
    equipment: "",
    status: "",
    manager: "",
  })

  // Initialize currentOrgId on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let storedOrgId = window.localStorage.getItem("current_org_id") || ""
      
      // Check if stored org_id is valid UUID format
      if (storedOrgId && !isValidUUID(storedOrgId)) {
        console.log(`Invalid UUID format found: ${storedOrgId}, generating new one`)
        storedOrgId = generateUUID()
        window.localStorage.setItem("current_org_id", storedOrgId)
      }
      
      setCurrentOrgId(storedOrgId)
    }
  }, [])

  const debugInfo = {
    showProjectDetail,
    showClientView,
    showAddProject,
    selectedProject: selectedProject?.project_title || 'null',
    projectsCount: projects.length,
    loading,
    currentOrgId
  }

  useEffect(() => {
    if (currentOrgId) {
      fetchProjects()
    }
  }, [currentOrgId])

  useEffect(() => {
    filterProjects()
  }, [projects, searchTerm, filters])

  const fetchProjects = async () => {
    try {
      // Get org_id from state
      const orgId = currentOrgId
      
      console.log("Fetching projects with org_id:", orgId) // Debug log
      
      if (!orgId) {
        console.error("No organization ID found. User must belong to an organization.")
        setLoading(false)
        return
      }

      // Validate UUID format before making API call
      if (!isValidUUID(orgId)) {
        console.error("Invalid UUID format:", orgId)
        // Generate a new valid UUID
        const newOrgId = generateUUID()
        window.localStorage.setItem("current_org_id", newOrgId)
        setCurrentOrgId(newOrgId)
        setLoading(false)
        return
      }

      const url = `/api/projects?org_id=${orgId}`
      console.log("Making request to:", url) // Debug log
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-org-id": orgId,
        },
      })

      console.log("Response status:", response.status) // Debug log
      console.log("Response ok:", response.ok) // Debug log

      if (!response.ok) {
        const errorData = await response.text()
        console.error("API Error Response:", errorData)
        
        if (response.status === 400) {
          throw new Error(`Bad Request: ${errorData}. Check if org_id is being sent correctly.`)
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${errorData}`)
      }
      
      const data = await response.json()
      console.log("Received data:", data) // Debug log
      setProjects(data || [])
      
    } catch (error) {
      console.error("Error fetching projects:", error)
      const errorMessage = error.message || "Failed to fetch projects. Please try again."
      alert(`Error: ${errorMessage}\n\norg_id being used: ${currentOrgId}`)
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = projects

    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.project_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filters.client) {
      filtered = filtered.filter((project) => 
        project.client_name?.toLowerCase().includes(filters.client.toLowerCase())
      )
    }

    if (filters.manager) {
      filtered = filtered.filter((project) =>
        project.project_manager?.toLowerCase().includes(filters.manager.toLowerCase()),
      )
    }

    setFilteredProjects(filtered)
  }

  const handleProjectSelect = (project) => {
    if (project) {
      setSelectedProject(project)
      setShowProjectDetail(true)
      setShowClientView(false)
      setShowAddProject(false)
    }
  }

  const handleClientView = (project) => {
    if (project) {
      setSelectedProject(project)
      setShowClientView(true)
      setShowProjectDetail(false)
      setShowAddProject(false)
    }
  }

  const handleAddProject = () => {
    setShowAddProject(true)
    setShowProjectDetail(false)
    setShowClientView(false)
    setSelectedProject(null)
  }

  const handleProjectAdded = () => {
    fetchProjects()
    setShowAddProject(false)
  }

  const handleCloseProjectDetail = () => {
    setShowProjectDetail(false)
    setSelectedProject(null)
  }

  const handleCloseClientView = () => {
    setShowClientView(false)
    setSelectedProject(null)
  }

  const handleCloseAddProject = () => {
    setShowAddProject(false)
  }

  // Function to set up organization with proper UUID
  const setupOrganization = () => {
    const newOrgId = generateUUID()
    window.localStorage.setItem("current_org_id", newOrgId)
    setCurrentOrgId(newOrgId)
    console.log("Generated new org_id:", newOrgId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <p className="ml-4">Loading Dashboard...</p>
      </div>
    )
  }

  // Show organization selection if no org_id
  if (!currentOrgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Select Organization</h2>
          <p className="text-gray-600 mb-6">
            You need to select an organization to view the dashboard.
          </p>
          <div className="space-y-3">
            <button 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={setupOrganization}
            >
              Generate Organization ID
            </button>
            <a 
              className="block text-center w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              href="/organizations/new"
            >
              Create New Organization
            </a>
          </div>
          
          {/* Debug info for development */}
          <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Debug Info:</strong>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Organization ID Display for debugging */}
        <div className="mb-4 p-2 bg-blue-50 rounded text-sm text-blue-700">
          <strong>Current Organization ID:</strong> {currentOrgId}
          <button 
            onClick={() => {
              navigator.clipboard.writeText(currentOrgId)
              alert("Organization ID copied to clipboard!")
            }}
            className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded hover:bg-blue-300"
          >
            Copy
          </button>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Business Overview</h2>
        <SummaryCards projects={projects} />

        <h2 className="text-2xl font-semibold text-gray-900 mb-6 mt-8">Sales Overview</h2>
        <SalesOverview projects={projects} />

        <ProjectFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFiltersChange={setFilters}
          onAddProject={handleAddProject}
          projects={projects}
        />

        <ProjectGrid
          projects={filteredProjects}
          onProjectSelect={handleProjectSelect}
          onClientView={handleClientView}
        />
      </div>

      {showProjectDetail && selectedProject && (
        <ProjectDetailModal 
          project={selectedProject} 
          onClose={handleCloseProjectDetail} 
        />
      )}

      {showAddProject && (
        <AddProjectModal 
          isOpen={showAddProject}
          onClose={handleCloseAddProject} 
          onProjectAdded={handleProjectAdded} 
        />
      )}

      {showClientView && selectedProject && (
        <ClientViewModal 
          project={selectedProject} 
          onClose={handleCloseClientView} 
        />
      )}
    </div>
  )
}