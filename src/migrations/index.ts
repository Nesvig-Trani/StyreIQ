import * as migration_20250624_215652 from './20250624_215652'
import * as migration_20250702_230347 from './20250702_230347'
import * as migration_20250708_164711_flags_comments_history from './20250708_164711_flags_comments_history'
import * as migration_20250710_134307 from './20250710_134307'
import * as migration_20250711_123736_disable_org from './20250711_123736_disable_org'
import * as migration_20250711_202206 from './20250711_202206'
import * as migration_20250718_205857_welcome_email from './20250718_205857_welcome_email'

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
]
