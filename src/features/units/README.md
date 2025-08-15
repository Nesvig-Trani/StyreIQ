# Units Module

This module manages **unit-related** functionality, including hierarchical unit management and access control.

> **Note:** This feature was previously named "Organization" and has been refactored to use "Unit" terminology throughout the codebase.  
> All references to "organization" have been updated to "unit" for consistency.

## Structure

```
units/
├── components/                    # UI Components
│   ├── create-unit-form/          # Form for creating units
│   ├── disable-unit/              # Disable unit dialog
│   ├── unit-cell/                 # Cell for displaying units in tables
│   ├── unit-detail/               # Unit detail view
│   ├── unit-table/                # Table listing units
│   └── update-organization-form/  # (Legacy) Form for updating organization, now for units
├── constants/                     # Constants and configuration
│   ├── unitTypeLabels.ts
│   ├── unitTypeOptions.ts
│   ├── statusConfig.ts
│   └── typeConfig.ts
├── forms/                         # Form logic and components
│   ├── create-unit/
│   └── update-unit/
├── hooks/                         # Custom React hooks
│   ├── useCreateUnit.tsx
│   ├── useUnitHierarchy.tsx
│   ├── useUnitTable.tsx
│   └── useUpdateUnit.tsx
├── plugins/                       # Payload CMS plugins
│   ├── access/                    # Access control rules
│   ├── collections/               # Database collections
│   ├── endpoints/                 # API endpoints
│   ├── queries/                   # Database queries
│   └── utils/                     # Plugin utilities
├── schemas/                       # Validation schemas
│   ├── index.ts
│   ├── unit.schemas.ts
│   └── unit-access.schemas.ts
├── services/                      # Business logic services
│   └── getFilteredUsersFromUnit.ts
├── types/                         # TypeScript type definitions
├── utils/                         # Utility functions
│   ├── calcPathAndDepth.ts
│   ├── createUnitTree.ts
│   ├── ensureStyreIQUnit.ts
│   ├── filterTree.ts
│   └── treePaginationAndFilter.ts
└── index.ts                       # Module exports
```

## Key Features

### Unit Management

- Create, update, and disable units
- Hierarchical unit structure (parent/child relationships)
- Unit type classification
- Status management (active, inactive, pending review)

### Unit Access Control

- User access management to units
- Temporary and permanent access types
- Date-based access control
- Access validation and verification

### Main Components

- **UnitTable**: Table view of units ([components/unit-table](components/unit-table))
- **UnitDetail**: Detailed view of a unit ([components/unit-detail](components/unit-detail))
- **CreateUnitForm**: Form for creating units ([forms/create-unit](forms/create-unit))
- **UpdateUnitForm**: Form for updating units ([forms/update-unit](forms/update-unit))
- **DisableUnitButton**: Dialog for disabling units ([components/disable-unit](components/disable-unit))

### Hooks

- **useCreateUnit**: Form logic for creating units ([hooks/useCreateUnit.tsx](hooks/useCreateUnit.tsx))
- **useUpdateUnit**: Form logic for updating units ([hooks/useUpdateUnit.tsx](hooks/useUpdateUnit.tsx))
- **useUnitHierarchy**: Hierarchy management and filtering ([hooks/useUnitHierarchy.tsx](hooks/useUnitHierarchy.tsx))
- **useUnitTable**: Table column definitions ([hooks/useUnitTable.tsx](hooks/useUnitTable.tsx))

### Schemas

- **createUnitFormSchema**: Validation for creating units ([schemas/unit.schemas.ts](schemas/unit.schemas.ts))
- **updateUnitFormSchema**: Validation for updating units ([schemas/unit.schemas.ts](schemas/unit.schemas.ts))
- **unitSearchSchema**: Search and filtering validation ([schemas/unit.schemas.ts](schemas/unit.schemas.ts))
- **unitAccess**: Access record validation ([schemas/unit-access.schemas.ts](schemas/unit-access.schemas.ts))
- **updateUnitAccessSchema**: Access update validation ([schemas/unit-access.schemas.ts](schemas/unit-access.schemas.ts))
- **UserAccessTypeEnum**: Access type enumeration ([schemas/unit-access.schemas.ts](schemas/unit-access.schemas.ts))

### Plugins

- **Collections**: Main unit and access collections ([plugins/collections](plugins/collections))
- **Endpoints**: API endpoints for create, update, disable ([plugins/endpoints](plugins/endpoints))
- **Queries**: Database queries for units and access ([plugins/queries](plugins/queries))
- **Access Control**: Permission rules ([plugins/access](plugins/access))

### Utilities

- **Tree and Hierarchy Utilities**: Tree creation, filtering, and pagination ([utils/createUnitTree.ts](utils/createUnitTree.ts), [utils/filterTree.ts](utils/filterTree.ts), [utils/treePaginationAndFilter.ts](utils/treePaginationAndFilter.ts))
- **Path and Depth Calculation**: Prevent circular hierarchy ([utils/calcPathAndDepth.ts](utils/calcPathAndDepth.ts))

## Usage Examples

### Creating a Unit

```typescript
import { createUnitFormSchema } from '@/features/units'

const formData = {
  name: 'New Unit',
  type: 'department',
  admin: 'user-id',
  status: 'active',
}

const validatedData = createUnitFormSchema.parse(formData)
```

### Managing Unit Access

```typescript
import { UserAccessTypeEnum, getUnitAccessByUserId } from '@/features/units'

// Get user's unit access
const access = await getUnitAccessByUserId({ id: userId })

// Check access type
const hasPermanentAccess = access.docs.some((acc) => acc.type === UserAccessTypeEnum.Permanent)
```

### Using Unit Components

```tsx
import { UnitTable } from '@/features/units'

// Display unit table
;<UnitTable data={units} pagination={pagination} />
```

## Migration Notes

- All previous "organization" references (components, hooks, constants, etc.) have been renamed to "unit".
- If you are upgrading from a previous version, update your imports and usage accordingly.
- Organization access schemas and queries are now available as part of the main units module.

## Dependencies

- **Payload CMS**: For database collections and API endpoints
- **Zod**: For schema validation
- **React**: For UI components and hooks
- **Next.js**: For server-side functionality
