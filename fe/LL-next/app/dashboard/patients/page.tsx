'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Shield, Search, Filter, Plus, User, Calendar, FileText, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { useOffline } from '@/hooks/use-offline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardHeaderWithModal from '@/components/dashboard-header-with-modal';
import { useRouter } from 'next/navigation';
import { Patient } from '@/lib/types/patient';
import { calculateAge, getFullName, getInitials } from '@/lib/utils';

export default function PatientsPage() {
  const router = useRouter();
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const isOffline = useOffline();

  useEffect(() => {
    // Try to load cached patients from localStorage first
    const cachedPatients = localStorage.getItem('cached-patients');
    if (cachedPatients) {
      setPatients(JSON.parse(cachedPatients));
    }

    // Then fetch fresh data if online
    if (!isOffline) {
      async function fetchData() {
        try {
          const res = await fetch('/api/patients');
          const data = await res.json();
          setPatients(data);
          // Cache the data for offline use
          localStorage.setItem('cached-patients', JSON.stringify(data));
        } catch (error) {
          console.error('Failed to fetch patients:', error);
        }
      }
      fetchData();
    }
  }, [isOffline]);
  return (
    <div className="flex min-h-screen flex-col container relative">
      <DashboardHeaderWithModal />
      
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-black/0 backdrop-blur-[1px] z-50 flex items-center justify-center">
        <Card className="w-96 border-none shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="text-center p-8">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
              <User className="h-8 w-8 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
            <p className="text-gray-600 mb-4">Patient management functionality is currently out of scope.</p>
            <div className="flex flex-col gap-3 items-center">
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
                Out of Scope
              </Badge>
              <Button 
                onClick={() => router.push('/dashboard')} 
                variant="outline" 
                className="flex items-center gap-2 mt-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <main className="flex-1 p-4 sm:p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-teal-700">Patients</h1>
            <p className="text-muted-foreground">
              Manage and view patient information
              {isOffline && ' (Offline - Showing cached data)'}
            </p>
          </div>
          <Button onClick={() => setShowNewPatient(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                <SelectItem value="active">Active Patients</SelectItem>
                <SelectItem value="new">New Patients</SelectItem>
                <SelectItem value="inactive">Inactive Patients</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 gap-2 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search patients..." className="pl-8" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="list" className="mb-8">
          <TabsList className="w-full max-w-md bg-muted/50">
            <TabsTrigger value="list" className="flex-1">
              List View
            </TabsTrigger>
            <TabsTrigger value="grid" className="flex-1">
              Grid View
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  {patients.map((patient) => {
                    const fullName = getFullName(patient.name);
                    const initials = getInitials(patient.name);
                    const age = calculateAge(patient.birthDate);
                    const gender = patient.gender;
                    return (
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b p-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{fullName}</h3>
                            <Badge className="bg-teal-100 text-teal-800">Active</Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              <span>
                                {age} years • {gender}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Last visit: May 10, 2025</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Calendar className="mr-2 h-4 w-4" />
                                Schedule Appointment
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                View Records
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="mr-2 h-4 w-4"
                                >
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                Start Triage
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="grid" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {patients.map((el) => {
                const fullName = getFullName(el.name);
                const initials = getInitials(el.name);
                const age = calculateAge(el.birthDate);
                const gender = el.gender;

                return (
                  <Card key={el.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20">
                          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                        </Avatar>
                        <h3 className="mt-4 text-lg font-semibold">{fullName}</h3>

                        <Badge className="mt-2 bg-teal-100 text-teal-800">Active</Badge>

                        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span>
                              {age} years • {gender}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Last visit: May 10, 2025</span>
                          </div>
                        </div>

                        <div className="mt-6 flex w-full gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            View Profile
                          </Button>
                          <Button size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700">
                            <Calendar className="mr-2 h-3.5 w-3.5" />
                            Schedule
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Patient Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Patients</p>
                    <p className="text-2xl font-bold">128</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Patients</p>
                    <p className="text-2xl font-bold">98</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" x2="19" y1="8" y2="14" />
                      <line x1="22" x2="16" y1="11" y2="11" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">New Patients (30d)</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <circle cx="12" cy="10" r="2" />
                      <line x1="8" x2="8" y1="2" y2="4" />
                      <line x1="16" x2="16" y1="2" y2="4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Appointments Today</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showNewPatient} onOpenChange={setShowNewPatient}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>Enter the details of the new patient.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input id="first-name" placeholder="John" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input id="last-name" placeholder="Doe" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date-of-birth">Date of Birth</Label>
                  <Input id="date-of-birth" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john.doe@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="(123) 456-7890" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="New York" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input id="zip" placeholder="10001" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="insurance">Insurance Provider</Label>
                <Input id="insurance" placeholder="Insurance Company" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="insurance-id">Insurance ID</Label>
                <Input id="insurance-id" placeholder="ABC123456789" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPatient(false)}>
                Cancel
              </Button>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setShowNewPatient(false)}>
                Add Patient
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
