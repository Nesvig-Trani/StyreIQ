import { getLastPolicyVersion } from '@/policies/queries'
import LexicalEditor from '@/shared/components/rich-text-editor'

export default async function PoliciesPage(props: {
  searchParams?: Promise<{
    [key: string]: string
  }>
}) {
  const lastPolicy = await getLastPolicyVersion()
  const initialState = JSON.stringify(lastPolicy.text) || ''
  return (
    <div>
      <div className="flex align-center gap-2">
        <p className="!my-0">Current Version</p>
        <b>V{lastPolicy.version}</b>
      </div>
      <LexicalEditor initialState={initialState} />
    </div>
  )
}
