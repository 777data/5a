'use client'

import { ProfileMenu } from './profile-menu'

export function NavBar() {
  return (
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="font-semibold">
          Agendize
        </div>
        <div>
          <ProfileMenu />
        </div>
      </div>
    </nav>
  )
} 