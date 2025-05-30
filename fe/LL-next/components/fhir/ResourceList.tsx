import React from 'react';
import { ObservationCard } from './ObservationCard';
import { RiskAssessmentCard } from './RiskAssessmentCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnyFhirResource, Observation, RiskAssessment, Condition } from '@/lib/types/fhir';
import { FileText, Hash, Activity } from 'lucide-react';

interface ResourceListProps {
  resources: AnyFhirResource[];
  className?: string;
}

// Generic card for resources we don't have specific components for
function GenericResourceCard({ resource, className }: { resource: AnyFhirResource; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{resource.resourceType}</CardTitle>
          </div>
          {resource.id && (
            <Badge variant="outline">
              <Hash className="h-3 w-3 mr-1" />
              {resource.id}
            </Badge>
          )}
        </div>
        <CardDescription>
          FHIR Resource
          {resource.meta?.lastUpdated && (
            <span className="ml-2 text-xs">
              Updated: {new Date(resource.meta.lastUpdated).toLocaleDateString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <pre className="bg-muted p-2 rounded-md overflow-x-auto">
            {JSON.stringify(resource, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

// Condition-specific card
function ConditionCard({ condition, className }: { condition: Condition; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Condition</CardTitle>
          </div>
          {condition.clinicalStatus && (
            <Badge variant={condition.clinicalStatus.coding?.[0]?.code === 'active' ? 'default' : 'secondary'}>
              {condition.clinicalStatus.text || condition.clinicalStatus.coding?.[0]?.display || 'Status'}
            </Badge>
          )}
        </div>
        <CardDescription>
          {condition.code?.text || condition.code?.coding?.[0]?.display || 'Medical condition'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {condition.severity && (
          <div>
            <span className="text-sm font-medium text-muted-foreground">Severity: </span>
            <span className="text-sm">
              {condition.severity.text || condition.severity.coding?.[0]?.display}
            </span>
          </div>
        )}
        
        {condition.onsetDateTime && (
          <div>
            <span className="text-sm font-medium text-muted-foreground">Onset: </span>
            <span className="text-sm">
              {new Date(condition.onsetDateTime).toLocaleDateString()}
            </span>
          </div>
        )}

        {condition.note && condition.note.length > 0 && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Notes</div>
            <p className="text-sm text-muted-foreground">
              {condition.note[0].text}
            </p>
          </div>
        )}

        {condition.id && (
          <div className="pt-2 border-t">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span>ID: {condition.id}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResourceList({ resources, className }: ResourceListProps) {
  if (!resources || resources.length === 0) {
    return (
      <div className={`text-center text-muted-foreground py-8 ${className}`}>
        No FHIR resources available
      </div>
    );
  }

  const renderResource = (resource: AnyFhirResource, index: number) => {
    const key = resource.id || `resource-${index}`;
    
    switch (resource.resourceType) {
      case 'Observation':
        return <ObservationCard key={key} observation={resource as Observation} />;
      
      case 'RiskAssessment':
        return <RiskAssessmentCard key={key} riskAssessment={resource as RiskAssessment} />;
      
      case 'Condition':
        return <ConditionCard key={key} condition={resource as Condition} />;
      
      default:
        return <GenericResourceCard key={key} resource={resource} />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm text-muted-foreground mb-2">
        {resources.length} FHIR resource{resources.length !== 1 ? 's' : ''} generated
      </div>
      {resources.map((resource, index) => renderResource(resource, index))}
    </div>
  );
}