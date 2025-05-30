import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shield, Bell, User, Settings, LogOut, Menu } from "lucide-react"

export default function DoctorHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/doctors" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-800">
              LeLink
            </span>
            <Badge className="ml-2 bg-teal-100 text-teal-800 hover:bg-teal-200">Doctor Portal</Badge>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/doctors"
            className="text-sm font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-teal-600 after:scale-x-100"
          >
            Triage
          </Link>
          <Link
            href="/doctors/patients"
            className="text-sm font-medium text-muted-foreground hover:text-teal-700 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-teal-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
          >
            Patients
          </Link>
          <Link
            href="/doctors/schedule"
            className="text-sm font-medium text-muted-foreground hover:text-teal-700 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-teal-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
          >
            Schedule
          </Link>
          <Link
            href="/doctors/reports"
            className="text-sm font-medium text-muted-foreground hover:text-teal-700 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-teal-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
          >
            Reports
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Dr. Sarah Williams" />
                  <AvatarFallback>SW</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Dr. Sarah Williams</p>
                  <p className="text-xs text-muted-foreground">Emergency Medicine</p>
                </div>
              </DropdownMenuLabel>
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
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

