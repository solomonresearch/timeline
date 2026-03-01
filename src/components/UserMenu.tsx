import { useState } from 'react'
import { LogOut, UserPen } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProfileDialog } from '@/components/ProfileDialog'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const [profileOpen, setProfileOpen] = useState(false)

  if (!user) return null

  const displayName = profile?.display_name || ''
  const initial = (displayName || user.email?.[0] || '?').charAt(0).toUpperCase()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 rounded-full p-0 text-sm font-medium">
            {initial}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
            {displayName || user.email}
          </div>
          <DropdownMenuItem onClick={() => setProfileOpen(true)}>
            <UserPen className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  )
}
