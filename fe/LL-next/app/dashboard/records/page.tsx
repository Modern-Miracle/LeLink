"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Shield,
  FileText,
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  Tag,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardHeaderWithModal from "@/components/dashboard-header-with-modal";
import { RecordItem } from "@/lib/types/record";

export default function RecordsPage() {
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [filtered, setFiltered] = useState<RecordItem[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/records");
        const data = await res.json();
        
        // Check if data is an array or if it's an error response
        if (Array.isArray(data)) {
          setRecords(data);
          setFiltered(data);
        } else {
          // Handle error response
          console.error("Error loading records:", data.error);
          setRecords([]);
          setFiltered([]);
        }
      } catch (error) {
        console.error("Failed to load records:", error);
        setRecords([]);
        setFiltered([]);
      }
    }
    load();
  }, []);

  useEffect(() => {
    setFiltered(
      filter === "all" ? records : records.filter((r) => r.type === filter)
    );
  }, [filter, records]);
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeaderWithModal />

      <main className="flex-1 p-4 sm:p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-teal-700">
              Patient Records
            </h1>
            <p className="text-muted-foreground">
              View and manage medical records
            </p>
          </div>
          <Button
            onClick={() => setShowNewRecord(true)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Select defaultValue="all" onValueChange={(val) => setFilter(val)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Record type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="examination">Examinations</SelectItem>
                <SelectItem value="lab">Lab Results</SelectItem>
                <SelectItem value="imaging">Imaging</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 gap-2 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search records..."
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="w-full max-w-md bg-muted/50">
            <TabsTrigger value="all" className="flex-1">
              All Records
              <Badge className="ml-2 bg-teal-600">{records.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex-1">
              Recent
              <Badge className="ml-2 bg-teal-600">2</Badge>
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  {filtered.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No medical records found.
                    </div>
                  ) : (
                    filtered.map((rec) => (
                    <div
                      key={rec.resource.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b p-4"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          rec.type === "lab"
                            ? "bg-blue-100 text-blue-700"
                            : rec.type === "imaging"
                            ? "bg-purple-100 text-purple-700"
                            : rec.type === "prescription"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{rec.title}</h3>
                          <Badge>{rec.type}</Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {new Date(rec.date).toLocaleDateString()}
                            </span>
                          </div>
                          {rec.performer && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3.5 w-3.5" />
                              <span>{rec.performer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">General Check-up</h3>
                        <Badge className="bg-teal-100 text-teal-800">
                          Examination
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>March 28, 2025</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5" />
                          <span>Dr. Sarah Johnson</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
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
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M3 15h6" />
                        <path d="M9 17v-4" />
                        <path d="M13 13v4h4" />
                        <path d="M13 17h4" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Blood Test Results</h3>
                        <Badge className="bg-blue-100 text-blue-800">
                          Lab Results
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>March 25, 2025</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5" />
                          <span>Dr. Emily Rodriguez</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="shared">
            <div className="rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-lg font-medium">No shared records</h3>
              <p className="text-sm text-muted-foreground">
                You haven't shared any medical records yet.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Record Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-muted">
              <div className="relative mb-8 pl-6">
                <div className="absolute left-[-6px] top-1 h-3 w-3 rounded-full bg-teal-600"></div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold">General Check-up</h3>
                  <Badge className="bg-teal-100 text-teal-800">
                    Examination
                  </Badge>
                </div>
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>March 28, 2025</span>
                </div>
                <p className="text-sm">
                  Routine check-up showed all vitals within normal range. Blood
                  pressure: 120/80 mmHg. Heart rate: 72 bpm. Temperature:
                  98.6°F.
                </p>
              </div>

              <div className="relative mb-8 pl-6">
                <div className="absolute left-[-6px] top-1 h-3 w-3 rounded-full bg-blue-600"></div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold">Blood Test Results</h3>
                  <Badge className="bg-blue-100 text-blue-800">
                    Lab Results
                  </Badge>
                </div>
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>March 25, 2025</span>
                </div>
                <p className="text-sm">
                  Complete blood count and metabolic panel completed. All
                  results within normal ranges. Cholesterol slightly elevated at
                  210 mg/dL.
                </p>
              </div>

              <div className="relative mb-8 pl-6">
                <div className="absolute left-[-6px] top-1 h-3 w-3 rounded-full bg-purple-600"></div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold">Chest X-Ray</h3>
                  <Badge className="bg-purple-100 text-purple-800">
                    Imaging
                  </Badge>
                </div>
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>March 20, 2025</span>
                </div>
                <p className="text-sm">
                  Chest X-ray showed clear lungs with no abnormalities detected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showNewRecord} onOpenChange={setShowNewRecord}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Medical Record</DialogTitle>
              <DialogDescription>
                Enter the details of the new medical record.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="record-type">Record Type</Label>
                <Select>
                  <SelectTrigger id="record-type">
                    <SelectValue placeholder="Select record type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="examination">Examination</SelectItem>
                    <SelectItem value="lab-results">Lab Results</SelectItem>
                    <SelectItem value="imaging">Imaging</SelectItem>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="vaccination">Vaccination</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="record-title">Title</Label>
                <Input
                  id="record-title"
                  placeholder="e.g., Annual Physical Examination"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="doctor">Healthcare Provider</Label>
                <Input id="doctor" placeholder="e.g., Dr. Sarah Johnson" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="record-date">Date</Label>
                  <Input id="record-date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="record-time">Time</Label>
                  <Input id="record-time" type="time" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="record-notes">Notes</Label>
                <Textarea
                  id="record-notes"
                  placeholder="Enter details about the medical record..."
                />
              </div>
              <div className="grid gap-2">
                <Label>Attachments</Label>
                <div className="rounded-md border border-dashed p-4">
                  <div className="flex flex-col items-center gap-2 text-center">
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
                      className="h-8 w-8 text-muted-foreground"
                    >
                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                      <path d="M12 12v9" />
                      <path d="m16 16-4-4-4 4" />
                    </svg>
                    <div className="text-sm font-medium">
                      Drag and drop files here or click to browse
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Supports PDF, JPG, PNG (max 10MB)
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      Browse Files
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="consent" />
                <Label htmlFor="consent" className="text-sm">
                  I confirm this information is accurate and consent to it being
                  added to my medical records.
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewRecord(false)}>
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => setShowNewRecord(false)}
              >
                Add Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
