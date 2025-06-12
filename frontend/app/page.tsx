"use client"

import type React from "react"
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, FolderOpen, Calendar, ArrowRight, Trash2 } from "lucide-react"
import SystemDynamicsModeller from "./components/system-dynamics-modeller"

const API_URL = "http://127.0.0.1:2000"

interface Project {
  id: string
  name: string
  createdAt?: string
  lastModified?: string
}

export default function HomePage() {
  const [currentView, setCurrentView] = useState<"projects" | "modeller">("projects")
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [newProjectName, setNewProjectName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects`)
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        const now = new Date().toISOString()
        setProjects(
          data.data.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            createdAt: now,
            lastModified: now,
          }))
        )
      }
    } catch (err) {
      console.error("Failed to fetch projects", err)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const createProject = async () => {
    if (!newProjectName.trim()) return
    try {
      await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName.trim() }),
      })
      setNewProjectName("")
      setIsCreating(false)
      fetchProjects()
    } catch (err) {
      console.error("Failed to create project", err)
    }
  }

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
  }

  const openProject = (project: Project) => {
    setCurrentProject(project)
    setCurrentView("modeller")
    // Update last modified time
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, lastModified: new Date().toISOString() } : p)))
  }

  const backToProjects = () => {
    setCurrentView("projects")
    setCurrentProject(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      createProject()
    }
    if (e.key === "Escape") {
      setIsCreating(false)
      setNewProjectName("")
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (currentView === "modeller" && currentProject) {
    return <SystemDynamicsModeller project={currentProject} onBack={backToProjects} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Dynamics Studio</h1>
              <p className="text-gray-600 mt-1">Create and manage your system dynamics models</p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {projects.length} {projects.length === 1 ? "Project" : "Projects"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Create Project Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Create New Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCreating ? (
              <div className="flex items-center space-x-3">
                <Input
                  placeholder="Enter project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={createProject} disabled={!newProjectName.trim()}>
                  Create
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsCreating(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group border-2 hover:border-blue-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteProject(project.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Created: {formatDate(project.createdAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      <span>Modified: {formatDate(project.lastModified)}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    variant="outline"
                    onClick={() => openProject(project)}
                  >
                    Open Project
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="max-w-md mx-auto">
                <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first System Dynamics project to get started with modeling complex systems.
                </p>
                <Button onClick={() => setIsCreating(true)} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="mt-16 border-t bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-600">
            <p>System Dynamics Studio - Build, simulate, and analyze complex systems</p>
          </div>
        </div>
      </div>
    </div>
  )
}
