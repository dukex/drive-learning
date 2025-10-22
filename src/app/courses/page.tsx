import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import CoursesClient from './CoursesClient'

export default async function CoursesListPage() {
  // Check authentication on server side
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    redirect('/')
  }

  // Pass user data to client component
  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }

  return <CoursesClient user={user} />
}