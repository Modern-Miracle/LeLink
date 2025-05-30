"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Clock, AlertTriangle, Users, Activity, ChevronDown, ChevronUp, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import DoctorHeader from "@/components/doctor-header"
import PatientDetails from "@/components/patient-details"

// Types
type Patient = {
  id: string
  name: string
  age: number
  gender: string
  chiefComplaint: string
  waitTime: number // in minutes
  severity: "critical" | "urgent" | "standard" | "non-urgent"
  status: "waiting" | "in-progress" | "completed" | "no-show"
  vitalSigns: {
    bloodPressure: string
    heartRate: number
    respiratoryRate: number
    temperature: number
    oxygenSaturation: number
  }
  triageNotes: string
  medicalHistory: string[]
  allergies: string[]
  medications: string[]
  lastUpdated: string
  avatar?: string
}

// Sample data
const patients: Patient[] = [
  {
    id: "P-1001",
    name: "Emma Thompson",
    age: 42,
    gender: "Female",
    chiefComplaint: "Chest pain and shortness of breath",
    waitTime: 5,
    severity: "critical",
    status: "waiting",
    vitalSigns: {
      bloodPressure: "160/95",
      heartRate: 110,
      respiratoryRate: 24,
      temperature: 37.8,
      oxygenSaturation: 92,
    },
    triageNotes: "Patient reports sudden onset of chest pain radiating to left arm. History of hypertension.",
    medicalHistory: ["Hypertension", "Type 2 Diabetes"],
    allergies: ["Penicillin"],
    medications: ["Lisinopril", "Metformin"],
    lastUpdated: "2025-04-07T11:15:00Z",
  },
  {
    id: "P-1002",
    name: "Michael Chen",
    age: 28,
    gender: "Male",
    chiefComplaint: "Severe abdominal pain",
    waitTime: 15,
    severity: "urgent",
    status: "waiting",
    vitalSigns: {
      bloodPressure: "135/85",
      heartRate: 95,
      respiratoryRate: 18,
      temperature: 38.2,
      oxygenSaturation: 98,
    },
    triageNotes: "Acute onset of right lower quadrant pain. Pain score 8/10. No vomiting.",
    medicalHistory: ["None"],
    allergies: ["None"],
    medications: ["None"],
    lastUpdated: "2025-04-07T11:05:00Z",
  },
  {
    id: "P-1003",
    name: "Sophia Rodriguez",
    age: 65,
    gender: "Female",
    chiefComplaint: "Dizziness and confusion",
    waitTime: 25,
    severity: "urgent",
    status: "in-progress",
    vitalSigns: {
      bloodPressure: "110/70",
      heartRate: 88,
      respiratoryRate: 16,
      temperature: 36.9,
      oxygenSaturation: 95,
    },
    triageNotes: "Gradual onset of dizziness over 24 hours. Family reports confusion and disorientation.",
    medicalHistory: ["Atrial Fibrillation", "Stroke (2023)"],
    allergies: ["Sulfa drugs"],
    medications: ["Warfarin", "Amiodarone", "Atorvastatin"],
    lastUpdated: "2025-04-07T10:55:00Z",
  },
  {
    id: "P-1004",
    name: "James Wilson",
    age: 34,
    gender: "Male",
    chiefComplaint: "Sprained ankle",
    waitTime: 45,
    severity: "standard",
    status: "waiting",
    vitalSigns: {
      bloodPressure: "125/80",
      heartRate: 72,
      respiratoryRate: 14,
      temperature: 36.7,
      oxygenSaturation: 99,
    },
    triageNotes: "Injury occurred during basketball game 2 hours ago. Moderate swelling and pain with weight bearing.",
    medicalHistory: ["Asthma"],
    allergies: ["None"],
    medications: ["Albuterol inhaler"],
    lastUpdated: "2025-04-07T10:35:00Z",
  },
  {
    id: "P-1005",
    name: "Olivia Johnson",
    age: 8,
    gender: "Female",
    chiefComplaint: "Fever and sore throat",
    waitTime: 35,
    severity: "standard",
    status: "waiting",
    vitalSigns: {
      bloodPressure: "100/65",
      heartRate: 100,
      respiratoryRate: 20,
      temperature: 39.1,
      oxygenSaturation: 97,
    },
    triageNotes: "Fever started yesterday. Parent reports decreased appetite and difficulty swallowing.",
    medicalHistory: ["Eczema"],
    allergies: ["None"],
    medications: ["None"],
    lastUpdated: "2025-04-07T10:45:00Z",
  },
  {
    id: "P-1006",
    name: "Robert Kim",
    age: 72,
    gender: "Male",
    chiefComplaint: "Lower back pain",
    waitTime: 60,
    severity: "non-urgent",
    status: "waiting",
    vitalSigns: {
      bloodPressure: "145/85",
      heartRate: 76,
      respiratoryRate: 16,
      temperature: 36.8,
      oxygenSaturation: 96,
    },
    triageNotes: "Chronic back pain with acute exacerbation after gardening yesterday.",
    medicalHistory: ["Hypertension", "Osteoarthritis", "BPH"],
    allergies: ["Codeine"],
    medications: ["Lisinopril", "Tamsulosin", "Acetaminophen"],
    lastUpdated: "2025-04-07T10:20:00Z",
  },
  {
    id: "P-1007",
    name: "Aisha Patel",
    age: 31,
    gender: "Female",
    chiefComplaint: "Migraine headache",
    waitTime: 40,
    severity: "standard",
    status: "completed",
    vitalSigns: {
      bloodPressure: "120/75",
      heartRate: 82,
      respiratoryRate: 16,
      temperature: 36.6,
      oxygenSaturation: 99,
    },
    triageNotes: "Recurrent migraine with visual aura. Pain score 7/10. Photophobia and nausea present.",
    medicalHistory: ["Migraine", "Anxiety"],
    allergies: ["None"],
    medications: ["Sumatriptan", "Propranolol"],
    lastUpdated: "2025-04-07T10:40:00Z",
  },
  {
    id: "P-1008",
    name: "David Okonkwo",
    age: 45,
    gender: "Male",
    chiefComplaint: "Laceration to right hand",
    waitTime: 20,
    severity: "urgent",
    status: "in-progress",
    vitalSigns: {
      bloodPressure: "130/85",
      heartRate: 88,
      respiratoryRate: 16,
      temperature: 36.7,
      oxygenSaturation: 98,
    },
    triageNotes: "Deep laceration to palm from kitchen knife. Bleeding controlled with pressure.",
    medicalHistory: ["None"],
    allergies: ["Latex"],
    medications: ["None"],
    lastUpdated: "2025-04-07T11:00:00Z",
  },
]

// Dashboard stats
const stats = {
  totalPatients: patients.length,
  waiting: patients.filter((p) => p.status === "waiting").length,
  inProgress: patients.filter((p) => p.status === "in-progress").length,
  completed: patients.filter((p) => p.status === "completed").length,
  critical: patients.filter((p) => p.severity === "critical").length,
  urgent: patients.filter((p) => p.severity === "urgent").length,
  averageWaitTime: Math.round(patients.reduce((acc, p) => acc + p.waitTime, 0) / patients.length),
}

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Patient | "waitTime" | "severity"
    direction: "ascending" | "descending"
  } | null>(null)

  // Filter patients based on search query
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Sort patients
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (!sortConfig) {
      // Default sort: critical first, then by wait time
      if (a.severity === "critical" && b.severity !== "critical") return -1
      if (a.severity !== "critical" && b.severity === "critical") return 1
      return b.waitTime - a.waitTime
    }

    const { key, direction } = sortConfig

    if (key === "severity") {
      const severityOrder = { critical: 0, urgent: 1, standard: 2, "non-urgent": 3 }
      const comparison = severityOrder[a.severity] - severityOrder[b.severity]
      return direction === "ascending" ? comparison : -comparison
    }

    if (key === "waitTime") {
      return direction === "ascending" ? a.waitTime - b.waitTime : b.waitTime - a.waitTime
    }

    if (a[key] < b[key]) {
      return direction === "ascending" ? -1 : 1
    }
    if (a[key] > b[key]) {
      return direction === "ascending" ? 1 : -1
    }
    return 0
  })

  // Handle sort
  const requestSort = (key: keyof Patient | "waitTime" | "severity") => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Get sort direction indicator
  const getSortDirectionIndicator = (key: keyof Patient | "waitTime" | "severity") => {
    if (!sortConfig || sortConfig.key !== key) {
      return null
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  // Handle patient selection
  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsDetailsOpen(true)
  }

  // Get severity badge
  const getSeverityBadge = (severity: Patient["severity"]) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-500 hover:bg-red-600">Critical</Badge>
      case "urgent":
        return <Badge className="bg-orange-500 hover:bg-orange-600">Urgent</Badge>
      case "standard":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Standard</Badge>
      case "non-urgent":
        return <Badge className="bg-green-500 hover:bg-green-600">Non-urgent</Badge>
    }
  }

  // Get status badge
  const getStatusBadge = (status: Patient["status"]) => {
    switch (status) {
      case "waiting":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            Waiting
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            In Progress
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            Completed
          </Badge>
        )
      case "no-show":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-600">
            No Show
          </Badge>
        )
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-teal-50/30">
      <DoctorHeader />
      <main className="flex-1 space-y-8 p-6 md:p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-600">
              Triage Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage patient flow and prioritize care</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                className="pl-9 w-[250px] rounded-full bg-white/80 backdrop-blur-sm border-teal-100 focus-visible:ring-teal-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-full bg-white/80 backdrop-blur-sm border-teal-100">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="flex flex-col items-center rounded-lg bg-teal-50 p-2">
                  <span className="font-medium text-teal-600">{stats.waiting}</span>
                  <span className="text-muted-foreground">Waiting</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-blue-50 p-2">
                  <span className="font-medium text-blue-600">{stats.inProgress}</span>
                  <span className="text-muted-foreground">In Progress</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-green-50 p-2">
                  <span className="font-medium text-green-600">{stats.completed}</span>
                  <span className="text-muted-foreground">Completed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.critical}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.urgent} urgent cases</p>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Critical Capacity</span>
                  <span className="font-medium">{Math.round((stats.critical / 5) * 100)}%</span>
                </div>
                <Progress
                  value={Math.round((stats.critical / 5) * 100)}
                  className="h-1.5 bg-red-100"
                  indicatorClassName="bg-gradient-to-r from-red-500 to-red-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle className="text-sm font-medium">Average Wait Time</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.averageWaitTime} min</div>
              <p className="text-xs text-muted-foreground mt-1">Across all patients</p>
              <div className="mt-4 flex items-center text-xs text-amber-600">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1"></span>
                <span>5 min above target</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle className="text-sm font-medium">Department Status</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">Operational</div>
              <p className="text-xs text-muted-foreground mt-1">All systems normal</p>
              <div className="mt-4 flex items-center text-xs text-green-600">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                <span>4 doctors on duty</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-full h-12 border shadow-sm">
            <TabsTrigger
              value="all"
              className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
            >
              All Patients
            </TabsTrigger>
            <TabsTrigger
              value="waiting"
              className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
            >
              Waiting
            </TabsTrigger>
            <TabsTrigger
              value="in-progress"
              className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
            >
              In Progress
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
            >
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                <CardTitle>Patient Queue</CardTitle>
                <CardDescription>Manage and prioritize patients based on severity and wait time</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-teal-50/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          <button
                            className="flex items-center gap-1 hover:text-teal-700"
                            onClick={() => requestSort("id")}
                          >
                            ID {getSortDirectionIndicator("id")}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          <button
                            className="flex items-center gap-1 hover:text-teal-700"
                            onClick={() => requestSort("name")}
                          >
                            Patient {getSortDirectionIndicator("name")}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          <button
                            className="flex items-center gap-1 hover:text-teal-700"
                            onClick={() => requestSort("chiefComplaint")}
                          >
                            Chief Complaint {getSortDirectionIndicator("chiefComplaint")}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          <button
                            className="flex items-center gap-1 hover:text-teal-700"
                            onClick={() => requestSort("waitTime")}
                          >
                            Wait Time {getSortDirectionIndicator("waitTime")}
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
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          <button
                            className="flex items-center gap-1 hover:text-teal-700"
                            onClick={() => requestSort("status")}
                          >
                            Status {getSortDirectionIndicator("status")}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPatients.map((patient) => (
                        <tr
                          key={patient.id}
                          className={`border-b hover:bg-teal-50/50 cursor-pointer transition-colors ${
                            patient.severity === "critical"
                              ? "bg-red-50/30"
                              : patient.severity === "urgent"
                                ? "bg-orange-50/30"
                                : ""
                          }`}
                          onClick={() => handlePatientClick(patient)}
                        >
                          <td className="px-4 py-4 text-sm">{patient.id}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={patient.avatar || `/placeholder.svg?height=32&width=32`}
                                  alt={patient.name}
                                />
                                <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{patient.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {patient.age} yrs, {patient.gender}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm max-w-[200px] truncate">{patient.chiefComplaint}</td>
                          <td className="px-4 py-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{patient.waitTime} min</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">{getSeverityBadge(patient.severity)}</td>
                          <td className="px-4 py-4 text-sm">{getStatusBadge(patient.status)}</td>
                          <td className="px-4 py-4 text-sm text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full hover:bg-teal-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePatientClick(patient)
                              }}
                            >
                              <span className="sr-only">View details</span>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waiting" className="space-y-6">
            <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                <CardTitle>Waiting Patients</CardTitle>
                <CardDescription>Patients currently in the waiting area</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-teal-50/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Patient</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Chief Complaint
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Wait Time</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Severity</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPatients
                        .filter((patient) => patient.status === "waiting")
                        .map((patient) => (
                          <tr
                            key={patient.id}
                            className={`border-b hover:bg-teal-50/50 cursor-pointer transition-colors ${
                              patient.severity === "critical"
                                ? "bg-red-50/30"
                                : patient.severity === "urgent"
                                  ? "bg-orange-50/30"
                                  : ""
                            }\`}  : 
                              patient.severity === 'urgent' ? 'bg-orange-50/30' : ''
                            }`}
                            onClick={() => handlePatientClick(patient)}
                          >
                            <td className="px-4 py-4 text-sm">{patient.id}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={patient.avatar || `/placeholder.svg?height=32&width=32`}
                                    alt={patient.name}
                                  />
                                  <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{patient.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {patient.age} yrs, {patient.gender}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm max-w-[200px] truncate">{patient.chiefComplaint}</td>
                            <td className="px-4 py-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>{patient.waitTime} min</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm">{getSeverityBadge(patient.severity)}</td>
                            <td className="px-4 py-4 text-sm text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-teal-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePatientClick(patient)
                                }}
                              >
                                <span className="sr-only">View details</span>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-6">
            <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                <CardTitle>In Progress</CardTitle>
                <CardDescription>Patients currently being treated</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-teal-50/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Patient</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Chief Complaint
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Assigned To</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Severity</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPatients
                        .filter((patient) => patient.status === "in-progress")
                        .map((patient) => (
                          <tr
                            key={patient.id}
                            className="border-b hover:bg-teal-50/50 cursor-pointer transition-colors"
                            onClick={() => handlePatientClick(patient)}
                          >
                            <td className="px-4 py-4 text-sm">{patient.id}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={patient.avatar || `/placeholder.svg?height=32&width=32`}
                                    alt={patient.name}
                                  />
                                  <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{patient.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {patient.age} yrs, {patient.gender}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm max-w-[200px] truncate">{patient.chiefComplaint}</td>
                            <td className="px-4 py-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src="/placeholder.svg?height=24&width=24" alt="Doctor" />
                                  <AvatarFallback>DR</AvatarFallback>
                                </Avatar>
                                <span>Dr. Williams</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm">{getSeverityBadge(patient.severity)}</td>
                            <td className="px-4 py-4 text-sm text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-teal-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePatientClick(patient)
                                }}
                              >
                                <span className="sr-only">View details</span>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                <CardTitle>Completed</CardTitle>
                <CardDescription>Patients who have completed their visit</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-teal-50/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Patient</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Chief Complaint
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Outcome</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Severity</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPatients
                        .filter((patient) => patient.status === "completed")
                        .map((patient) => (
                          <tr
                            key={patient.id}
                            className="border-b hover:bg-teal-50/50 cursor-pointer transition-colors"
                            onClick={() => handlePatientClick(patient)}
                          >
                            <td className="px-4 py-4 text-sm">{patient.id}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={patient.avatar || `/placeholder.svg?height=32&width=32`}
                                    alt={patient.name}
                                  />
                                  <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{patient.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {patient.age} yrs, {patient.gender}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm max-w-[200px] truncate">{patient.chiefComplaint}</td>
                            <td className="px-4 py-4 text-sm">
                              <Badge className="bg-green-500 hover:bg-green-600">Discharged</Badge>
                            </td>
                            <td className="px-4 py-4 text-sm">{getSeverityBadge(patient.severity)}</td>
                            <td className="px-4 py-4 text-sm text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-teal-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePatientClick(patient)
                                }}
                              >
                                <span className="sr-only">View details</span>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Patient Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-2xl">
          {selectedPatient && (
            <>
              <DialogHeader className="p-6 bg-gradient-to-r from-teal-50 to-transparent border-b sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={selectedPatient.avatar || `/placeholder.svg?height=40&width=40`}
                        alt={selectedPatient.name}
                      />
                      <AvatarFallback>{selectedPatient.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-xl">{selectedPatient.name}</DialogTitle>
                      <DialogDescription>
                        {selectedPatient.age} years, {selectedPatient.gender} • Patient ID: {selectedPatient.id}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(selectedPatient.severity)}
                    {getStatusBadge(selectedPatient.status)}
                  </div>
                </div>
              </DialogHeader>

              <div className="max-h-[70vh] overflow-y-auto">
                <PatientDetails patient={selectedPatient} />
              </div>

              <DialogFooter className="p-6 border-t bg-gradient-to-r from-transparent to-teal-50 sticky bottom-0">
                <div className="flex w-full justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full">
                      <FileText className="mr-2 h-4 w-4" />
                      View Full Record
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setIsDetailsOpen(false)}
                    >
                      Cancel
                    </Button>
                    {selectedPatient.status === "waiting" ? (
                      <Button size="sm" className="rounded-full bg-gradient-to-r from-teal-600 to-teal-700">
                        Begin Treatment
                      </Button>
                    ) : selectedPatient.status === "in-progress" ? (
                      <Button size="sm" className="rounded-full bg-gradient-to-r from-teal-600 to-teal-700">
                        Complete Treatment
                      </Button>
                    ) : (
                      <Button size="sm" className="rounded-full bg-gradient-to-r from-teal-600 to-teal-700">
                        Reopen Case
                      </Button>
                    )}
                  </div>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

