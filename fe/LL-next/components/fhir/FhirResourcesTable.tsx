"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  RefreshCw, 
  User, 
  MessageSquare, 
  Activity, 
  Shield,
  Calendar,
  Hash,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { getCurrentUserResources } from '@/lib/fhir-storage';
import { 
  getResourceDisplayName, 
  formatResourceDate, 
  getResourceStatus,
  getRiskLevel,
  isObservation,
  isRiskAssessment,
  isPatient,
  isEncounter
} from '@/lib/fhir-storage/utils';
import type { 
  FHIRStorageResource, 
  ObservationResource, 
  RiskAssessmentResource,
  PatientResource,
  EncounterResource,
  PatientResourcesData
} from '@/lib/fhir-storage/types';

interface FhirResourcesTableProps {
  className?: string;
  resourcesData?: PatientResourcesData | null;
  onRefresh?: () => void;
  loading?: boolean;
}

export function FhirResourcesTable({ 
  className, 
  resourcesData, 
  onRefresh,
  loading: externalLoading 
}: FhirResourcesTableProps) {
  const [internalResourcesData, setInternalResourcesData] = useState<PatientResourcesData | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use external data if provided, otherwise manage internally
  const data = resourcesData || internalResourcesData;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  
  // Separate resources by type
  const resources = data?.resources || [];
  const patients = resources.filter(isPatient) as PatientResource[];
  const encounters = resources.filter(isEncounter) as EncounterResource[];
  const observations = resources.filter(isObservation) as ObservationResource[];
  const riskAssessments = resources.filter(isRiskAssessment) as RiskAssessmentResource[];

  const fetchData = async () => {
    if (resourcesData) {
      // If external data provided, use external refresh function
      onRefresh?.();
      return;
    }
    
    // Internal data fetching
    console.log('📊 [FhirResourcesTable] Fetching data internally...');
    setInternalLoading(true);
    setError(null);
    try {
      const result = await getCurrentUserResources();
      
      if (result.success && result.data) {
        setInternalResourcesData(result.data);
        console.log('✅ [FhirResourcesTable] Data fetched successfully:', {
          totalCount: result.data.totalCount,
          resourceCount: result.data.resources.length
        });
      } else {
        throw new Error(result.error || 'Failed to fetch FHIR resources');
      }
    } catch (err: any) {
      console.error('💥 [FhirResourcesTable] Error fetching data:', err);
      setError(err.message);
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch internally if no external data provided
    if (!resourcesData) {
      fetchData();
    }
  }, [resourcesData]);

  const formatDate = (resource: FHIRStorageResource) => {
    const formatted = formatResourceDate(resource);
    return formatted || 'N/A';
  };

  // Utility component for truncated text with tooltip
  const TruncatedText = ({ text, maxLength = 30, className = "" }: { text: string; maxLength?: number; className?: string }) => {
    if (!text || text.length <= maxLength) {
      return <span className={className}>{text || 'N/A'}</span>;
    }

    const truncated = text.slice(0, maxLength) + '...';
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-help ${className}`}>{truncated}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm break-words bg-slate-900 text-white">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const getStatusBadge = (resource: FHIRStorageResource) => {
    const status = getResourceStatus(resource);
    
    switch (status.status.toLowerCase()) {
      case 'final':
      case 'finished':
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />{status.label}</Badge>;
      case 'preliminary':
      case 'in-progress':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{status.label}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{status.label}</Badge>;
      default:
        return <Badge variant={status.variant}>{status.label}</Badge>;
    }
  };

  const getRiskBadge = (resource: RiskAssessmentResource) => {
    const risk = getRiskLevel(resource);
    
    switch (risk.level.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{risk.label}</Badge>;
      case 'medium':
      case 'moderate':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{risk.label}</Badge>;
      case 'low':
        return <Badge variant="default" className="bg-green-100 text-green-800">{risk.label}</Badge>;
      default:
        return <Badge variant={risk.variant}>{risk.label}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading FHIR resources...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8 text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          Error loading data: {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className={`w-full ${className}`}>
        <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-teal-600" />
                <span>FHIR Resources</span>
              </CardTitle>
              <CardDescription>
                Clinical data collected during triage assessments
              </CardDescription>
            </div>
            <Button 
              onClick={fetchData} 
              variant="outline" 
              size="sm"
              className="rounded-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 px-4 sm:px-6">
          <Tabs defaultValue="overview" className="space-y-4 w-full">
            <div className="overflow-x-auto">
              <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-full h-12 border shadow-sm inline-flex w-auto min-w-max">
                <TabsTrigger value="overview" className="rounded-full h-10 px-3 sm:px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm whitespace-nowrap">
                  Overview ({data?.totalCount || 0})
                </TabsTrigger>
                <TabsTrigger value="patients" className="rounded-full h-10 px-3 sm:px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm whitespace-nowrap">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Patients</span> ({patients.length})
                </TabsTrigger>
                <TabsTrigger value="encounters" className="rounded-full h-10 px-3 sm:px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm whitespace-nowrap">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Encounters</span> ({encounters.length})
                </TabsTrigger>
                <TabsTrigger value="observations" className="rounded-full h-10 px-3 sm:px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm whitespace-nowrap">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Observations</span> ({observations.length})
                </TabsTrigger>
                <TabsTrigger value="risks" className="rounded-full h-10 px-3 sm:px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm whitespace-nowrap">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Risks</span> ({riskAssessments.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-4 text-center">
                  <User className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{patients.length}</div>
                  <div className="text-sm text-muted-foreground">Patients</div>
                </Card>
                <Card className="p-4 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{encounters.length}</div>
                  <div className="text-sm text-muted-foreground">Encounters</div>
                </Card>
                <Card className="p-4 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold">{observations.length}</div>
                  <div className="text-sm text-muted-foreground">Observations</div>
                </Card>
                <Card className="p-4 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <div className="text-2xl font-bold">{riskAssessments.length}</div>
                  <div className="text-sm text-muted-foreground">Risk Assessments</div>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Resource Type</TableHead>
                          <TableHead className="min-w-[120px]">ID</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[140px]">Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resources.slice(0, 8).map((resource, index) => (
                          <TableRow key={resource.id || index}>
                            <TableCell className="font-medium">{resource.resourceType}</TableCell>
                            <TableCell className="font-mono text-sm">
                              <Hash className="h-3 w-3 inline mr-1" />
                              <TruncatedText text={resource.id || 'N/A'} maxLength={12} />
                            </TableCell>
                            <TableCell>{getStatusBadge(resource)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(resource)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patients">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">ID</TableHead>
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[80px]">Gender</TableHead>
                      <TableHead className="min-w-[120px]">Birth Date</TableHead>
                      <TableHead className="min-w-[140px]">Contact</TableHead>
                      <TableHead className="min-w-[140px]">Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-mono text-sm">
                          <Hash className="h-3 w-3 inline mr-1" />
                          <TruncatedText text={patient.id || 'N/A'} maxLength={12} />
                        </TableCell>
                        <TableCell className="font-medium">
                          <TruncatedText text={getResourceDisplayName(patient)} maxLength={20} />
                        </TableCell>
                        <TableCell>{patient.gender || 'N/A'}</TableCell>
                        <TableCell>{patient.birthDate || 'N/A'}</TableCell>
                        <TableCell>
                          <TruncatedText text={patient.telecom?.[0]?.value || 'N/A'} maxLength={18} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(patient)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {patients.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No patients found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="encounters">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">ID</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Class</TableHead>
                      <TableHead className="min-w-[140px]">Subject</TableHead>
                      <TableHead className="min-w-[120px]">Period</TableHead>
                      <TableHead className="min-w-[140px]">Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {encounters.map((encounter) => (
                      <TableRow key={encounter.id}>
                        <TableCell className="font-mono text-sm">
                          <Hash className="h-3 w-3 inline mr-1" />
                          <TruncatedText text={encounter.id || 'N/A'} maxLength={12} />
                        </TableCell>
                        <TableCell>{getStatusBadge(encounter)}</TableCell>
                        <TableCell>
                          <TruncatedText text={encounter.class?.display || encounter.class?.code || 'N/A'} maxLength={15} />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <TruncatedText text={encounter.subject?.reference || 'N/A'} maxLength={16} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {encounter.period?.start ? new Date(encounter.period.start).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(encounter)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {encounters.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No encounters found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="observations">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">ID</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[180px]">Code</TableHead>
                      <TableHead className="min-w-[140px]">Value</TableHead>
                      <TableHead className="min-w-[140px]">Subject</TableHead>
                      <TableHead className="min-w-[140px]">Effective Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {observations.map((observation) => (
                      <TableRow key={observation.id}>
                        <TableCell className="font-mono text-sm">
                          <Hash className="h-3 w-3 inline mr-1" />
                          <TruncatedText text={observation.id || 'N/A'} maxLength={12} />
                        </TableCell>
                        <TableCell>{getStatusBadge(observation)}</TableCell>
                        <TableCell>
                          <TruncatedText text={getResourceDisplayName(observation)} maxLength={25} />
                        </TableCell>
                        <TableCell>
                          <TruncatedText 
                            text={observation.valueString || 
                                 (observation.valueQuantity ? `${observation.valueQuantity.value} ${observation.valueQuantity.unit || ''}` : '') ||
                                 'N/A'} 
                            maxLength={18} 
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <TruncatedText text={observation.subject?.reference || 'N/A'} maxLength={16} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {observation.effectiveDateTime ? new Date(observation.effectiveDateTime).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {observations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No observations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="risks">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">ID</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[180px]">Code</TableHead>
                      <TableHead className="min-w-[120px]">Risk Level</TableHead>
                      <TableHead className="min-w-[140px]">Subject</TableHead>
                      <TableHead className="min-w-[140px]">Occurrence Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskAssessments.map((risk) => (
                      <TableRow key={risk.id}>
                        <TableCell className="font-mono text-sm">
                          <Hash className="h-3 w-3 inline mr-1" />
                          <TruncatedText text={risk.id || 'N/A'} maxLength={12} />
                        </TableCell>
                        <TableCell>{getStatusBadge(risk)}</TableCell>
                        <TableCell>
                          <TruncatedText text={getResourceDisplayName(risk)} maxLength={25} />
                        </TableCell>
                        <TableCell>
                          {getRiskBadge(risk)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <TruncatedText text={risk.subject?.reference || 'N/A'} maxLength={16} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {risk.occurrenceDateTime ? new Date(risk.occurrenceDateTime).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {riskAssessments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No risk assessments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}