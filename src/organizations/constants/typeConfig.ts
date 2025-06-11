import { Building2, UsersIcon, MapPin } from "lucide-react";

export const typeConfig = {
  university: { label: 'University', icon: Building2 },
  faculty: { label: 'Faculty', icon: UsersIcon },
  department: { label: 'Department', icon: MapPin },
  office: { label: 'Office', icon: UsersIcon },
  project: { label: 'Project', icon: MapPin },
} as const

