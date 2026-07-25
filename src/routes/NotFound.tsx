import { Link } from 'react-router-dom'
import { buttonClasses } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/states'

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="This screen doesn’t exist or the link has expired."
      action={
        <Link to="/" className={buttonClasses({ size: 'sm' })}>
          Back to Home
        </Link>
      }
    />
  )
}
