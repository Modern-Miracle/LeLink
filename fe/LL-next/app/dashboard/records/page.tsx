'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  Activity,
  TestTube,
  Heart,
  ArrowLeft,
} from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import DashboardHeaderWithModal from '@/components/dashboard-header-with-modal';
import { useRouter } from 'next/navigation';
import { getCurrentUserResources, getCurrentUserResourcesByType } from '@/lib/fhir-storage';
import {
  getResourceDisplayName,
  formatResourceDate,
  getResourceStatus,
  getRiskLevel,
  filterResourcesBySearch,
  sortResourcesByDate,
} from '@/lib/fhir-storage/utils';
import type {
  FHIRStorageResource,
  ObservationResource,
  RiskAssessmentResource,
  ResourceType,
} from '@/lib/fhir-storage/types';

export default function RecordsPage() {
  const router = useRouter();
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [resources, setResources] = useState<FHIRStorageResource[]>([]);
  const [filtered, setFiltered] = useState<FHIRStorageResource[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecords() {
      try {
        console.log('📋 [Records Page] Starting to load records...');
        setIsLoading(true);

        const result = await getCurrentUserResources();

        console.log('📋 [Records Page] getCurrentUserResources result:', {
          success: result.success,
          hasData: !!result.data,
          resourceCount: result.data?.resources?.length || 0,
          error: result.error,
        });

        if (result.success && result.data) {
          const sortedResources = sortResourcesByDate(result.data.resources);
          console.log('📋 [Records Page] Sorted resources:', {
            originalCount: result.data.resources.length,
            sortedCount: sortedResources.length,
            firstResourceType: sortedResources[0]?.resourceType,
            resourceTypes: [...new Set(sortedResources.map((r) => r.resourceType))],
          });

          setResources(sortedResources);
          setFiltered(sortedResources);
          setError(null);
          console.log('✅ [Records Page] Records loaded and set successfully');
        } else {
          console.log('❌ [Records Page] Failed to load records:', result.error);
          setError(result.error || 'Failed to load records');
          setResources([]);
          setFiltered([]);
        }
      } catch (error) {
        console.error('💥 [Records Page] Failed to load records:', error);
        setError('Failed to load records');
        setResources([]);
        setFiltered([]);
      } finally {
        setIsLoading(false);
        console.log('🏁 [Records Page] Records loading completed');
      }
    }
    loadRecords();
  }, []);

  useEffect(() => {
    let result = resources;

    // Apply resource type filter
    if (filter !== 'all') {
      result = result.filter((r) => r.resourceType === filter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      result = filterResourcesBySearch(result, searchTerm);
    }

    setFiltered(result);
  }, [filter, searchTerm, resources]);

  // Helper function to get resource type icon
  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'Observation':
        return <TestTube className="h-5 w-5" />;
      case 'RiskAssessment':
        return <Activity className="h-5 w-5" />;
      case 'Encounter':
        return <Heart className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Helper function to get resource type color
  const getResourceTypeColor = (resourceType: string) => {
    switch (resourceType) {
      case 'Observation':
        return 'bg-blue-100 text-blue-700';
      case 'RiskAssessment':
        return 'bg-amber-100 text-amber-700';
      case 'Encounter':
        return 'bg-purple-100 text-purple-700';
      case 'Patient':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-teal-100 text-teal-700';
    }
  };

  // Get resource counts by type
  const observationCount = resources.filter((r) => r.resourceType === 'Observation').length;
  const riskAssessmentCount = resources.filter((r) => r.resourceType === 'RiskAssessment').length;
  const encounterCount = resources.filter((r) => r.resourceType === 'Encounter').length;

  // Get recent resources (last 30 days)
  const recentResources = resources.filter((r) => {
    if (!r.meta?.lastUpdated) return false;
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return new Date(r.meta.lastUpdated) > lastMonth;
  });

  return (
    <div className="flex min-h-screen flex-col container relative">
      <DashboardHeaderWithModal />

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-black/0 backdrop-blur-[1px] z-50 flex items-center justify-center">
        <Card className="w-96 border-none shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="text-center p-8">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
              <FileText className="h-8 w-8 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
            <p className="text-gray-600 mb-4">Records management functionality is currently out of scope.</p>
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
            <h1 className="text-3xl font-bold text-teal-700">Patient Records</h1>
            <p className="text-muted-foreground">View and manage medical records</p>
          </div>
          <Button onClick={() => setShowNewRecord(true)} className="bg-teal-600 hover:bg-teal-700">
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
                <SelectItem value="Observation">Observations</SelectItem>
                <SelectItem value="RiskAssessment">Risk Assessments</SelectItem>
                <SelectItem value="Encounter">Encounters</SelectItem>
                <SelectItem value="Patient">Patient Info</SelectItem>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              <Badge className="ml-2 bg-teal-600">{resources.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex-1">
              Recent
              <Badge className="ml-2 bg-teal-600">{recentResources.length}</Badge>
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
                  {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading medical records...</div>
                  ) : error ? (
                    <div className="p-8 text-center text-red-600">Error: {error}</div>
                  ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      {searchTerm ? `No records found for "${searchTerm}"` : 'No medical records found.'}
                    </div>
                  ) : (
                    filtered.map((resource, index) => {
                      const resourceStatus = getResourceStatus(resource);
                      const displayName = getResourceDisplayName(resource);
                      const formattedDate = formatResourceDate(resource);

                      return (
                        <div
                          key={resource.id || index}
                          className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b p-4 last:border-b-0"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${getResourceTypeColor(
                              resource.resourceType
                            )}`}
                          >
                            {getResourceIcon(resource.resourceType)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{displayName}</h3>
                              <Badge variant={resourceStatus.variant}>{resource.resourceType}</Badge>
                              <Badge variant="outline" className="text-xs">
                                {resourceStatus.label}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formattedDate || 'No date'}</span>
                              </div>
                              {resource.id && (
                                <div className="flex items-center gap-1">
                                  <Tag className="h-3.5 w-3.5" />
                                  <span className="text-xs font-mono">{resource.id.slice(-8)}</span>
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
                      );
                    })
                  )}
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
                  {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading recent records...</div>
                  ) : recentResources.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No recent records found.</div>
                  ) : (
                    recentResources.map((resource, index) => {
                      const resourceStatus = getResourceStatus(resource);
                      const displayName = getResourceDisplayName(resource);
                      const formattedDate = formatResourceDate(resource);

                      return (
                        <div
                          key={resource.id || index}
                          className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b p-4 last:border-b-0"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${getResourceTypeColor(
                              resource.resourceType
                            )}`}
                          >
                            {getResourceIcon(resource.resourceType)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{displayName}</h3>
                              <Badge variant={resourceStatus.variant}>{resource.resourceType}</Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formattedDate || 'No date'}</span>
                              </div>
                              {resource.id && (
                                <div className="flex items-center gap-1">
                                  <Tag className="h-3.5 w-3.5" />
                                  <span className="text-xs font-mono">{resource.id.slice(-8)}</span>
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
                      );
                    })
                  )}
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
              <p className="text-sm text-muted-foreground">You haven't shared any medical records yet.</p>
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Record Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-muted">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading timeline...</div>
              ) : resources.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No records to display in timeline.</div>
              ) : (
                resources.slice(0, 5).map((resource, index) => {
                  const displayName = getResourceDisplayName(resource);
                  const formattedDate = formatResourceDate(resource);
                  const resourceStatus = getResourceStatus(resource);

                  // Get timeline color based on resource type
                  const timelineColor =
                    resource.resourceType === 'Observation'
                      ? 'bg-blue-600'
                      : resource.resourceType === 'RiskAssessment'
                      ? 'bg-amber-600'
                      : resource.resourceType === 'Encounter'
                      ? 'bg-purple-600'
                      : 'bg-teal-600';

                  // Get summary text based on resource type
                  let summaryText = 'Medical record entry.';
                  if (resource.resourceType === 'Observation' && 'valueString' in resource) {
                    const obsResource = resource as ObservationResource;
                    summaryText = obsResource.valueString || 'Observation recorded.';
                  } else if (resource.resourceType === 'RiskAssessment' && 'prediction' in resource) {
                    const riskResource = resource as RiskAssessmentResource;
                    const risk = riskResource.prediction?.[0];
                    const riskLevel = getRiskLevel(riskResource);
                    summaryText = risk?.rationale || `${riskLevel.label} assessment completed.`;
                  }

                  return (
                    <div key={resource.id || index} className="relative mb-8 pl-6 last:mb-0">
                      <div className={`absolute left-[-6px] top-1 h-3 w-3 rounded-full ${timelineColor}`}></div>
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-semibold">{displayName}</h3>
                        <Badge variant={resourceStatus.variant}>{resource.resourceType}</Badge>
                      </div>
                      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formattedDate || 'No date'}</span>
                      </div>
                      <p className="text-sm">{summaryText}</p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showNewRecord} onOpenChange={setShowNewRecord}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Medical Record</DialogTitle>
              <DialogDescription>Enter the details of the new medical record.</DialogDescription>
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
                <Input id="record-title" placeholder="e.g., Annual Physical Examination" />
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
                <Textarea id="record-notes" placeholder="Enter details about the medical record..." />
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
                    <div className="text-sm font-medium">Drag and drop files here or click to browse</div>
                    <div className="text-xs text-muted-foreground">Supports PDF, JPG, PNG (max 10MB)</div>
                    <Button variant="outline" size="sm" className="mt-2">
                      Browse Files
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="consent" />
                <Label htmlFor="consent" className="text-sm">
                  I confirm this information is accurate and consent to it being added to my medical records.
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewRecord(false)}>
                Cancel
              </Button>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setShowNewRecord(false)}>
                Add Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
