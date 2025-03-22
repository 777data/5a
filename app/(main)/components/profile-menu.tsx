'use client'

import { signOut, useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User } from 'lucide-react'
import Link from 'next/link'

export function ProfileMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin")

  if (!session?.user) return null

  const initials = session.user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || session.user.email?.[0].toUpperCase() || '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
        <Avatar>
          <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{session.user.name}</p>
          <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            const callbackUrl = encodeURIComponent(window.location.pathname)
            router.push(`/profile?callbackUrl=${callbackUrl}`)
          }}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          Mon profil
        </DropdownMenuItem>
        {session.user.role === "SUPER_ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href={isAdminRoute ? "/dashboard" : "/admin/organizations"}>
              {isAdminRoute ? "Retour au dashboard" : "Administration"}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="text-red-600 focus:text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 