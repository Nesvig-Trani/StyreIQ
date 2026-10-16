import { describe, expect, it } from 'vitest'
import {
  createSocialMediaFormSchema,
  platformLabelMap,
  platformOptions,
  socialMediaSearchSchema,
  statusColorMap,
  statusOptions,
  updateSocialMediaFormSchema,
  SocialMediaStatusEnum,
} from '../../schemas'
import {
  TwitterLatestPostResponseSchema,
  YoutubeLatestPostResponseSchema,
} from '../../schemas/latest-posts.schema'

const validForm = {
  name: 'Universidad Andina Oficial',
  profileUrl: 'https://www.instagram.com/uandina_oficial',
  platform: 'instagram',
  creationDate: '2024-03-15',
  organization: '100',
  primaryAdmin: '1',
  adminContactEmails: ['comunicaciones@universidad-andina.edu'],
  thirdPartyManagement: 'no_managed_internally',
  passwordManagementPractice: 'password_manager_shared',
  socialMediaManagers: ['3'],
}

const issuePaths = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((issue) => issue.path.join('.')) ?? []

describe('createSocialMediaFormSchema', () => {
  it('should accept a complete form without a backup admin', () => {
    expect(createSocialMediaFormSchema.safeParse(validForm).success).toBe(true)
  })

  it('should reject missing required fields', () => {
    const result = createSocialMediaFormSchema.safeParse({
      ...validForm,
      name: '',
      profileUrl: 'not-a-url',
      socialMediaManagers: [],
      adminContactEmails: [],
    })

    expect(result.success).toBe(false)
    expect(issuePaths(result)).toEqual(
      expect.arrayContaining(['name', 'profileUrl', 'socialMediaManagers', 'adminContactEmails']),
    )
  })

  it('should reject a backup admin equal to the primary admin', () => {
    const result = createSocialMediaFormSchema.safeParse({ ...validForm, backupAdmin: '1' })

    expect(result.success).toBe(false)
    expect(issuePaths(result)).toEqual(['backupAdmin'])
  })

  it('should accept a different backup admin', () => {
    expect(createSocialMediaFormSchema.safeParse({ ...validForm, backupAdmin: '5' }).success).toBe(
      true,
    )
  })

  it('should validate the optional contact phone format', () => {
    expect(
      createSocialMediaFormSchema.safeParse({ ...validForm, contactPhone: '+573001234567' })
        .success,
    ).toBe(true)
    expect(createSocialMediaFormSchema.safeParse({ ...validForm, contactPhone: '' }).success).toBe(
      true,
    )
    expect(
      createSocialMediaFormSchema.safeParse({ ...validForm, contactPhone: '300-abc' }).success,
    ).toBe(false)
  })
})

describe('updateSocialMediaFormSchema', () => {
  it('should require the account id', () => {
    expect(updateSocialMediaFormSchema.safeParse({ ...validForm, backupAdmin: '' }).success).toBe(
      false,
    )
  })

  it('should accept an empty backup admin so it can be cleared', () => {
    const result = updateSocialMediaFormSchema.safeParse({ ...validForm, id: 7, backupAdmin: '' })

    expect(result.success).toBe(true)
  })

  it('should reject a backup admin equal to the primary admin', () => {
    const result = updateSocialMediaFormSchema.safeParse({ ...validForm, id: 7, backupAdmin: '1' })

    expect(result.success).toBe(false)
    expect(issuePaths(result)).toEqual(['backupAdmin'])
  })
})

describe('social media option maps', () => {
  it('should expose a label for every platform and status', () => {
    expect(platformOptions).toHaveLength(Object.keys(platformLabelMap).length)
    expect(platformOptions).toContainEqual({ value: 'youtube', label: 'YouTube' })
    expect(statusOptions).toContainEqual({ value: 'in_transition', label: 'In Transition' })
  })

  it('should color pending approval as a warning and active as success', () => {
    expect(statusColorMap[SocialMediaStatusEnum.Active]).toBe('green')
    expect(statusColorMap[SocialMediaStatusEnum.PendingApproval]).toBe('yellow')
    expect(statusColorMap[SocialMediaStatusEnum.Inactive]).toBe('red')
  })
})

describe('socialMediaSearchSchema', () => {
  it('should reject unknown status filters', () => {
    expect(socialMediaSearchSchema.safeParse({ status: ['archived'] }).success).toBe(false)
  })

  it('should accept known status filters', () => {
    expect(
      socialMediaSearchSchema.safeParse({ status: ['active'], platform: ['twitter'] }).success,
    ).toBe(true)
  })
})

describe('latest post response schemas', () => {
  it('should coerce the YouTube creation date into a Date', () => {
    const result = YoutubeLatestPostResponseSchema.parse({
      success: true,
      message: 'ok',
      data: {
        id: 'dQw4w9WgXcQ',
        platform: 'youtube',
        author: 'Universidad Andina',
        author_id: 'UC-andina-canal',
        content: 'Ceremonia de grados 2026',
        created_at: '2026-09-18T10:00:00.000Z',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        media_urls: [],
        engagement: { views: 10, likes: 2, comments: 1 },
      },
    })

    expect(result.data.created_at).toBeInstanceOf(Date)
  })

  it('should reject a tweet without engagement metrics', () => {
    const result = TwitterLatestPostResponseSchema.safeParse({
      success: true,
      message: 'ok',
      data: { id: '1', platform: 'twitter' },
    })

    expect(result.success).toBe(false)
  })
})
