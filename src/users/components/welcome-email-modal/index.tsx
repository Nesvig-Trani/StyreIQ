'use client'
import { createWelcomeEmail } from '@/sdk/users'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  useLoading,
} from '@/shared'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Edit3Icon, LockIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { WelcomeEmailSchema } from '@/users/schemas'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function WelcomeEmailModal({ email }: { email: WelcomeEmailSchema }) {
  const [open, setOpen] = useState(false)
  const [template, setTemplate] = useState(email)

  const [newResponsibility, setNewResponsibility] = useState('')
  const [newPolicyTitle, setNewPolicyTitle] = useState('')
  const [newPolicyUrl, setNewPolicyUrl] = useState('')
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useLoading()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      startLoading()
      await createWelcomeEmail({
        instructions: template.instructions,
        responsibilities: template.responsibilities?.map((r) => {
          return { responsibility: r.responsibility }
        }),
        policyLinks: template?.policyLinks?.map((p) => {
          return {
            title: p.title,
            url: p.url,
          }
        }),
      })
      setOpen(false)
      toast.success('Welcome email updated successfully')
      router.refresh()
    } catch {
      toast.error('An error occurred while updating welcome email, please try again')
    } finally {
      stopLoading()
    }
  }

  const resetForm = () => {
    setTemplate(email)
    setNewResponsibility('')
    setNewPolicyTitle('')
    setNewPolicyUrl('')
  }

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setTemplate((prev) => ({
        ...prev,
        responsibilities: [
          ...(prev.responsibilities ?? []),
          { responsibility: newResponsibility.trim() },
        ],
      }))
      setNewResponsibility('')
    }
  }

  const removeResponsibility = (index: number) => {
    setTemplate((prev) => ({
      ...prev,
      responsibilities: (prev.responsibilities ?? []).filter((_, i) => i !== index),
    }))
  }

  const addPolicyLink = () => {
    if (newPolicyTitle.trim() && newPolicyUrl.trim()) {
      const newPolicy = {
        id: Date.now().toString(),
        title: newPolicyTitle.trim(),
        url: newPolicyUrl.trim(),
      }
      setTemplate((prev) => ({
        ...prev,
        policyLinks: [...(prev.policyLinks ?? []), newPolicy],
      }))
      setNewPolicyTitle('')
      setNewPolicyUrl('')
    }
  }

  const removePolicyLink = (id: string) => {
    setTemplate((prev) => ({
      ...prev,
      policyLinks: (prev.policyLinks ?? []).filter((policy) => policy.id !== id),
    }))
  }

  const updatePolicyLink = (index: string, field: 'title' | 'url', value: string) => {
    setTemplate((prev) => ({
      ...prev,
      policyLinks: (prev.policyLinks ?? []).map((policy) =>
        policy.id === index ? { ...policy, [field]: value } : policy,
      ),
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Welcome Email
        </Button>
      </DialogTrigger>
      <DialogContent className="!min-w-[1000px] !max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User Welcome Email Template</DialogTitle>
          <DialogDescription>
            Customize the activation email content. Welcome message and system access link are fixed
            and cannot be modified.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Email Preview</h3>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Subject: Welcome to the System - Account Activation Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-2">
                  <LockIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium !mt-0">Welcome User</p>
                    <p className="text-muted-foreground">
                      Hello {'{{Username}}'}, welcome to StyreIq!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <LockIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium !mt-0">System Access Link</p>
                    <p className="text-muted-foreground">
                      Link to dashboard:{' '}
                      <span className="text-blue-600 underline">{'{{activationLink}}'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Edit3Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-primary !mt-0">Instructions</p>
                    <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-200">
                      <p className="whitespace-pre-wrap">{template?.instructions}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Edit3Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-primary !mt-0">List of Responsibilities</p>
                    <div className="bg-green-50 p-3 rounded border-l-4 border-green-200">
                      <ul className="list-disc list-inside space-y-1">
                        {template?.responsibilities?.map((responsibility, index) => (
                          <li key={index}>{responsibility.responsibility}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Edit3Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-primary !mt-0">Required Policies and Training</p>
                    <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-200 space-y-1">
                      {template?.policyLinks?.map((policy) => (
                        <p key={policy.id}>
                          • <span className="text-blue-600 underline">{policy.title}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-6">
                  <div className="flex items-start gap-2">
                    <LockIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground !mt-0">
                      If you have any questions or need assistance, please reach out to your manager
                      or the support team.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold !mt-0">Edit Email Content</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="instructions" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                  <TabsTrigger value="responsibilities">Responsibilities</TabsTrigger>
                  <TabsTrigger value="policies">Policies</TabsTrigger>
                </TabsList>

                <TabsContent value="instructions" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions for New Users</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Enter instructions for new users..."
                      value={template?.instructions}
                      onChange={(e) =>
                        setTemplate((prev) => ({ ...prev, instructions: e.target.value }))
                      }
                      className="min-h-[200px] resize-y"
                      required
                    />
                  </div>
                </TabsContent>

                <TabsContent value="responsibilities" className="space-y-4">
                  <div className="space-y-2">
                    <Label>User Responsibilities</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new responsibility..."
                        value={newResponsibility}
                        onChange={(e) => setNewResponsibility(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addResponsibility()
                          }
                        }}
                      />
                      <Button type="button" onClick={addResponsibility} size="sm">
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {template?.responsibilities?.map((responsibility, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <span className="flex-1 text-sm">{responsibility.responsibility}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeResponsibility(index)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="policies" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Required Policies and Training Links</Label>
                    <div className="grid grid-cols-1 gap-2">
                      <Input
                        placeholder="Policy/Training title..."
                        value={newPolicyTitle}
                        onChange={(e) => setNewPolicyTitle(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="URL..."
                          value={newPolicyUrl}
                          onChange={(e) => setNewPolicyUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addPolicyLink()
                            }
                          }}
                        />
                        <Button type="button" onClick={addPolicyLink} size="sm">
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {template?.policyLinks?.map((policy, index) => (
                        <div key={index} className="p-3 bg-muted rounded space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={policy.title}
                              onChange={(e) =>
                                updatePolicyLink(policy.id || '', 'title', e.target.value)
                              }
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePolicyLink(policy.id || '')}
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                          <Input
                            value={policy.url}
                            onChange={(e) =>
                              updatePolicyLink(policy.id || '', 'url', e.target.value)
                            }
                            placeholder="URL..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2">Fixed Email Sections</h4>
                <p className="text-sm text-amber-700">
                  The following sections are automatically included and cannot be modified:
                </p>
                <ul className="text-sm text-amber-700 list-disc list-inside mt-2 space-y-1">
                  <li>Welcome message with user&#39;s name</li>
                  <li>System access link</li>
                  <li>Contact information</li>
                </ul>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isLoading}>
                  Save Template
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
