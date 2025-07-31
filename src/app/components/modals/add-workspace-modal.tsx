"use client"

import type React from "react"

import { useState } from "react"
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
import { MultipleImageUpload } from "../ui/multiple-image-upload"
import { useSupabaseMutations } from "@/hooks/use-supabase-mutations"
import { toast } from "@/hooks/use-toast"

interface AddWorkspaceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddWorkspaceModal({ open, onOpenChange, onSuccess }: AddWorkspaceModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    pricing: "",
    location: "",
    address: "",
    working_hours: "",
    description: "",
    amenities: "",
    capacity: "",
    contact_email: "",
    contact_phone: "",
    images: [] as string[],
    image_paths: [] as string[],
  })

  const { loading, create } = useSupabaseMutations("workspaces")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const dataToSubmit = {
        ...formData,
        capacity: formData.capacity ? Number.parseInt(formData.capacity) : null,
      }

      await create(dataToSubmit)

      toast({
        title: "Success",
        description: "Workspace created successfully!",
      })

      onOpenChange(false)
      onSuccess?.()

      // Reset form
      setFormData({
        name: "",
        pricing: "",
        location: "",
        address: "",
        working_hours: "",
        description: "",
        amenities: "",
        capacity: "",
        contact_email: "",
        contact_phone: "",
        images: [],
        image_paths: [],
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create workspace",
        variant: "destructive",
      })
    }
  }

  const handleImagesChange = (urls: string[], paths?: string[]) => {
    setFormData({
      ...formData,
      images: urls,
      image_paths: paths || [],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] bg-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Workspace</DialogTitle>
          <DialogDescription>Fill in the details to add a new workspace to your platform.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter workspace name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricing">Pricing</Label>
              <Input
                id="pricing"
                value={formData.pricing}
                onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                placeholder="e.g., N2,500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Uyo, Akwa Ibom"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Number of people"
                type="number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Full Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Complete address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="working_hours">Working Hours</Label>
            <Input
              id="working_hours"
              value={formData.working_hours}
              onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
              placeholder="e.g., 08:00AM - 10:00PM"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the workspace..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amenities">Amenities</Label>
            <Textarea
              id="amenities"
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              placeholder="List available amenities (WiFi, AC, Parking, etc.)"
              rows={2}
            />
          </div>

          <MultipleImageUpload
            label="Workspace Images"
            values={formData.images}
            onChange={handleImagesChange}
            folder="workspaces"
            maxFiles={5}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@workspace.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+234 xxx xxx xxxx"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Creating..." : "Add Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
