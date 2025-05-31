'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Shield, Bell, User, Settings, LogOut } from 'lucide-react';
import { APPOINTMENTS_PATH, DASHBOARD_PATH, RECORDS_PATH, PATIENTS_PATH } from '@/lib/paths';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import TriageModal from '@/components/triage-modal';

interface DashboardHeaderWithModalProps {
  triageOpen?: boolean;
  onTriageOpenChange?: (open: boolean) => void;
}

export default function DashboardHeaderWithModal({
  triageOpen: externalTriageOpen,
  onTriageOpenChange,
}: DashboardHeaderWithModalProps) {
  const pathname = usePathname();
  const [internalTriageOpen, setInternalTriageOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const triageOpen = externalTriageOpen !== undefined ? externalTriageOpen : internalTriageOpen;
  const setTriageOpen = onTriageOpenChange || setInternalTriageOpen;

  const isActive = (href: string) => pathname === href;

  const navLinks = [
    { label: 'Dashboard', href: DASHBOARD_PATH },
    { label: 'Triage', href: null, onClick: () => setTriageOpen(true) },
    { label: 'Appointments', href: APPOINTMENTS_PATH },
    { label: 'Records', href: RECORDS_PATH },
    { label: 'Patients', href: PATIENTS_PATH },
  ];

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-teal-600" />
              <span className="text-xl font-bold">LeLink</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(({ label, href, onClick }) =>
              href ? (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isActive(href) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </Link>
              ) : (
                <button
                  key={label}
                  onClick={onClick}
                  className="text-sm font-medium transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {label}
                </button>
              )
            )}
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Only render modal if using internal state */}
      {externalTriageOpen === undefined && <TriageModal open={triageOpen} onOpenChange={setTriageOpen} />}
    </>
  );
}
