"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Download,
  Calendar,
  UserCog,
  Shield,
  Settings,
  Database,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

// Types
type LogType = "security" | "user" | "system" | "data" | "error"
type LogSeverity = "info" | "warning" | "error" | "critical"

type AuditLog = {
  id: string
  timestamp: string
  user: string
  action: string
  type: LogType
  severity: LogSeverity
  ipAddress: string
  details: string
}

// Sample data
const auditLogs: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2025-04-07T11:30:00Z",
    user: "Admin John Davis",
    action: "User account created",
    type: "user",
    severity: "info",
    ipAddress: "192.168.1.100",
    details: "Created new doctor account for Dr. Michael Chen",
  },
  {
    id: "LOG-002",
    timestamp: "2025-04-07T11:15:00Z",
    user: "Dr. Sarah Williams",
    action: "Patient record accessed",
    type: "data",
    severity: "info",
    ipAddress: "192.168.1.101",
    details: "Accessed medical records for patient Emma Thompson",
  },
  {
    id: "LOG-003",
    timestamp: "2025-04-07T10:45:00Z",
    user: "System",
    action: "Database backup",
    type: "system",
    severity: "info",
    ipAddress: "192.168.1.1",
    details: "Scheduled daily database backup completed successfully",
  },
  {
    id: "LOG-004",
    timestamp: "2025-04-07T10:30:00Z",
    user: "Admin Lisa Johnson",
    action: "System settings changed",
    type: "system",
    severity: "warning",
    ipAddress: "192.168.1.102",
    details: "Modified security settings: password policy updated",
  },
  {
    id: "LOG-005",
    timestamp: "2025-04-07T10:15:00Z",
    user: "Unknown",
    action: "Failed login attempt",
    type: "security",
    severity: "warning",
    ipAddress: "203.0.113.45",
    details: "Multiple failed login attempts for admin account",
  },
  {
    id: "LOG-006",
    timestamp: "2025-04-07T10:00:00Z",
    user: "Dr. Robert Kim",
    action: "Patient data modified",
    type: "data",
    severity: "info",
    ipAddress: "192.168.1.103",
    details: "Updated treatment plan for patient James Wilson",
  },
  {
    id: "LOG-007",
    timestamp: "2025-04-07T09:45:00Z",
    user: "System",
    action: "API integration error",
    type: "error",
    severity: "error",
    ipAddress: "192.168.1.1",
    details: "Failed to connect to external EHR system: timeout",
  },
  {
    id: "LOG-008",
    timestamp: "2025-04-07T09:30:00Z",
    user: "Security Module",
    action: "Suspicious activity detected",
    type: "security",
    severity: "critical",
    ipAddress: "198.51.100.23",
    details: "Potential data breach attempt detected and blocked",
  },
  {
    id: "LOG-009",
    timestamp: "2025-04-07T09:15:00Z",
    user: "Admin John Davis",
    action: "Department created",
    type: "system",
    severity: "info",
    ipAddress: "192.168.1.100",
    details: "Created new department: Radiology",
  },
  {
    id: "LOG-010",
    timestamp: "2025-04-07T09:00:00Z",
    user: "System",
    action: "System update",
    type: "system",
    severity: "info",
    ipAddress: "192.168.1.1",
    details: "Applied system update v2.5.3",
  },
]

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<LogType | "all">("all")
  const [severityFilter, setSeverityFilter] = useState<LogSeverity | "all">("all")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AuditLog
    direction: "ascending" | "descending"
  }>({ key: "timestamp", direction: "descending" })

  // Filter logs based on search query and filters
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === "all" || log.type === typeFilter
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter

    // Filter by date if selected
    const matchesDate = !date || new Date(log.timestamp).toDateString() === date.toDateString()

    return matchesSearch && matchesType && matchesSeverity && matchesDate
  })

  // Sort logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
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
  const requestSort = (key: keyof AuditLog) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Get sort direction indicator
  const getSortDirectionIndicator = (key: keyof AuditLog) => {
    if (sortConfig.key !== key) {
      return null
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  // Get type badge
  const getTypeBadge = (type: LogType) => {
    switch (type) {
      case "security":
        return <Badge className="bg-red-500 hover:bg-red-600">Security</Badge>
      case "user":
        return <Badge className="bg-blue-500 hover:bg-blue-600">User</Badge>
      case "system":
        return <Badge className="bg-purple-500 hover:bg-purple-600">System</Badge>
      case "data":
        return <Badge className="bg-teal-500 hover:bg-teal-600">Data</Badge>
      case "error":
        return <Badge className="bg-orange-500 hover:bg-orange-600">Error</Badge>
    }
  }

  // Get severity badge
  const getSeverityBadge = (severity: LogSeverity) => {
    switch (severity) {
      case "info":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            Info
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            Warning
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="border-red-500 text-red-600">
            Error
          </Badge>
        )
      case "critical":
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-600">
            Critical
          </Badge>
        )
    }
  }

  // Get type icon
  const getTypeIcon = (type: LogType) => {
    switch (type) {
      case "security":
        return <Shield className="h-4 w-4 text-red-500" />
      case "user":
        return <UserCog className="h-4 w-4 text-blue-500" />
      case "system":
        return <Settings className="h-4 w-4 text-purple-500" />
      case "data":
        return <Database className="h-4 w-4 text-teal-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date)
  }

  return (
    <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>System activity and security audit trail</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as LogType | "all")}>
                <SelectTrigger className="w-[130px] h-9 rounded-full bg-white/80 border-teal-100">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as LogSeverity | "all")}>
                <SelectTrigger className="w-[130px] h-9 rounded-full bg-white/80 border-teal-100">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 rounded-full bg-white/80 border-teal-100 flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    {date ? format(date, "PPP") : "Filter by date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  className="pl-9 h-9 rounded-full bg-white/80 border-teal-100 focus-visible:ring-teal-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button className="rounded-full h-9 px-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
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
                  <button
                    className="flex items-center gap-1 hover:text-teal-700"
                    onClick={() => requestSort("timestamp")}
                  >
                    Timestamp {getSortDirectionIndicator("timestamp")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-teal-700" onClick={() => requestSort("user")}>
                    User {getSortDirectionIndicator("user")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-teal-700" onClick={() => requestSort("action")}>
                    Action {getSortDirectionIndicator("action")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-teal-700" onClick={() => requestSort("type")}>
                    Type {getSortDirectionIndicator("type")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <button
                    className="flex items-center gap-1 hover:text-teal-700"
                    onClick={() => requestSort("severity")}
                  >
                    Severity {getSortDirectionIndicator("severity")}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-teal-50/50 transition-colors">
                  <td className="px-4 py-4 text-sm">{log.id}</td>
                  <td className="px-4 py-4 text-sm">{formatDate(log.timestamp)}</td>
                  <td className="px-4 py-4 text-sm">{log.user}</td>
                  <td className="px-4 py-4 text-sm max-w-[200px] truncate">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(log.type)}
                      <span>{log.action}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">{getTypeBadge(log.type)}</td>
                  <td className="px-4 py-4 text-sm">{getSeverityBadge(log.severity)}</td>
                  <td className="px-4 py-4 text-sm text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full hover:bg-teal-100"
                      title="View Details"
                    >
                      <span className="sr-only">View details</span>
                      <Eye className="h-4 w-4" />
                    </Button>
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

