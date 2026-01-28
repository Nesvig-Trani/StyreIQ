import { CollectionConfig } from 'payload'
import {
  createTenant,
  getAggregateMetrics,
  getSelectedTenant,
  getTenantMetrics,
  selectTenant,
  updateGovernanceSettings,
} from '../endpoints'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    description: 'Organizations using the platform (universities, government, etc.)',
    group: 'System',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => false,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Organization Name',
      admin: {
        description: 'e.g., University of North Carolina, Virginia Commonwealth University',
      },
    },
    {
      name: 'domain',
      type: 'text',
      required: true,
      unique: true,
      label: 'Domain',
      admin: {
        description: 'e.g., unc.edu, vcu.edu',
      },
    },
    {
      name: 'adminContactName',
      type: 'text',
      required: true,
      label: 'Admin Contact Name',
      admin: {
        description: 'Primary contact for this organization',
      },
    },
    {
      name: 'adminContactEmail',
      type: 'email',
      required: true,
      label: 'Admin Contact Email',
      admin: {
        description: 'Primary contact for this organization',
      },
    },
    {
      name: 'primaryUnit',
      type: 'relationship',
      relationTo: 'organization',
      label: 'Primary Unit',
      admin: {
        description: 'Main unit created automatically for this tenant',
        position: 'sidebar',
      },
    },
    {
      name: 'enabledTrainings',
      type: 'array',
      label: 'Enabled Trainings',
      admin: {
        description:
          'Configure which trainings are enabled for this tenant based on their contract',
      },
      defaultValue: [
        {
          trainingId: 'training-governance',
          assignedRoles: ['social_media_manager', 'unit_admin'],
        },
        {
          trainingId: 'training-risk',
          assignedRoles: ['social_media_manager', 'unit_admin'],
        },
        {
          trainingId: 'training-leadership',
          assignedRoles: ['unit_admin'],
        },
      ],
      fields: [
        {
          name: 'trainingId',
          type: 'select',
          required: true,
          label: 'Training',
          options: [
            {
              label: 'Social Media Governance Essentials: Accessibility, Compliance & Risk',
              value: 'training-governance',
            },
            {
              label: 'Social Media Risk Mitigation',
              value: 'training-risk',
            },
            {
              label: 'A Leadership Guide to Social Media Crisis Management',
              value: 'training-leadership',
            },
          ],
        },
        {
          name: 'assignedRoles',
          type: 'select',
          hasMany: true,
          required: true,
          label: 'Assigned Roles',
          admin: {
            description: 'Roles that should automatically receive this training',
          },
          options: [
            { label: 'Social Media Manager', value: 'social_media_manager' },
            { label: 'Unit Admin', value: 'unit_admin' },
            { label: 'Central Admin', value: 'central_admin' },
          ],
        },
      ],
    },
    {
      name: 'governanceSettings',
      type: 'group',
      label: 'Governance Settings',
      fields: [
        {
          name: 'policyReminderDays',
          type: 'array',
          label: 'Policy Reminder Cadence (Days)',
          defaultValue: [{ day: 3 }, { day: 7 }, { day: 14 }],
          admin: {
            description: 'Days after policy assignment to send reminders',
          },
          fields: [
            {
              name: 'day',
              type: 'number',
              required: true,
              min: 1,
            },
          ],
        },

        {
          name: 'trainingEscalationDays',
          type: 'array',
          label: 'Training Escalation Cadence (Days)',
          defaultValue: [{ day: 15 }, { day: 30 }, { day: 45 }],
          admin: {
            description: 'Days after training assignment to escalate',
          },
          fields: [
            {
              name: 'day',
              type: 'number',
              required: true,
              min: 1,
            },
          ],
        },

        {
          name: 'rollCallFrequency',
          type: 'select',
          label: 'Roll Call Frequency',
          defaultValue: 'quarterly',
          options: [
            { label: 'Monthly', value: 'monthly' },
            { label: 'Quarterly', value: 'quarterly' },
            { label: 'Semi-Annual', value: 'semiannual' },
            { label: 'Annual', value: 'annual' },
          ],
        },

        {
          name: 'passwordRotationDays',
          type: 'number',
          label: 'Password Rotation (Days)',
          defaultValue: 90,
          min: 30,
          max: 365,
          admin: {
            description: 'Force password change every N days',
          },
        },
        {
          name: 'userPasswordCadenceDays',
          type: 'number',
          label: 'User Password Confirmation Cadence (Days)',
          defaultValue: 180,
          min: 30,
          max: 365,
          admin: {
            description: 'Days between user password confirmation tasks (default: 180)',
          },
        },
        {
          name: 'sharedPasswordCadenceDays',
          type: 'number',
          label: 'Shared Password Confirmation Cadence (Days)',
          defaultValue: 180,
          min: 30,
          max: 365,
          admin: {
            description: 'Days between shared password confirmation tasks (default: 180)',
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      required: true,
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Suspended',
          value: 'suspended',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'metadata',
      type: 'group',
      label: 'Additional Info',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'timezone',
          type: 'select',
          label: 'Timezone',
          defaultValue: 'America/New_York',
          options: [
            { label: 'Eastern Time', value: 'America/New_York' },
            { label: 'Central Time', value: 'America/Chicago' },
            { label: 'Mountain Time', value: 'America/Denver' },
            { label: 'Pacific Time', value: 'America/Los_Angeles' },
          ],
        },

        {
          name: 'notes',
          type: 'textarea',
          label: 'Internal Notes',
          admin: {
            description: 'Admin-only notes about this tenant',
          },
        },
      ],
    },
  ],
  timestamps: true,
  endpoints: [
    getAggregateMetrics,
    updateGovernanceSettings,
    getTenantMetrics,
    createTenant,
    selectTenant,
    getSelectedTenant,
  ],
}
