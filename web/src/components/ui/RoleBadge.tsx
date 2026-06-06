import type { UserRole } from '../../types/roles'
import { Badge } from './Badge'

const roleTones: Record<UserRole, 'purple' | 'blue' | 'gray' | 'green' | 'yellow' | 'red'> = {
  user: 'gray',
  admin: 'purple',
}

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge tone={roleTones[role]}>{role}</Badge>
}
