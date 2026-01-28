import * as migration_20250624_215652 from './20250624_215652'
import * as migration_20250702_230347 from './20250702_230347'
import * as migration_20250708_164711_flags_comments_history from './20250708_164711_flags_comments_history'
import * as migration_20250710_134307 from './20250710_134307'
import * as migration_20250711_123736_disable_org from './20250711_123736_disable_org'
import * as migration_20250711_202206 from './20250711_202206'
import * as migration_20250718_205857_welcome_email from './20250718_205857_welcome_email'
import * as migration_20250722_194435_link_compliance_to_user from './20250722_194435_link_compliance_to_user'
import * as migration_20250723_162524_organization_types from './20250723_162524_organization_types'
import * as migration_20250731_204646_add_new_fields_to_social_media from './20250731_204646_add_new_fields_to_social_media'
import * as migration_20250801_211652 from './20250801_211652'
import * as migration_20250805_162244_add_the_social_media_managers_field_to_social_media from './20250805_162244_add_the_social_media_managers_field_to_social_media'
import * as migration_20250811_181449 from './20250811_181449'
import * as migration_20250829_131117_add_offboarding_completed_field_to_users from './20250829_131117_add_offboarding_completed_field_to_users'
import * as migration_20250903_163942 from './20250903_163942'
import * as migration_20251127_144406_add_tenant_to_all_collections from './20251127_144406_add_tenant_to_all_collections'
import * as migration_20251128_211757_add_a_new_user_role from './20251128_211757_add_a_new_user_role'
import * as migration_20251203_124451_add_compliance_tasks_and_relations from './20251203_124451_add_compliance_tasks_and_relations'
import * as migration_20251212_161815 from './20251212_161815'
import * as migration_20251216_003738 from './20251216_003738'
import * as migration_20251217_190518 from './20251217_190518'
import * as migration_20251217_201355 from './20251217_201355'
import * as migration_20251229_124043 from './20251229_124043'
import * as migration_20260107_115819 from './20260107_115819'
import * as migration_20260115_125108 from './20260115_125108'
import * as migration_20260116_204625 from './20260116_204625'
import * as migration_20260119_185325 from './20260119_185325'
import * as migration_20260120_112850 from './20260120_112850'
import * as migration_20260127_204705 from './20260127_204705'

export const migrations = [
  {
    up: migration_20250624_215652.up,
    down: migration_20250624_215652.down,
    name: '20250624_215652',
  },
  {
    up: migration_20250702_230347.up,
    down: migration_20250702_230347.down,
    name: '20250702_230347',
  },
  {
    up: migration_20250708_164711_flags_comments_history.up,
    down: migration_20250708_164711_flags_comments_history.down,
    name: '20250708_164711_flags_comments_history',
  },
  {
    up: migration_20250710_134307.up,
    down: migration_20250710_134307.down,
    name: '20250710_134307',
  },
  {
    up: migration_20250711_123736_disable_org.up,
    down: migration_20250711_123736_disable_org.down,
    name: '20250711_123736_disable_org',
  },
  {
    up: migration_20250711_202206.up,
    down: migration_20250711_202206.down,
    name: '20250711_202206',
  },
  {
    up: migration_20250718_205857_welcome_email.up,
    down: migration_20250718_205857_welcome_email.down,
    name: '20250718_205857_welcome_email',
  },
  {
    up: migration_20250722_194435_link_compliance_to_user.up,
    down: migration_20250722_194435_link_compliance_to_user.down,
    name: '20250722_194435_link_compliance_to_user',
  },
  {
    up: migration_20250723_162524_organization_types.up,
    down: migration_20250723_162524_organization_types.down,
    name: '20250723_162524_organization_types',
  },
  {
    up: migration_20250731_204646_add_new_fields_to_social_media.up,
    down: migration_20250731_204646_add_new_fields_to_social_media.down,
    name: '20250731_204646_add_new_fields_to_social_media',
  },
  {
    up: migration_20250801_211652.up,
    down: migration_20250801_211652.down,
    name: '20250801_211652',
  },
  {
    up: migration_20250805_162244_add_the_social_media_managers_field_to_social_media.up,
    down: migration_20250805_162244_add_the_social_media_managers_field_to_social_media.down,
    name: '20250805_162244_add_the_social_media_managers_field_to_social_media',
  },
  {
    up: migration_20250811_181449.up,
    down: migration_20250811_181449.down,
    name: '20250811_181449',
  },
  {
    up: migration_20250829_131117_add_offboarding_completed_field_to_users.up,
    down: migration_20250829_131117_add_offboarding_completed_field_to_users.down,
    name: '20250829_131117_add_offboarding_completed_field_to_users',
  },
  {
    up: migration_20250903_163942.up,
    down: migration_20250903_163942.down,
    name: '20250903_163942',
  },
  {
    up: migration_20251127_144406_add_tenant_to_all_collections.up,
    down: migration_20251127_144406_add_tenant_to_all_collections.down,
    name: '20251127_144406_add_tenant_to_all_collections',
  },
  {
    up: migration_20251128_211757_add_a_new_user_role.up,
    down: migration_20251128_211757_add_a_new_user_role.down,
    name: '20251128_211757_add_a_new_user_role',
  },
  {
    up: migration_20251203_124451_add_compliance_tasks_and_relations.up,
    down: migration_20251203_124451_add_compliance_tasks_and_relations.down,
    name: '20251203_124451_add_compliance_tasks_and_relations',
  },
  {
    up: migration_20251212_161815.up,
    down: migration_20251212_161815.down,
    name: '20251212_161815',
  },
  {
    up: migration_20251216_003738.up,
    down: migration_20251216_003738.down,
    name: '20251216_003738',
  },
  {
    up: migration_20251217_190518.up,
    down: migration_20251217_190518.down,
    name: '20251217_190518',
  },
  {
    up: migration_20251217_201355.up,
    down: migration_20251217_201355.down,
    name: '20251217_201355',
  },
  {
    up: migration_20251229_124043.up,
    down: migration_20251229_124043.down,
    name: '20251229_124043',
  },
  {
    up: migration_20260107_115819.up,
    down: migration_20260107_115819.down,
    name: '20260107_115819',
  },
  {
    up: migration_20260115_125108.up,
    down: migration_20260115_125108.down,
    name: '20260115_125108',
  },
  {
    up: migration_20260116_204625.up,
    down: migration_20260116_204625.down,
    name: '20260116_204625',
  },
  {
    up: migration_20260119_185325.up,
    down: migration_20260119_185325.down,
    name: '20260119_185325',
  },
  {
    up: migration_20260120_112850.up,
    down: migration_20260120_112850.down,
    name: '20260120_112850',
  },
  {
    up: migration_20260127_204705.up,
    down: migration_20260127_204705.down,
    name: '20260127_204705',
  },
]
