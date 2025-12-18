import type { Config } from 'payload'
import { RoleRequests } from './collections'

type RoleRequestsPluginConfig = {
  disabled?: boolean
}

export const RoleRequestsPlugin =
  (pluginOptions: RoleRequestsPluginConfig) =>
  (config: Config): Config => {
    config.collections = [RoleRequests, ...(config.collections || [])]

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
      payload.logger.info('RoleRequestsPlugin initialized')
    }

    return config
  }
