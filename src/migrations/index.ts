import * as migration_20250624_215652 from './20250624_215652'
import * as migration_20250702_230347 from './20250702_230347'

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
]
