/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Plus, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { AddWorkspaceModal } from "../components/modals/add-workspace-modal"
import { AddCourseModal } from "../components/modals/add-course-modal"
import { AddBlogModal } from "../components/modals/add-blog-modal"
import { UserMenu } from "../components/auth/user-menu"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { useSupabaseMutations } from "@/hooks/use-supabase-mutations"
import { toast } from "@/hooks/use-toast"
import type { Course, Workspace, Blog } from "@/lib/supabase"
import Image from 'next/image';
import { Building2, BookOpen, Layers3 } from "lucide-react"




type ActiveSection = "courses" | "workspace" | "blogs"

function AdminDashboardContent() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("workspace")
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false)
  const [globalSearchTerm, setGlobalSearchTerm] = useState("")

  // Data hooks for each section
  const coursesData = useSupabaseData<Course>("courses", ["title", "instructor", "category"], 8)
  const workspacesData = useSupabaseData<Workspace>("workspaces", ["name", "location", "address"], 8)
  const blogsData = useSupabaseData<Blog>("blogs", ["title", "author", "category"], 8)

  // Mutation hooks
  const coursesMutations = useSupabaseMutations("courses")
  const workspacesMutations = useSupabaseMutations("workspaces")
  const blogsMutations = useSupabaseMutations("blogs")

  const [editCourse, setEditCourse] = useState<Course | null>(null)
const [editWorkspace, setEditWorkspace] = useState<Workspace | null>(null)
const [editBlog, setEditBlog] = useState<Blog | null>(null)


  // Get current data based on active section
  const currentData = useMemo(() => {
    switch (activeSection) {
      case "courses":
        return coursesData
      case "blogs":
        return blogsData
      default:
        return workspacesData
    }
  }, [activeSection, coursesData, blogsData, workspacesData])

  // Update search term when global search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      currentData.setSearchTerm(globalSearchTerm)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [globalSearchTerm, currentData])

  // Reset search when switching sections
  useEffect(() => {
    setGlobalSearchTerm("")
    currentData.setSearchTerm("")
    currentData.setCurrentPage(1)
  }, [activeSection])

  const handleDelete = async (id: number) => {
    try {
      let mutations
      switch (activeSection) {
        case "courses":
          mutations = coursesMutations
          break
        case "blogs":
          mutations = blogsMutations
          break
        default:
          mutations = workspacesMutations
      }

      await mutations.delete(id)
      toast({
        title: "Success",
        description: `${activeSection.slice(0, -1)} deleted successfully!`,
      })
      currentData.refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const renderContent = () => {
  const { data, loading, pagination } = currentData

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (activeSection === "courses") {
    return (
      <div className="space-y-6 ">
        <div className="flex items-center justify-between">
          <h2 className="text-[#626262] font-semibold">Course info</h2>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center cursor-pointer border-[#E8E8E8]">
                  <span>All Prices</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-[#E8E8E8]">
                <DropdownMenuItem>All Prices</DropdownMenuItem>
                <DropdownMenuItem>Free</DropdownMenuItem>
                <DropdownMenuItem>Under N25,000</DropdownMenuItem>
                <DropdownMenuItem>N25,000 - N50,000</DropdownMenuItem>
                <DropdownMenuItem>Above N50,000</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsCourseModalOpen(true)} className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 border-white border rounded-full" />
              Add Course
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
        {(data as Course[]).map((course) => (
  <div key={course.id} className="bg-white border-[#E8E8E8] rounded-lg shadow-sm border overflow-hidden relative">
    <img
      src={course.thumbnail || "/placeholder.svg?height=200&width=300"}
      alt={course.title}
      className="w-full h-40 object-cover rounded-b-lg"
    />

    <div className="absolute bottom-2 right-2 ">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
            <MoreVertical className="h-4 w-4 " />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="absolute bottom-10 right-0 bg-white border-[#E8E8E8]">
        <DropdownMenuItem onClick={() => {
  setIsCourseModalOpen(true)
  setEditCourse(course) // Add state to hold course being edited
}}>
  Edit
</DropdownMenuItem>

          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(course.id)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div className="p-1.5">
      <h3 className="text-sm text-[#626262] line-clamp-1">{course.title}</h3>
      <p className="text-lg font-semibold text-[#3D3D3D]">{course.price}</p>
    </div>
  </div>
))}

        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
          </p>
          <div className="flex items-center space-x-2">
            <button
            className="border border-[#E8E8E8] rounded p-2 cursor-pointer"
              onClick={() => currentData.setCurrentPage(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
            className="border border-[#E8E8E8] rounded p-2 cursor-pointer"
              onClick={() => currentData.setCurrentPage(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (activeSection === "blogs") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[#626262] font-semibold">Blogs</h2>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center cursor-pointer border-[#E8E8E8]">
                  <span>All Status</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-[#E8E8E8]">
                <DropdownMenuItem>All Status</DropdownMenuItem>
                <DropdownMenuItem>Published</DropdownMenuItem>
                <DropdownMenuItem>Draft</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsBlogModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white">
              <Plus className="w-4 h-4 border-white border rounded-full" />
              Add Blog
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {(data as Blog[]).map((blog) => (
            <div key={blog.id} className="bg-white rounded-lg shadow-sm border border-[#E8E8E8] overflow-hidden relative">
             
                <img
                  src={blog.featured_image || "/placeholder.svg?height=200&width=300"}
                  alt="Blog thumbnail"
                  className="w-full h-40 object-cover rounded-b-lg"
                />
                
             

              <div className="absolute bottom-2 right-2 ">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
            <MoreVertical className="h-4 w-4 " />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="absolute bottom-10 right-0 bg-white border-[#E8E8E8]">
        <DropdownMenuItem onClick={() => {
  setIsCourseModalOpen(true)
  setEditBlog(blog) // Add state to hold course being edited
}}>
  Edit
</DropdownMenuItem>

          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(blog.id)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
              

              <div className="p-1.5">
                <h3 className="text-sm text-[#626262] line-clamp-2">{blog.title}</h3>
                <p className="text-lg font-semibold text-[#3D3D3D]">By {blog.author}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
          </p>
          <div className="flex items-center space-x-2">
            <button
             className="border border-[#E8E8E8] rounded p-2 cursor-pointer"
              onClick={() => currentData.setCurrentPage(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
               className="border border-[#E8E8E8] rounded p-2 cursor-pointer"
              onClick={() => currentData.setCurrentPage(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default: workspaces
  return (
    <div className="space-y-6 border border-[#E8E8E8] rounded-2xl pb-4">
      <div className="flex items-center justify-between bg-[#FAFAFA] rounded-t-2xl p-5">
        <h2 className="text-sm text-[#626262] font-semibold">Workspace</h2>
        <Button onClick={() => setIsWorkspaceModalOpen(true)} className="bg-blue-600 text-sm cursor-pointer hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4  border-white border rounded-full" />
          Add Workspace
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="text-[#626262]">
            <TableHead>Workspace Name</TableHead>
            <TableHead>Pricing</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Working hours</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data as Workspace[]).map((workspace) => (
            <TableRow key={workspace.id}>
              <TableCell className="font-medium text-[#626262]">{workspace.name}</TableCell>
              <TableCell>{workspace.pricing}</TableCell>
              <TableCell>{workspace.location}</TableCell>
              <TableCell>{workspace.address}</TableCell>
              <TableCell>{workspace.working_hours}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-[#E8E8E8]">
                  <DropdownMenuItem onClick={() => {
  setIsCourseModalOpen(true)
  setEditWorkspace(workspace) // Add state to hold course being edited
}}>
  Edit
</DropdownMenuItem>

                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(workspace.id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-5">
        <p className="text-sm text-gray-600">
          Showing {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
        </p>
        <div className="flex items-center space-x-2">
          <button
           className="border border-[#E8E8E8] rounded p-2 cursor-pointer"
            onClick={() => currentData.setCurrentPage(pagination.currentPage - 1)}
            disabled={pagination.currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
          className="border border-[#E8E8E8] rounded p-2 cursor-pointer"
            onClick={() => currentData.setCurrentPage(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}


  const getSearchPlaceholder = () => {
    switch (activeSection) {
      case "courses":
        return "Search courses..."
      case "blogs":
        return "Search blogs..."
      default:
        return "Search workspaces..."
    }
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-[#FAFAFA] shadow-sm">
        <div className="p-6">
          <div className="flex items-center space-x-2">
          <Image
              src="/images/Logo.svg"
              alt="Logo"
              width={60}
              height={40}
              className="w-auto h-auto"
            />
          </div>
        </div>
        <nav className="mt-8 px-4 space-y-2">
          <button
            onClick={() => setActiveSection("courses")}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeSection === "courses" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
              <BookOpen
    className={`w-5 h-5 mr-3 ${
      activeSection === "courses" ? "text-white" : "text-gray-700"
    }`}
  />
            Courses
          </button>
          <button
            onClick={() => setActiveSection("workspace")}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeSection === "workspace" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Building2
    className={`w-5 h-5 mr-3 ${
      activeSection === "workspace" ? "text-white" : "text-gray-700"
    }`}
  />
            Workspace
          </button>
          <button
            onClick={() => setActiveSection("blogs")}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeSection === "blogs" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
             <Layers3
    className={`w-5 h-5 mr-3 ${
      activeSection === "blogs" ? "text-white" : "text-gray-700"
    }`}
  />
            Blogs
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-[#FAFAFA] shadow-sm border-b-[1px] border-[#E8E8E8]">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <div className="relative bg-white">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
  placeholder={getSearchPlaceholder()}
  className="pl-10 bg-white w-96 border border-[#E8E8E8] focus:outline-none focus:ring-0 "
  value={globalSearchTerm}
  onChange={(e) => setGlobalSearchTerm(e.target.value)}
/>

              </div>
            </div>
            <div className="flex items-center space-x-4">
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8">{renderContent()}</main>
      </div>

      {/* Modals */}
      <AddWorkspaceModal
        open={isWorkspaceModalOpen}
        onOpenChange={setIsWorkspaceModalOpen}
        onSuccess={workspacesData.refetch}
      />
      <AddCourseModal
  open={isCourseModalOpen}
  onOpenChange={(open) => {
    setIsCourseModalOpen(open)
    if (!open) setEditCourse(null)
  }}
  onSuccess={coursesData.refetch}
  initialData={editCourse}
/>

      <AddBlogModal open={isBlogModalOpen} onOpenChange={setIsBlogModalOpen} onSuccess={blogsData.refetch} />
    </div>
  )
}

export default function AdminDashboard() {
  return <div className="pt-20"><AdminDashboardContent /></div>
}

