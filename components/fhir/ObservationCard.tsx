import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Observation } from '@/lib/types/fhir';
import { Activity, Calendar, FileText, Hash } from 'lucide-react';

interface ObservationCardProps {
  observation: Observation;
  className?: string;
}

export function ObservationCard({ observation, className }: ObservationCardProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'final':
        return 'default';
      case 'preliminary':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatValue = () => {
    if (observation.valueString) {
      return observation.valueString;
    }
    if (observation.valueQuantity) {
      return `${observation.valueQuantity.value} ${observation.valueQuantity.unit || ''}`;
    }
    if (observation.valueCodeableConcept) {
      return observation.valueCodeableConcept.text || 
        observation.valueCodeableConcept.coding?.[0]?.display || 
        'Coded value';
    }
    if (observation.valueBoolean !== undefined) {
      return observation.valueBoolean ? 'Yes' : 'No';
    }
    return 'No value recorded';
  };

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return 'Not recorded';
    return new Date(dateTime).toLocaleString();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Observation</CardTitle>
          </div>
          <Badge variant={getStatusBadgeVariant(observation.status)}>
            {observation.status}
          </Badge>
        </div>
        <CardDescription>
          {observation.code.text || observation.code.coding?.[0]?.display || 'Clinical observation'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center space-x-1 text-muted-foreground mb-1">
              <FileText className="h-3 w-3" />
              <span className="font-medium">Value</span>
            </div>
            <p className="text-foreground">{formatValue()}</p>
          </div>
          
          <div>
            <div className="flex items-center space-x-1 text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">Date</span>
            </div>
            <p className="text-foreground text-xs">
              {formatDateTime(observation.effectiveDateTime)}
            </p>
          </div>
        </div>

        {observation.interpretation && observation.interpretation.length > 0 && (
          <div>
            <div className="flex items-center space-x-1 text-muted-foreground mb-1">
              <span className="font-medium text-sm">Interpretation</span>
            </div>
            <p className="text-sm">
              {observation.interpretation[0].text || 
               observation.interpretation[0].coding?.[0]?.display || 
               'Interpretation available'}
            </p>
          </div>
        )}

        {observation.note && observation.note.length > 0 && (
          <div>
            <div className="text-muted-foreground mb-1">
              <span className="font-medium text-sm">Notes</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {observation.note[0].text}
            </p>
          </div>
        )}

        {observation.id && (
          <div className="pt-2 border-t">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span>ID: {observation.id}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}