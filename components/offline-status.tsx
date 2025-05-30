'use client'

import { useOffline } from '@/hooks/use-offline'
import { AlertCircle, WifiOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function OfflineStatus() {
  const isOffline = useOffline()

  if (!isOffline) return null

  return (
    <Alert variant="destructive" className="fixed top-4 right-4 w-auto max-w-sm z-50">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You're offline. Some features may be limited.
      </AlertDescription>
    </Alert>
  )
}