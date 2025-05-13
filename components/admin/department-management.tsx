"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Building2, Users, Stethoscope, Bed, Calendar, Activity } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Types
type Department = {
  id: string
  name: string
  code: string
  head: string
  doctors: number
  staff: number
  patients: number
  beds: {
    total: number
    occupied: number
  }
  status: "active" | "inactive" | "maintenance"
  utilization: number
  location: string
  createdAt: string
}

// Sample data
const departments: Department[] = [
  {
    id: "DEPT-001",
    name: "Emergency",
    code: "ER",
    head: "Dr. Sarah Williams",
    doctors: 8,
    staff: 15,
    patients: 42,
    beds: {
      total: 20,
      occupied: 16,
    },
    status: "active",
    utilization: 78,
    location: "Building A, Floor 1",
    createdAt: "2023-01-15T08:00:00Z",
  },
  {
    id: "DEPT-002",
    name: "Cardiology",
    code: "CARD",
    head: "Dr. Michael Chen",
    doctors: 6,
    staff: 12,
    patients: 28,
    beds: {
      total: 15,
      occupied: 10,
    },
    status: "active",
    utilization: 65,
    location: "Building B, Floor 3",
    createdAt: "2023-02-10T09:30:00Z",
  },
  {
    id: "DEPT-003",
    name: "Pediatrics",
    code: "PED",
    head: "Dr. Lisa Johnson",
    doctors: 5,
    staff: 10,
    patients: 34,
    beds: {
      total: 18,
      occupied: 13,
    },
    status: "active",
    utilization: 72,
    location: "Building A, Floor 2",
    createdAt: "2023-01-20T10:15:00Z",
  },
  {
    id: "DEPT-004",
    name: "Neurology",
    code: "NEURO",
    head: "Dr. Robert Kim",
    doctors: 4,
    staff: 8,
    patients: 19,
    beds: {
      total: 12,
      occupied: 7,
    },
    status: "active",
    utilization: 58,
    location: "Building B, Floor 4",
    createdAt: "2023-03-05T11:00:00Z",
  },
  {
    id: "DEPT-005",
    name: "Orthopedics",
    code: "ORTHO",
    head: "Dr. James Wilson",
    doctors: 5,
    staff: 9,
    patients: 23,
    beds: {
      total: 14,
      occupied: 9,
    },
    status: "active",
    utilization: 62,
    location: "Building A, Floor 3",
    createdAt: "2023-02-28T13:45:00Z",
  },
  {
    id: "DEPT-006",
    name: "Radiology",
    code: "RAD",
    head: "Dr. Emma Thompson",
    doctors: 3,
    staff: 7,
    patients: 15,
    beds: {
      total: 5,
      occupied: 2,
    },
    status: "maintenance",
    utilization: 45,
    location: "Building B, Floor 2",
    createdAt: "2023-01-10T09:00:00Z",
  },
]

export default function DepartmentManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [isDepartmentDetailsOpen, setIsDepartmentDetailsOpen] = useState(false)

  // Filter departments based on search query
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.head.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Get status badge
  const getStatusBadge = (status: Department["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Inactive</Badge>
      case "maintenance":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Maintenance</Badge>
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

  // Handle department selection
  const handleDepartmentClick = (department: Department) => {
    setSelectedDepartment(department)
    setIsDepartmentDetailsOpen(true)
  }

  return (
    <>
      <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Department Management</CardTitle>
              <CardDescription>Manage hospital departments, staff, and resources</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search departments..."
                  className="pl-9 w-[250px] rounded-full bg-white/80 border-teal-100 focus-visible:ring-teal-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Dialog open={isAddDepartmentOpen} onOpenChange={setIsAddDepartmentOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full px-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Department</DialogTitle>
                    <DialogDescription>Create a new department in the healthcare system.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input id="name" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="code" className="text-right">
                        Code
                      </Label>
                      <Input id="code" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="head" className="text-right">
                        Department Head
                      </Label>
                      <Input id="head" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="location" className="text-right">
                        Location
                      </Label>
                      <Input id="location" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="beds" className="text-right">
                        Total Beds
                      </Label>
                      <Input id="beds" type="number" className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDepartmentOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddDepartmentOpen(false)}>Create Department</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDepartments.map((dept) => (
              <Card
                key={dept.id}
                className="overflow-hidden border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => handleDepartmentClick(dept)}
              >
                <CardHeader className="p-4 bg-gradient-to-r from-teal-50 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{dept.name}</CardTitle>
                        <CardDescription className="text-xs">{dept.code}</CardDescription>
                      </div>
                    </div>
                    <div>{getStatusBadge(dept.status)}</div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                        <span>{dept.doctors} Doctors</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-amber-600" />
                        <span>{dept.staff} Staff</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4 text-purple-600" />
                        <span>
                          {dept.beds.occupied}/{dept.beds.total} Beds
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span>{dept.patients} Patients</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Utilization</span>
                        <span className="font-medium">{dept.utilization}%</span>
                      </div>
                      <Progress
                        value={dept.utilization}
                        className="h-1.5 bg-teal-100"
                        indicatorClassName={`${
                          dept.utilization > 80 ? "bg-red-500" : dept.utilization > 60 ? "bg-amber-500" : "bg-green-500"
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Head: {dept.head}</span>
                      <span>{dept.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Details Dialog */}
      <Dialog open={isDepartmentDetailsOpen} onOpenChange={setIsDepartmentDetailsOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-2xl">
          {selectedDepartment && (
            <>
              <DialogHeader className="p-6 bg-gradient-to-r from-teal-50 to-transparent border-b sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">{selectedDepartment.name} Department</DialogTitle>
                      <DialogDescription>
                        {selectedDepartment.code} • {selectedDepartment.location}
                      </DialogDescription>
                    </div>
                  </div>
                  <div>{getStatusBadge(selectedDepartment.status)}</div>
                </div>
              </DialogHeader>

              <div className="max-h-[70vh] overflow-y-auto">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Department Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Department Head:</span>
                          <span className="font-medium">{selectedDepartment.head}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span className="font-medium">{formatDate(selectedDepartment.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-medium">{selectedDepartment.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium">{selectedDepartment.status}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Resource Utilization</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Overall Utilization</span>
                            <span className="font-medium">{selectedDepartment.utilization}%</span>
                          </div>
                          <Progress
                            value={selectedDepartment.utilization}
                            className="h-2 bg-teal-100"
                            indicatorClassName={`${
                              selectedDepartment.utilization > 80
                                ? "bg-red-500"
                                : selectedDepartment.utilization > 60
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                            }`}
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Bed Occupancy</span>
                            <span className="font-medium">
                              {Math.round((selectedDepartment.beds.occupied / selectedDepartment.beds.total) * 100)}%
                            </span>
                          </div>
                          <Progress
                            value={Math.round((selectedDepartment.beds.occupied / selectedDepartment.beds.total) * 100)}
                            className="h-2 bg-blue-100"
                            indicatorClassName="bg-blue-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Staff Allocation</span>
                            <span className="font-medium">{Math.round((selectedDepartment.staff / 20) * 100)}%</span>
                          </div>
                          <Progress
                            value={Math.round((selectedDepartment.staff / 20) * 100)}
                            className="h-2 bg-amber-100"
                            indicatorClassName="bg-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="staff" className="mt-8">
                    <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-full h-12 border shadow-sm">
                      <TabsTrigger
                        value="staff"
                        className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Staff
                      </TabsTrigger>
                      <TabsTrigger
                        value="patients"
                        className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Patients
                      </TabsTrigger>
                      <TabsTrigger
                        value="resources"
                        className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
                      >
                        <Activity className="mr-2 h-4 w-4" />
                        Resources
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="staff" className="mt-6">
                      <Card className="border-none shadow-md">
                        <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                          <CardTitle>Staff Overview</CardTitle>
                          <CardDescription>Department personnel and assignments</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">Doctors</span>
                              </div>
                              <span>{selectedDepartment.doctors}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-amber-600" />
                                <span className="font-medium">Support Staff</span>
                              </div>
                              <span>{selectedDepartment.staff}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-purple-600" />
                                <span className="font-medium">Total Personnel</span>
                              </div>
                              <span>{selectedDepartment.doctors + selectedDepartment.staff}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="patients" className="mt-6">
                      <Card className="border-none shadow-md">
                        <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                          <CardTitle>Patient Statistics</CardTitle>
                          <CardDescription>Current patient load and capacity</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-green-600" />
                                <span className="font-medium">Current Patients</span>
                              </div>
                              <span>{selectedDepartment.patients}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Bed className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">Occupied Beds</span>
                              </div>
                              <span>
                                {selectedDepartment.beds.occupied} / {selectedDepartment.beds.total}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-red-600" />
                                <span className="font-medium">Patient-to-Doctor Ratio</span>
                              </div>
                              <span>{(selectedDepartment.patients / selectedDepartment.doctors).toFixed(1)}:1</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="resources" className="mt-6">
                      <Card className="border-none shadow-md">
                        <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                          <CardTitle>Resource Allocation</CardTitle>
                          <CardDescription>Department resources and equipment</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Bed className="h-5 w-5 text-purple-600" />
                                <span className="font-medium">Total Beds</span>
                              </div>
                              <span>{selectedDepartment.beds.total}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-teal-600" />
                                <span className="font-medium">Location</span>
                              </div>
                              <span>{selectedDepartment.location}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-amber-600" />
                                <span className="font-medium">Utilization Rate</span>
                              </div>
                              <span>{selectedDepartment.utilization}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <DialogFooter className="p-6 border-t bg-gradient-to-r from-transparent to-teal-50 sticky bottom-0">
                <div className="flex w-full justify-between items-center">
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Building2 className="mr-2 h-4 w-4" />
                    View Full Details
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setIsDepartmentDetailsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" className="rounded-full bg-gradient-to-r from-teal-600 to-teal-700">
                      Edit Department
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

