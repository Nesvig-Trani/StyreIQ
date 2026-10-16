import { describe, expect, it } from 'vitest'
import { FlagHistoryActionsEnum, FlagSourceEnum, FlagStatusEnum, FlagTypeEnum } from '../schemas'
import { flagTypeLabels } from '../constants/flagTypeLabels'
import { flagTypeOptions } from '../constants/flagTypeOptions'
import { flagStatusLabels } from '../constants/flagStatusLabels'
import { flagStatusOptions } from '../constants/flagStatusOptions'
import { flagSourceLabels } from '../constants/flagSourceLabels'
import { historyActionLabels } from '../constants/historyActionLabels'
import { affectedEntityOptions } from '../constants/affectedEntityOptions'

describe('flag constants', () => {
  it('should label every flag type and offer each one as an option with the same label', () => {
    const types = Object.values(FlagTypeEnum)
    expect(Object.keys(flagTypeLabels).sort()).toEqual([...types].sort())
    expect(flagTypeOptions.map((o) => o.value).sort()).toEqual([...types].sort())
    flagTypeOptions.forEach((option) => expect(option.label).toBe(flagTypeLabels[option.value]))
  })

  it('should label every status and offer each one as an option', () => {
    const statuses = Object.values(FlagStatusEnum)
    expect(Object.keys(flagStatusLabels).sort()).toEqual([...statuses].sort())
    expect(flagStatusOptions.map((o) => o.value).sort()).toEqual([...statuses].sort())
  })

  it('should label every flag source and history action', () => {
    expect(Object.keys(flagSourceLabels).sort()).toEqual(Object.values(FlagSourceEnum).sort())
    expect(Object.keys(historyActionLabels).sort()).toEqual(
      Object.values(FlagHistoryActionsEnum).sort(),
    )
  })

  it('should call organizations "Unit" when choosing the affected entity', () => {
    expect(affectedEntityOptions).toContainEqual({ value: 'organization', label: 'Unit' })
  })
})
