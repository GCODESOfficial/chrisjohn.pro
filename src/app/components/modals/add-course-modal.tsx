/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { ImageUpload } from "../ui/image-upload"
import { useSupabaseMutations } from "@/hooks/use-supabase-mutations"
import { toast } from "@/hooks/use-toast"
import type { Course } from "@/lib/supabase"

interface AddCourseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialData?: Partial<Course> | null
}

export function AddCourseModal({ open, onOpenChange, onSuccess, initialData }: AddCourseModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    instructor: "",
    duration: "",
    price: "",
    discount_price: "",
    category: "",
    level: "",
    description: "",
    prerequisites: "",
    learning_outcomes: "",
    max_students: "",
    start_date: "",
    end_date: "",
    schedule: "",
    thumbnail: "",
    thumbnail_path: "",
  })

  const { loading, create, update } = useSupabaseMutations("courses")

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        instructor: initialData.instructor || "",
        duration: initialData.duration || "",
        price: initialData.price || "",
        discount_price: initialData.discount_price || "",
        category: initialData.category || "",
        level: initialData.level || "",
        description: initialData.description || "",
        prerequisites: initialData.prerequisites || "",
        learning_outcomes: initialData.learning_outcomes || "",
        max_students: initialData.max_students?.toString() || "",
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
        schedule: initialData.schedule || "",
        thumbnail: initialData.thumbnail || "",
        thumbnail_path: initialData.thumbnail_path || "",
      })
    } else {
      setFormData({
        title: "",
        instructor: "",
        duration: "",
        price: "",
        discount_price: "",
        category: "",
        level: "",
        description: "",
        prerequisites: "",
        learning_outcomes: "",
        max_students: "",
        start_date: "",
        end_date: "",
        schedule: "",
        thumbnail: "",
        thumbnail_path: "",
      })
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const dataToSubmit = {
        ...formData,
        max_students: formData.max_students ? Number(formData.max_students) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      }

      if (initialData?.id) {
        await update(initialData.id, dataToSubmit)
        toast({
          title: "Success",
          description: "Course updated successfully!",
        })
      } else {
        await create(dataToSubmit)
        toast({
          title: "Success",
          description: "Course created successfully!",
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleThumbnailChange = (url: string, path?: string) => {
    setFormData((prev) => ({
      ...prev,
      thumbnail: url,
      thumbnail_path: path || "",
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] bg-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Course" : "Add New Course"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the course details below."
              : "Create a new course for your platform. Fill in all the required details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_price">Discount Price</Label>
              <Input
                id="discount_price"
                value={formData.discount_price}
                onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_students">Max Students</Label>
              <Input
                id="max_students"
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="ai">Artificial Intelligence</SelectItem>
                  <SelectItem value="dev">Development</SelectItem>
                  <SelectItem value="pm">Project Management</SelectItem>
                  <SelectItem value="marketing">Marketing & Communication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={formData.level}
                onValueChange={(value: any) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule</Label>
            <Input
              id="schedule"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
            />
          </div>

          <ImageUpload
            label="Course Thumbnail"
            value={formData.thumbnail}
            onChange={handleThumbnailChange}
            folder="courses"
          />

          <div className="space-y-2">
            <Label htmlFor="description">Course Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prerequisites">Prerequisites</Label>
            <Textarea
              id="prerequisites"
              value={formData.prerequisites}
              onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="learning_outcomes">Learning Outcomes</Label>
            <Textarea
              id="learning_outcomes"
              value={formData.learning_outcomes}
              onChange={(e) => setFormData({ ...formData, learning_outcomes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading
                ? initialData?.id
                  ? "Updating..."
                  : "Creating..."
                : initialData?.id
                ? "Update Course"
                : "Add Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
