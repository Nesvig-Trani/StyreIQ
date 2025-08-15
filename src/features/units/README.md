# Organizations Module

This module manages organization-related functionality, including hierarchical organization management and access control.

## Structure

```
organizations/
├── components/                    # UI Components
│   ├── create-organization-form/  # Form for creating organizations
│   ├── disable-organization/      # Disable organization dialog
│   ├── org-form/                  # Organization form components
│   ├── org-hierarchy/             # Hierarchy display
│   ├── org-tree/                  # Tree visualization
│   ├── organization-detail/       # Organization detail view
│   ├── organization-table/        # Table listing organizations
│   ├── organizations-cell/        # Cell for displaying orgs in tables
│   └── update-organization-form/  # Form for updating organizations
├── constants/                     # Constants and configuration
│   ├── organizationTypeLabels.ts
│   ├── organizationTypeOptions.ts
│   ├── statusConfig.ts
│   └── typeConfig.ts
├── forms/                         # Form logic and components
│   ├── create-organization/
│   └── update-organization/
├── hooks/                         # Custom React hooks
│   ├── useCreateOrganization.ts
│   ├── useOrganizationHierarchy.tsx
│   ├── useOrganizationTable.tsx
│   └── useUpdateOrganization.tsx
├── plugins/                       # Payload CMS plugins
│   ├── access/                    # Access control rules
│   ├── collections/               # Database collections
│   ├── endpoints/                 # API endpoints
│   ├── queries/                   # Database queries
│   └── utils/                     # Plugin utilities
├── schemas/                       # Validation schemas
│   ├── index.ts
│   ├── organizations.schemas.ts
│   └── organization-access.schemas.ts
├── services/                      # Business logic services
├── types/                         # TypeScript type definitions
├── utils/                         # Utility functions
│   ├── calcPathAndDepth.ts
│   ├── createOrgTree.ts
│   ├── filterTree.ts
│   └── treePaginationAndFilter.ts
└── index.ts                       # Module exports
```

## Key Features

### Organization Management

- Create, update, and disable organizations
- Hierarchical organization structure (parent/child relationships)
- Organization type classification
- Status management (active, inactive, pending review)

### Organization Access Control

- User access management to organizations
- Temporary and permanent access types
- Date-based access control
- Access validation and verification

### Main Components

- **OrganizationTable**: Table view of organizations ([components/organization-table](components/organization-table))
- **OrganizationDetail**: Detailed view of an organization ([components/organization-detail](components/organization-detail))
- **OrganizationTree**: Hierarchical tree visualization ([components/org-tree](components/org-tree))
- **CreateOrganizationForm**: Form for creating organizations ([components/create-organization-form](components/create-organization-form))
- **UpdateOrganizationForm**: Form for updating organizations ([components/update-organization-form](components/update-organization-form))
- **DisableOrganizationButton**: Dialog for disabling organizations ([components/disable-organization](components/disable-organization))

### Hooks

- **useCreateOrganization**: Form logic for creating organizations ([hooks/useCreateOrganization.ts](hooks/useCreateOrganization.ts))
- **useUpdateOrganization**: Form logic for updating organizations ([hooks/useUpdateOrganization.tsx](hooks/useUpdateOrganization.tsx))
- **useOrganizationHierarchy**: Hierarchy management and filtering ([hooks/useOrganizationHierarchy.tsx](hooks/useOrganizationHierarchy.tsx))
- **useOrganizationTable**: Table column definitions ([hooks/useOrganizationTable.tsx](hooks/useOrganizationTable.tsx))

### Schemas

- **createOrgFormSchema**: Validation for creating organizations ([schemas/organizations.schemas.ts](schemas/organizations.schemas.ts))
- **updateOrgFormSchema**: Validation for updating organizations ([schemas/organizations.schemas.ts](schemas/organizations.schemas.ts))
- **organizationSearchSchema**: Search and filtering validation ([schemas/organizations.schemas.ts](schemas/organizations.schemas.ts))
- **organizationAccess**: Access record validation ([schemas/organization-access.schemas.ts](schemas/organization-access.schemas.ts))
- **updateOrgAccessSchema**: Access update validation ([schemas/organization-access.schemas.ts](schemas/organization-access.schemas.ts))
- **UserAccessTypeEnum**: Access type enumeration ([schemas/organization-access.schemas.ts](schemas/organization-access.schemas.ts))

### Plugins

- **Collections**: Main organization and access collections ([plugins/collections](plugins/collections))
- **Endpoints**: API endpoints for create, update, disable ([plugins/endpoints](plugins/endpoints))
- **Queries**: Database queries for organizations and access ([plugins/queries](plugins/queries))
- **Access Control**: Permission rules ([plugins/access](plugins/access))

### Utilities

- **Tree and Hierarchy Utilities**: Tree creation, filtering, and pagination ([utils/createOrgTree.ts](utils/createOrgTree.ts), [utils/filterTree.ts](utils/filterTree.ts), [utils/treePaginationAndFilter.ts](utils/treePaginationAndFilter.ts))
- **Path and Depth Calculation**: Prevent circular hierarchy ([utils/calcPathAndDepth.ts](utils/calcPathAndDepth.ts))

## Usage Examples

### Creating an Organization

```typescript
import { createOrgFormSchema } from '@/features/organizations'

const formData = {
  name: 'New Organization',
  type: 'department',
  admin: 'user-id',
  status: 'active',
}

const validatedData = createOrgFormSchema.parse(formData)
```

### Managing Organization Access

```typescript
import { UserAccessTypeEnum, getOrganizationAccessByUserId } from '@/features/organizations'

// Get user's organization access
const access = await getOrganizationAccessByUserId({ id: userId })

// Check access type
const hasPermanentAccess = access.docs.some((acc) => acc.type === UserAccessTypeEnum.Permanent)
```

### Using Organization Components

```tsx
import { OrganizationTable, CreateOrganizationForm } from '@/features/organizations'

// Display organization table
<OrganizationTable data={orgs} pagination={pagination} />

// Create organization form
<CreateOrganizationForm userRole={userRole} users={users} organizations={orgs} />
```

## Migration Notes

This module consolidates the previously separate `organization-access` feature into the main `organizations` module for better code organization and maintainability. All imports have been updated to use the new structure:

- `@/features/organization-access` → `@/features/organizations`
- Organization access schemas are now available as `@/features/organizations`
- Access queries are exported from the main organizations module

## Dependencies

- **Payload CMS**: For database collections and API endpoints
- **Zod**: For schema validation
- **React**: For UI components and hooks
- **Next.js**: For server-side functionality
