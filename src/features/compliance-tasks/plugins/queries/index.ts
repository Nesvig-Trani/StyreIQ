import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { Where } from 'payload'
import { ComplianceTaskStatus } from '../../schema'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { notFound, redirect } from 'next/navigation'
import { ComplianceTask } from '@/types/payload-types'

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
      title: 'Social Media Risk Management Training',
      topics: [
        'Identifying sensitive or risky content',
        'Crisis management protocols for social media',
        'Preventing information leaks',
        'Managing negative comments and trolls',
        'Account security and hack prevention',
      ],
      objectives: [
        'Identify and mitigate potential risks',
        'Respond appropriately to crisis situations',
        'Protect organizational reputation',
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
    'training-governance': {
      title: 'Governance and Organizational Policies',
      topics: [
        'Social media governance structure',
        'Roles and responsibilities',
        'Acceptable use policies',
        'Escalation processes',
        'Compliance audits and reporting',
      ],
      objectives: [
        'Understand governance structure',
        'Know your specific responsibilities',
        'Follow established processes',
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
