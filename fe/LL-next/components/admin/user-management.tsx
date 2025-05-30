"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  UserCog,
  UserCircle,
  Stethoscope,
  ShieldAlert,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Types
type UserRole = "admin" | "doctor" | "patient" | "staff"
type UserStatus = "active" | "inactive" | "pending" | "suspended"

type User = {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  department?: string
  lastActive: string
  createdAt: string
  avatar?: string
}

// Sample data
const users: User[] = [
  {
    id: "USR-001",
    name: "John Davis",
    email: "john.davis@lelink.com",
    role: "admin",
    status: "active",
    lastActive: "2025-04-07T10:30:00Z",
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "USR-002",
    name: "Dr. Sarah Williams",
    email: "sarah.williams@lelink.com",
    role: "doctor",
    status: "active",
    department: "Emergency",
    lastActive: "2025-04-07T11:15:00Z",
    createdAt: "2024-02-10T09:30:00Z",
  },
  {
    id: "USR-003",
    name: "Dr. Michael Chen",
    email: "michael.chen@lelink.com",
    role: "doctor",
    status: "active",
    department: "Cardiology",
    lastActive: "2025-04-07T09:45:00Z",
    createdAt: "2024-01-20T10:15:00Z",
  },
  {
    id: "USR-004",
    name: "Emma Thompson",
    email: "emma.thompson@example.com",
    role: "patient",
    status: "active",
    lastActive: "2025-04-06T14:20:00Z",
    createdAt: "2024-03-05T11:00:00Z",
  },
  {
    id: "USR-005",
    name: "James Wilson",
    email: "james.wilson@example.com",
    role: "patient",
    status: "active",
    lastActive: "2025-04-07T08:10:00Z",
    createdAt: "2024-02-28T13:45:00Z",
  },
  {
    id: "USR-006",
    name: "Lisa Johnson",
    email: "lisa.johnson@lelink.com",
    role: "staff",
    status: "active",
    department: "Administration",
    lastActive: "2025-04-07T10:05:00Z",
    createdAt: "2024-01-10T09:00:00Z",
  },
  {
    id: "USR-007",
    name: "Dr. Robert Kim",
    email: "robert.kim@lelink.com",
    role: "doctor",
    status: "inactive",
    department: "Neurology",
    lastActive: "2025-04-01T16:30:00Z",
    createdAt: "2024-02-15T08:30:00Z",
  },
  {
    id: "USR-008",
    name: "Sophia Rodriguez",
    email: "sophia.rodriguez@example.com",
    role: "patient",
    status: "pending",
    lastActive: "2025-04-07T11:00:00Z",
    createdAt: "2025-04-07T11:00:00Z",
  },
]

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User
    direction: "ascending" | "descending"
  } | null>(null)

  // Filter users based on search query and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig) return 0

    const { key, direction } = sortConfig

    if (a[key] < b[key]) {
      return direction === "ascending" ? -1 : 1
    }
    if (a[key] > b[key]) {
      return direction === "ascending" ? 1 : -1
    }
    return 0
  })

  // Handle sort
  const requestSort = (key: keyof User) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Get sort direction indicator
  const getSortDirectionIndicator = (key: keyof User) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  // Get role badge
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Admin</Badge>
      case "doctor":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Doctor</Badge>
      case "patient":
        return <Badge className="bg-teal-500 hover:bg-teal-600">Patient</Badge>
      case "staff":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Staff</Badge>
    }
  }

  // Get status badge
  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-600">
            Inactive
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            Pending
          </Badge>
        )
      case "suspended":
        return (
          <Badge variant="outline" className="border-red-500 text-red-600">
            Suspended
          </Badge>
        )
    }
  }

  // Get role icon
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <ShieldAlert className="h-4 w-4 text-purple-500" />
      case "doctor":
        return <Stethoscope className="h-4 w-4 text-blue-500" />
      case "patient":
        return <UserCircle className="h-4 w-4 text-teal-500" />
      case "staff":
        return <UserCog className="h-4 w-4 text-amber-500" />
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | "all")}>
                <SelectTrigger className="w-[130px] h-9 rounded-full bg-white/80 border-teal-100">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as UserStatus | "all")}>
                <SelectTrigger className="w-[130px] h-9 rounded-full bg-white/80 border-teal-100">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 h-9 rounded-full bg-white/80 border-teal-100 focus-visible:ring-teal-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full h-9 px-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new user account in the system.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input id="name" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input id="email" type="email" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Role
                      </Label>
                      <Select>
                        <SelectTrigger id="role" className="col-span-3">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="patient">Patient</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="department" className="text-right">
                        Department
                      </Label>
                      <Select>
                        <SelectTrigger id="department" className="col-span-3">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="cardiology">Cardiology</SelectItem>
                          <SelectItem value="neurology">Neurology</SelectItem>
                          <SelectItem value="pediatrics">Pediatrics</SelectItem>
                          <SelectItem value="orthopedics">Orthopedics</SelectItem>
                          <SelectItem value="administration">Administration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddUserOpen(false)}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-teal-50/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-teal-700" onClick={() => requestSort("id")}>
                    ID {getSortDirectionIndicator("id")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-teal-700" onClick={() => requestSort("name")}>
                    User {getSortDirectionIndicator("name")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-teal-700" onClick={() => requestSort("email")}>
                    Email {getSortDirectionIndicator("email")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-teal-700" onClick={() => requestSort("role")}>
                    Role {getSortDirectionIndicator("role")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-teal-700" onClick={() => requestSort("status")}>
                    Status {getSortDirectionIndicator("status")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <button
                    className="flex items-center gap-1 hover:text-teal-700"
                    onClick={() => requestSort("createdAt")}
                  >
                    Created {getSortDirectionIndicator("createdAt")}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-teal-50/50 transition-colors">
                  <td className="px-4 py-4 text-sm">{user.id}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || `/placeholder.svg?height=32&width=32`} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {getRoleIcon(user.role)}
                          {user.department && <span>{user.department}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">{user.email}</td>
                  <td className="px-4 py-4 text-sm">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-4 text-sm">{getStatusBadge(user.status)}</td>
                  <td className="px-4 py-4 text-sm">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-4 text-sm text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-teal-100">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit User</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Reset Password</DropdownMenuItem>
                        {user.status === "active" ? (
                          <DropdownMenuItem className="text-amber-600">Deactivate</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600">Activate</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Delete User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

