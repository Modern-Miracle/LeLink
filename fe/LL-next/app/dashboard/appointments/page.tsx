'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Shield, Calendar, ChevronLeft, ChevronRight, Plus, Search, Filter, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DashboardHeaderWithModal from '@/components/dashboard-header-with-modal';
import { useRouter } from 'next/navigation';

export default function AppointmentsPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState('May 2025');
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  return (
    <div className="flex min-h-screen flex-col container relative">
      <DashboardHeaderWithModal />

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-black/0 backdrop-blur-[1px] z-50 flex items-center justify-center">
        <Card className="w-96 border-none shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="text-center p-8">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
            <p className="text-gray-600 mb-4">Appointment management functionality is currently out of scope.</p>
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
            <h1 className="text-3xl font-bold text-teal-700">Appointments</h1>
            <p className="text-muted-foreground">Manage your upcoming appointments</p>
          </div>
          <Button onClick={() => setShowNewAppointment(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">{currentMonth}</span>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-1 gap-2 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search appointments..." className="pl-8" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="mb-8">
          <TabsList className="w-full max-w-md bg-muted/50">
            <TabsTrigger value="upcoming" className="flex-1">
              Upcoming
              <Badge className="ml-2 bg-teal-600">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1">
              Past
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1">
              Cancelled
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">
            <div className="grid gap-4">
              <Card>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex items-center justify-center border-b p-4 sm:w-32 sm:border-b-0 sm:border-r">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">MAY</div>
                        <div className="text-3xl font-bold">15</div>
                        <div className="text-sm">10:30 AM</div>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Annual Physical Examination</h3>
                        <Badge className="bg-teal-100 text-teal-800">Confirmed</Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Dr. Sarah Johnson - General Practitioner</span>
                        </div>
                        <div className="mt-1">Medical Center, Floor 3, Room 302</div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex items-center justify-center border-b p-4 sm:w-32 sm:border-b-0 sm:border-r">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">MAY</div>
                        <div className="text-3xl font-bold">22</div>
                        <div className="text-sm">2:00 PM</div>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Dental Checkup</h3>
                        <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Dr. Michael Chen - Dentist</span>
                        </div>
                        <div className="mt-1">Dental Clinic, Floor 1, Room 105</div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm">
                          Confirm
                        </Button>
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex items-center justify-center border-b p-4 sm:w-32 sm:border-b-0 sm:border-r">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">JUN</div>
                        <div className="text-3xl font-bold">05</div>
                        <div className="text-sm">9:15 AM</div>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Follow-up Consultation</h3>
                        <Badge className="bg-teal-100 text-teal-800">Confirmed</Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Dr. Sarah Johnson - General Practitioner</span>
                        </div>
                        <div className="mt-1">Medical Center, Floor 3, Room 302</div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="past">
            <div className="grid gap-4">
              <Card>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex items-center justify-center border-b p-4 sm:w-32 sm:border-b-0 sm:border-r">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">APR</div>
                        <div className="text-3xl font-bold">28</div>
                        <div className="text-sm">11:00 AM</div>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Blood Test</h3>
                        <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Dr. Emily Rodriguez - Lab Technician</span>
                        </div>
                        <div className="mt-1">Medical Center, Floor 2, Room 215</div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm">
                          View Results
                        </Button>
                        <Button variant="outline" size="sm">
                          Book Follow-up
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="cancelled">
            <div className="rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-lg font-medium">No cancelled appointments</h3>
              <p className="text-sm text-muted-foreground">You don't have any cancelled appointments at the moment.</p>
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-2 text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={`empty-start-${i}`} className="rounded-md py-2 text-sm text-muted-foreground"></div>
              ))}
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const isToday = day === 13;
                const hasAppointment = [15, 22].includes(day);
                return (
                  <div
                    key={`day-${day}`}
                    className={`rounded-md py-2 text-sm ${
                      isToday ? 'bg-teal-100 font-bold text-teal-800' : hasAppointment ? 'bg-teal-50 text-teal-800' : ''
                    }`}
                  >
                    {day}
                    {hasAppointment && <div className="mx-auto mt-1 h-1 w-1 rounded-full bg-teal-500"></div>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>Fill in the details to schedule a new appointment.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="appointment-type">Appointment Type</Label>
                <Select>
                  <SelectTrigger id="appointment-type">
                    <SelectValue placeholder="Select appointment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general-checkup">General Check-up</SelectItem>
                    <SelectItem value="follow-up">Follow-up Consultation</SelectItem>
                    <SelectItem value="specialist">Specialist Consultation</SelectItem>
                    <SelectItem value="dental">Dental Check-up</SelectItem>
                    <SelectItem value="vaccination">Vaccination</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Select>
                  <SelectTrigger id="doctor">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dr-johnson">Dr. Sarah Johnson - General Practitioner</SelectItem>
                    <SelectItem value="dr-patel">Dr. Raj Patel - Cardiologist</SelectItem>
                    <SelectItem value="dr-chen">Dr. Michael Chen - Dentist</SelectItem>
                    <SelectItem value="dr-rodriguez">Dr. Emily Rodriguez - Lab Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Add any additional information or symptoms..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewAppointment(false)}>
                Cancel
              </Button>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setShowNewAppointment(false)}>
                Schedule Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
