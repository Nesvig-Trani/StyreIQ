import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { Where } from 'payload'
import { ComplianceTaskStatus } from '../../schema'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { notFound, redirect } from 'next/navigation'
import { ComplianceTask, SocialMedia, Flag } from '@/types/payload-types'

export const getComplianceTasksForUser = async (userId: number) => {
  const { payload } = await getPayloadContext()

  const where: Where = {
    assignedUser: { equals: userId },
    status: { in: [ComplianceTaskStatus.PENDING, ComplianceTaskStatus.OVERDUE] },
  }

  const tasks = await payload.find({
    collection: 'compliance_tasks',
    where,
    sort: '-dueDate',
    depth: 2,
    limit: 0,
  })

  return tasks
}

export function getTrainingInfo(trainingId: string) {
  const trainings: Record<
    string,
    {
      title: string
      topics: string[]
      objectives: string[]
    }
  > = {
    'training-accessibility': {
      title: 'Social Media Accessibility Training',
      topics: [
        'WCAG 2.1 standards for social media content',
        'Effective alt text for images',
        'Captions and transcripts for videos',
        'Accessible use of colors and contrast',
        'Accessible hashtags and text formatting',
      ],
      objectives: [
        'Create accessible content for all users',
        'Implement digital accessibility best practices',
        'Comply with inclusion standards',
      ],
    },
    'training-risk': {
      title: 'Social Media Risk Mitigation Training',
      topics: [
        'Identifying sensitive or risky content',
        'Crisis management protocols for social media',
        'Preventing information leaks',
        'Managing negative comments and trolls',
        'Account security and hack prevention',
      ],
      objectives: [
        'Safeguard accounts from hacking, phishing, and unauthorized access',
        'Keep messaging and behavior consistent across platforms',
        'Use proactive strategies for emergencies and misinformation',
        'Follow legal, ethical, and accessibility standards',
      ],
    },
    'training-governance': {
      title: 'Social Media Governance Essentials: Accessibility, Compliance & Risk',
      topics: [
        'Social media governance structure',
        'Accessibility standards across platforms',
        'Common compliance risks',
        'Organizational standards and values',
      ],
      objectives: [
        'Learn how social media policies apply to your role',
        'Create content that meets accessibility standards',
        'Recognize common compliance risks and how to avoid them',
        'Align social media activity with organizational standards',
      ],
    },
    'training-leadership': {
      title: 'A Leadership Guide to Social Media Crisis Management',
      topics: [
        'Leadership responsibilities during incidents',
        'Aligning communications and legal roles',
        'Structured approaches for timely responses',
        'Reducing confusion and reputational harm',
      ],
      objectives: [
        'Understand leadership responsibilities during social media incidents',
        'Align communications, legal, and leadership roles during escalation',
        'Use structured approaches to guide timely, effective responses',
        'Reduce confusion, delays, and reputational harm during crises',
      ],
    },
    'training-brand': {
      title: 'Brand Guidelines and Institutional Voice',
      topics: [
        'Brand voice and tone across different platforms',
        'Visual guidelines: logos, colors, typography',
        'Key messages and approved narratives',
        'What to post and what to avoid',
        'Content approval process',
      ],
      objectives: [
        'Maintain brand consistency across all posts',
        'Effectively communicate organizational values',
        'Follow content approval protocols',
      ],
    },
    'training-compliance': {
      title: 'Regulatory and Legal Compliance',
      topics: [
        'Data protection and privacy laws',
        'Industry-specific regulations',
        'Copyright and third-party content usage',
        'Disclosure of sensitive information',
        'Data retention and deletion',
      ],
      objectives: [
        'Understand legal obligations',
        'Avoid regulatory violations',
        'Protect personal and confidential data',
      ],
    },
  }

  return (
    trainings[trainingId] || {
      title: 'Required Training',
      topics: ['Training material to be defined'],
      objectives: ['Complete assigned training'],
    }
  )
}

export async function getTaskForUser(taskId: string): Promise<ComplianceTask> {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const result = await payload.find({
    collection: 'compliance_tasks',
    where: {
      and: [{ id: { equals: Number(taskId) } }, { assignedUser: { equals: user.id } }],
    },
    limit: 1,
  })

  if (result.docs.length === 0) {
    notFound()
  }

  return result.docs[0]
}

export async function getTaskForUserWithAccounts(taskId: string): Promise<{
  task: ComplianceTask
  assignedAccounts: SocialMedia[]
}> {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const result = await payload.find({
    collection: 'compliance_tasks',
    where: {
      and: [{ id: { equals: Number(taskId) } }, { assignedUser: { equals: user.id } }],
    },
    limit: 1,
  })

  if (result.docs.length === 0) {
    notFound()
  }

  const task = result.docs[0]

  let assignedAccounts: SocialMedia[] = []

  if (task.type === 'USER_ROLL_CALL') {
    try {
      const userTenantId =
        user.tenant && typeof user.tenant === 'object' ? user.tenant.id : user.tenant

      if (userTenantId) {
        const accountsResult = await payload.find({
          collection: 'social-medias',
          where: {
            and: [
              { tenant: { equals: userTenantId } },
              {
                or: [
                  { socialMediaManagers: { contains: user.id } },
                  { primaryAdmin: { equals: user.id } },
                  { backupAdmin: { equals: user.id } },
                ],
              },
            ],
          },
          limit: 0,
          sort: 'name',
        })

        assignedAccounts = accountsResult.docs
      }
    } catch (error) {
      console.error('error fetching assigned accounts for roll call:', error)
      assignedAccounts = []
    }
  }

  return {
    task,
    assignedAccounts,
  }
}

export async function getTaskForUserWithFlag(taskId: string): Promise<{
  task: ComplianceTask
  flag: Flag
}> {
  const { payload } = await getPayloadContext()
  const { user } = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const result = await payload.find({
    collection: 'compliance_tasks',
    where: {
      and: [{ id: { equals: Number(taskId) } }, { assignedUser: { equals: user.id } }],
    },
    limit: 1,
    depth: 3,
  })

  if (result.docs.length === 0) {
    notFound()
  }

  const task = result.docs[0]

  if (!task.relatedFlag) {
    notFound()
  }

  const flagId = typeof task.relatedFlag === 'object' ? task.relatedFlag.id : task.relatedFlag

  const flag = await payload.findByID({
    collection: 'flags',
    id: flagId,
    depth: 2,
  })

  if (!flag) {
    notFound()
  }

  return {
    task,
    flag,
  }
}

export const getComplianceTasksByUserIds = async (userIds: number[]) => {
  const { payload } = await getPayloadContext()

  if (userIds.length === 0) {
    return new Map<number, ComplianceTask[]>()
  }

  const tasks = await payload.find({
    collection: 'compliance_tasks',
    where: {
      assignedUser: { in: userIds },
    },
    limit: 0,
    depth: 1,
  })

  const tasksByUser = new Map<number, ComplianceTask[]>()

  tasks.docs.forEach((task) => {
    const userId = typeof task.assignedUser === 'object' ? task.assignedUser.id : task.assignedUser

    if (!tasksByUser.has(userId)) {
      tasksByUser.set(userId, [])
    }
    tasksByUser.get(userId)!.push(task)
  })

  return tasksByUser
}
