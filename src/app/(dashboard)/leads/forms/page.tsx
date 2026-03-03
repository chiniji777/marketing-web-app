"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import {
  FileText,
  Plus,
  MoreHorizontal,
  Trash2,
  Copy,
  Eye,
  GripVertical,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { getLeadForms, createLeadForm, deleteLeadForm } from "@/server/actions/lead"

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
]

type FieldType = "text" | "email" | "phone" | "textarea" | "select" | "checkbox"

interface FormField {
  name: string
  label: string
  type: FieldType
  required: boolean
  options?: string[]
}

interface LeadForm {
  id: string
  name: string
  description: string | null
  fields: unknown
  submissions: number
  isActive: boolean
  thankYouMessage: string | null
  redirectUrl: string | null
  createdAt: string
}

export default function LeadFormsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [forms, setForms] = useState<LeadForm[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [thankYouMessage, setThankYouMessage] = useState("Thank you for your submission!")
  const [redirectUrl, setRedirectUrl] = useState("")
  const [fields, setFields] = useState<FormField[]>([
    { name: "firstName", label: "First Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
  ])

  const fetchForms = useCallback(async () => {
    try {
      const data = await getLeadForms()
      setForms(data as unknown as LeadForm[])
    } catch {
      toast.error("Failed to load forms")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchForms()
  }, [fetchForms])

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { name: `field_${prev.length}`, label: "", type: "text", required: false },
    ])
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)))
  }

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error("Form name is required")
      return
    }
    if (fields.length === 0) {
      toast.error("Add at least one field")
      return
    }
    const invalidFields = fields.filter((f) => !f.label.trim())
    if (invalidFields.length > 0) {
      toast.error("All fields must have a label")
      return
    }
    try {
      await createLeadForm({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        fields: fields.map((f) => ({
          ...f,
          name: f.name || f.label.toLowerCase().replace(/\s+/g, "_"),
        })),
        thankYouMessage: thankYouMessage.trim() || undefined,
        redirectUrl: redirectUrl.trim() || undefined,
      })
      toast.success("Form created")
      setShowCreateDialog(false)
      setFormName("")
      setFormDescription("")
      setThankYouMessage("Thank you for your submission!")
      setRedirectUrl("")
      setFields([
        { name: "firstName", label: "First Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
      ])
      fetchForms()
    } catch {
      toast.error("Failed to create form")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteLeadForm(id)
      toast.success("Form deleted")
      fetchForms()
    } catch {
      toast.error("Failed to delete form")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Lead Forms" description="Create and manage lead capture forms" backHref="/leads">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Form</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Lead Capture Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Form Name *</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Contact Us Form" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} placeholder="Brief description of this form" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Form Fields</Label>
                  <Button variant="outline" size="sm" onClick={addField}>
                    <Plus className="mr-2 h-3 w-3" />Add Field
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <GripVertical className="mt-2 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 space-y-3">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <Input
                              placeholder="Field label"
                              value={field.label}
                              onChange={(e) => updateField(index, { label: e.target.value })}
                            />
                            <Select value={field.type} onValueChange={(v) => updateField(index, { type: v as FieldType })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {FIELD_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={field.required}
                                onCheckedChange={(checked) => updateField(index, { required: checked })}
                              />
                              <Label className="text-sm">Required</Label>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeField(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Thank You Message</Label>
                  <Input value={thankYouMessage} onChange={(e) => setThankYouMessage(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Redirect URL (optional)</Label>
                  <Input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full">Create Form</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {forms.length === 0 ? (
        <EmptyState icon={FileText} title="No forms yet" description="Create embeddable forms to capture leads from your website">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />Create Form
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => {
            const formFields = Array.isArray(form.fields) ? form.fields : []
            return (
              <Card key={form.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{form.name}</CardTitle>
                      {form.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(form.id)}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant={form.isActive ? "default" : "secondary"}>
                        {form.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span>{formFields.length} fields</span>
                      <span>·</span>
                      <span>{form.submissions} submissions</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(form.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
