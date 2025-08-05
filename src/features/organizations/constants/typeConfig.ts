import {
  Building2,
  UsersIcon,
  MapPin,
  Landmark,
  HeartPulse,
  Briefcase,
  Handshake,
  Layers,
  FolderKanban,
  Lightbulb,
  HelpCircle,
} from 'lucide-react'

export const typeConfig = {
  higher_education_institution: {
    label: 'Higher Education Institution',
    icon: Landmark,
  },
  government_agency: {
    label: 'Government Agency',
    icon: Landmark,
  },
  healthcare_system: {
    label: 'Healthcare System',
    icon: HeartPulse,
  },
  corporate_enterprise: {
    label: 'Corporate Enterprise',
    icon: Briefcase,
  },
  nonprofit_organization: {
    label: 'Nonprofit Organization',
    icon: Handshake,
  },
  other: {
    label: 'Other (please specify)',
    icon: HelpCircle,
  },

  division: {
    label: 'Division',
    icon: Layers,
  },
  school_faculty: {
    label: 'School/Faculty',
    icon: UsersIcon,
  },
  department: {
    label: 'Department',
    icon: MapPin,
  },
  office: {
    label: 'Office',
    icon: Building2,
  },
  program: {
    label: 'Program',
    icon: FolderKanban,
  },
  initiative: {
    label: 'Initiative',
    icon: Lightbulb,
  },
} as const
