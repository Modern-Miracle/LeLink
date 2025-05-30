"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  UserCog,
  Settings,
  Shield,
  FileText,
  Activity,
  Bell,
  Search,
  ArrowUpRight,
  Clock,
  Building2,
  Stethoscope,
  UserCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import AdminHeader from "@/components/admin-header"
import UserManagement from "@/components/admin/user-management"
import DepartmentManagement from "@/components/admin/department-management"
import SystemSettings from "@/components/admin/system-settings"
import AuditLogs from "@/components/admin/audit-logs"

// Sample data for the dashboard
const stats = {
  totalUsers: 1248,
  activeUsers: 876,
  totalDoctors: 42,
  totalPatients: 1189,
  newRegistrations: 28,
  activeSessions: 64,
  complianceScore: 94,
  systemUptime: 99.98,
  averageResponseTime: 1.2,
  pendingApprovals: 7,
}

const recentActivity = [
  {
    id: "act-001",
    user: "Dr. Sarah Williams",
    action: "Updated patient record",
    target: "Emma Thompson",
    time: "10 minutes ago",
    icon: FileText,
  },
  {
    id: "act-002",
    user: "Admin John Davis",
    action: "Added new doctor",
    target: "Dr. Michael Chen",
    time: "25 minutes ago",
    icon: UserCog,
  },
  { id: "act-003", user: "System", action: "Backup completed", target: "Database", time: "1 hour ago", icon: Shield },
  {
    id: "act-004",
    user: "Dr. Robert Kim",
    action: "Changed department",
    target: "Cardiology → Emergency",
    time: "2 hours ago",
    icon: Building2,
  },
  {
    id: "act-005",
    user: "Admin Lisa Johnson",
    action: "Modified system settings",
    target: "Triage Protocol",
    time: "3 hours ago",
    icon: Settings,
  },
]

const departments = [
  { id: "dept-001", name: "Emergency", doctors: 8, patients: 42, utilization: 78 },
  { id: "dept-002", name: "Cardiology", doctors: 6, patients: 28, utilization: 65 },
  { id: "dept-003", name: "Pediatrics", doctors: 5, patients: 34, utilization: 72 },
  { id: "dept-004", name: "Neurology", doctors: 4, patients: 19, utilization: 58 },
  { id: "dept-005", name: "Orthopedics", doctors: 5, patients: 23, utilization: 62 },
]

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-teal-50/30">
      <AdminHeader />
      <main className="flex-1 space-y-8 p-6 md:p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-600">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage healthcare system, users, and resources</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 w-[250px] rounded-full bg-white/80 backdrop-blur-sm border-teal-100 focus-visible:ring-teal-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="rounded-full px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all duration-300">
              <Bell className="mr-2 h-4 w-4" />
              Alerts
              <Badge className="ml-2 bg-white text-teal-800 hover:bg-white/90">{stats.pendingApprovals}</Badge>
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="mt-1 flex items-center text-xs text-green-600">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                <span>{stats.newRegistrations} new this week</span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Active Users</span>
                  <span className="font-medium">{Math.round((stats.activeUsers / stats.totalUsers) * 100)}%</span>
                </div>
                <Progress
                  value={Math.round((stats.activeUsers / stats.totalUsers) * 100)}
                  className="h-1.5 bg-teal-100"
                  indicatorClassName="bg-gradient-to-r from-teal-500 to-teal-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle className="text-sm font-medium">Healthcare Providers</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalDoctors}</div>
              <p className="text-xs text-muted-foreground mt-1">Across {departments.length} departments</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col items-center rounded-lg bg-blue-50 p-2">
                  <span className="font-medium text-blue-600">32</span>
                  <span className="text-muted-foreground">Active</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-amber-50 p-2">
                  <span className="font-medium text-amber-600">10</span>
                  <span className="text-muted-foreground">On Leave</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle className="text-sm font-medium">System Performance</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.systemUptime}%</div>
              <p className="text-xs text-muted-foreground mt-1">System uptime</p>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Response Time</span>
                  <span className="font-medium">{stats.averageResponseTime}s</span>
                </div>
                <Progress
                  value={Math.round((stats.averageResponseTime / 3) * 100)}
                  className="h-1.5 bg-green-100"
                  indicatorClassName="bg-gradient-to-r from-green-500 to-green-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.complianceScore}%</div>
              <div className="mt-1 flex items-center text-xs text-green-600">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                <span>2% increase from last month</span>
              </div>
              <div className="mt-4 flex items-center text-xs text-purple-600">
                <span className="inline-block h-2 w-2 rounded-full bg-purple-500 mr-1"></span>
                <span>HIPAA compliant</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid gap-6 md:grid-cols-7">
          <Card className="md:col-span-4 border-none shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>Resource allocation and utilization across departments</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {departments.map((dept) => (
                  <div key={dept.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-teal-600" />
                        <span className="font-medium">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3 text-blue-600" />
                          <span>{dept.doctors}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserCircle className="h-3 w-3 text-amber-600" />
                          <span>{dept.patients}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={dept.utilization}
                        className="h-2 flex-1 bg-teal-100"
                        indicatorClassName="bg-gradient-to-r from-teal-500 to-teal-600"
                      />
                      <span className="text-xs font-medium">{dept.utilization}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3 border-none shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>System and user activity logs</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center mt-0.5">
                      <activity.icon className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.action} - <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-full h-12 border shadow-sm">
            <TabsTrigger
              value="users"
              className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Users className="mr-2 h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger
              value="departments"
              className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Departments
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
            >
              <FileText className="mr-2 h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentManagement />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogs />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

