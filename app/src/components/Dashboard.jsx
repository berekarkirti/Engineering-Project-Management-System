"use client"

import { useState, useEffect } from "react"

import SummaryCards from "./SummaryCards"
import ProjectFilters from "./ProjectFilters"
import ProjectGrid from "./ProjectGrid"
import ProjectDetailModal from "./ProjectDetailModal"
import { AddProjectModal } from "./AddProjectModal"
import ClientViewModal from "./ClientViewModal"
import SalesOverview from "./SalesOverview"
import OrganizationSetup from "./OrganizationSetup"

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
  const [currentOrganization, setCurrentOrganization] = useState(null)
  const [showOrgSetup, setShowOrgSetup] = useState(false)
  const [filters, setFilters] = useState({
    client: "",
    equipment: "",
    status: "",
    manager: "",
  })

  // Initialize organization on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedOrgId = window.localStorage.getItem("current_org_id") || ""
      
      if (storedOrgId && isValidUUID(storedOrgId)) {
        setCurrentOrgId(storedOrgId)
        // Fetch organization details
        fetchOrganizationDetails(storedOrgId)
      } else {
        setShowOrgSetup(true)
        setLoading(false)
      }
    }
  }, [])



  useEffect(() => {
    if (currentOrgId) {
      fetchProjects()
    }
  }, [currentOrgId])

  useEffect(() => {
    filterProjects()
  }, [projects, searchTerm, filters])

  const fetchOrganizationDetails = async (orgId) => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const organizations = await response.json()
        const currentOrg = organizations.find(org => 
          org.organizations.id === orgId
        )
        if (currentOrg) {
          setCurrentOrganization(currentOrg.organizations)
        } else {
          // Organization not found, show setup
          setShowOrgSetup(true)
        }
      }
    } catch (error) {
      console.error("Error fetching organization details:", error)
      setShowOrgSetup(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      // Get org_id from state
      const orgId = currentOrgId
      

      
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

      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-org-id": orgId,
        },
      })



      if (!response.ok) {
        const errorData = await response.text()
        console.error("API Error Response:", errorData)
        
        if (response.status === 400) {
          throw new Error(`Bad Request: ${errorData}. Check if org_id is being sent correctly.`)
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${errorData}`)
      }
      
      const data = await response.json()

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

  const handleOrganizationSet = (organization) => {
    setCurrentOrganization(organization)
    setCurrentOrgId(organization.id)
    setShowOrgSetup(false)
    setLoading(true)
    // Will trigger fetchProjects via useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <p className="ml-4">Loading Dashboard...</p>
      </div>
    )
  }

  // Show organization setup if needed
  if (showOrgSetup) {
    return <OrganizationSetup onOrganizationSet={handleOrganizationSet} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-8 py-8">


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