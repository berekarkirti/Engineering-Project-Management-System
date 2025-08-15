"use client"

import { useState, useEffect } from "react"

import SummaryCards from "./SummaryCards"
import ProjectFilters from "./ProjectFilters"
import ProjectGrid from "./ProjectGrid"
import ProjectDetailModal from "./ProjectDetailModal"
import { AddProjectModal } from "./AddProjectModal"
import ClientViewModal from "./ClientViewModal"
import SalesOverview from "./SalesOverview"

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [showProjectDetail, setShowProjectDetail] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showClientView, setShowClientView] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    client: "",
    equipment: "",
    status: "",
    manager: "",
  })

  const debugInfo = {
    showProjectDetail,
    showClientView,
    showAddProject,
    selectedProject: selectedProject?.project_title || 'null',
    projectsCount: projects.length,
    loading
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    filterProjects()
  }, [projects, searchTerm, filters])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setProjects(data || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
      setProjects([
        {
          id: 1,
          project_title: "Test Project 1",
          po_number: "PO-001",
          client_name: "Test Client",
          sales_order_date: "2024-01-01",
          total_value: 1000000
        }
      ])
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <p className="ml-4">Loading Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">


    

      <div className="max-w-7xl mx-auto px-8 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Business Overview</h2>
        <SummaryCards projects={projects} />

        <h2 className="text-2xl font-semibold text-gray-900 mb-6 mt-8">Sales Overview</h2>
        <SalesOverview />

        <ProjectFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFiltersChange={setFilters}
          onAddProject={handleAddProject}
        />

        {/* No onProjectEdit prop required; ProjectGrid handles its own Edit modal */}
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
