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
]
