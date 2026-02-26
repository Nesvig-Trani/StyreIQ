export function calcDaysFromToday(dueDateStr: string): {
  daysUntilDue: number
  daysSinceDue: number
  dueDateOnly: Date
} {
  const now = new Date()
  const dueDate = new Date(dueDateStr)

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

  const daysUntilDue = Math.floor((dueDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const daysSinceDue = Math.floor((today.getTime() - dueDateOnly.getTime()) / (1000 * 60 * 60 * 24))

  return { daysUntilDue, daysSinceDue, dueDateOnly }
}

export function toDateOnly(dateStr: string): Date {
  const d = new Date(dateStr)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
