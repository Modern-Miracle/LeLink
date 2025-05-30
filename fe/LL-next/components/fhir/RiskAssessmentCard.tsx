import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RiskAssessment } from '@/lib/types/fhir';
import { AlertTriangle, Calendar, Hash, Shield, TrendingUp } from 'lucide-react';

interface RiskAssessmentCardProps {
  riskAssessment: RiskAssessment;
  className?: string;
}

export function RiskAssessmentCard({ riskAssessment, className }: RiskAssessmentCardProps) {
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

  const getRiskLevelColor = (risk?: string) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'moderate':
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return 'Not recorded';
    return new Date(dateTime).toLocaleString();
  };

  const formatProbability = (probability?: number) => {
    if (probability === undefined) return null;
    return Math.round(probability * 100);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Risk Assessment</CardTitle>
          </div>
          <Badge variant={getStatusBadgeVariant(riskAssessment.status)}>
            {riskAssessment.status}
          </Badge>
        </div>
        <CardDescription>
          {riskAssessment.code?.text || 'Clinical risk evaluation'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {riskAssessment.prediction && riskAssessment.prediction.length > 0 && (
          <div className="space-y-3">
            {riskAssessment.prediction.map((prediction, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                {prediction.outcome && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {prediction.outcome.text || prediction.outcome.coding?.[0]?.display || 'Outcome'}
                    </span>
                    {prediction.qualitativeRisk && (
                      <Badge 
                        variant="outline" 
                        className={getRiskLevelColor(
                          prediction.qualitativeRisk.text || 
                          prediction.qualitativeRisk.coding?.[0]?.display
                        )}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {prediction.qualitativeRisk.text || 
                         prediction.qualitativeRisk.coding?.[0]?.display || 
                         'Risk Level'}
                      </Badge>
                    )}
                  </div>
                )}

                {prediction.probabilityDecimal !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Probability</span>
                      <span className="font-medium">
                        {formatProbability(prediction.probabilityDecimal)}%
                      </span>
                    </div>
                    <Progress value={formatProbability(prediction.probabilityDecimal)} />
                  </div>
                )}

                {prediction.rationale && (
                  <p className="text-sm text-muted-foreground">
                    {prediction.rationale}
                  </p>
                )}

                {prediction.relativeRisk && (
                  <div className="flex items-center space-x-2 text-sm">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Relative Risk:</span>
                    <span className="font-medium">{prediction.relativeRisk}x</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {riskAssessment.mitigation && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Mitigation Strategy
            </div>
            <p className="text-sm">{riskAssessment.mitigation}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm pt-2">
          <div>
            <div className="flex items-center space-x-1 text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">Assessment Date</span>
            </div>
            <p className="text-xs">
              {formatDateTime(riskAssessment.occurrenceDateTime)}
            </p>
          </div>
          
          {riskAssessment.method && (
            <div>
              <div className="text-muted-foreground mb-1">
                <span className="font-medium">Method</span>
              </div>
              <p className="text-xs">
                {riskAssessment.method.text || 
                 riskAssessment.method.coding?.[0]?.display || 
                 'Assessment method'}
              </p>
            </div>
          )}
        </div>

        {riskAssessment.note && riskAssessment.note.length > 0 && (
          <div>
            <div className="text-muted-foreground mb-1">
              <span className="font-medium text-sm">Clinical Notes</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {riskAssessment.note[0].text}
            </p>
          </div>
        )}

        {riskAssessment.id && (
          <div className="pt-2 border-t">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span>ID: {riskAssessment.id}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}