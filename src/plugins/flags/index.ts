import type { Config } from 'payload'
import { FlagComments, FlagHistory, Flags } from '@/plugins/flags/collections'

type FlagsPluginConfig = {
  disabled?: boolean
}

export const FlagsPlugin =
  (pluginOptions: FlagsPluginConfig) =>
  (config: Config): Config => {
    config.collections = [...(config.collections || []), Flags, FlagHistory, FlagComments]

    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginOptions.disabled) {
      return config
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    if (!config.admin) {
      config.admin = {}
    }

    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }
    }

    return config
  }
