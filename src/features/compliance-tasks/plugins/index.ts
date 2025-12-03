import type { Config } from 'payload'
import { ComplianceTasks } from './collections'

type ComplianceTasksPluginConfig = {
  disabled?: boolean
  autoGenerateOnUserCreation?: boolean
}

export const ComplianceTasksPlugin =
  (pluginOptions: ComplianceTasksPluginConfig = {}) =>
  (config: Config): Config => {
    config.collections = [...(config.collections || []), ComplianceTasks]

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

      await payload.count({
        collection: 'compliance_tasks',
      })
    }

    return config
  }
