import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  FileText, 
  UserCheck, 
  Edit3, 
  Share2, 
  UserX, 
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { blockchainService, AuditLogEntry } from '@/lib/services/blockchain';

interface AuditTrailProps {
  resourceId: string;
  owner: string;
  className?: string;
}

export function AuditTrail({ resourceId, owner, className }: AuditTrailProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (resourceId && owner) {
      fetchAuditLogs();
    }
  }, [resourceId, owner]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const auditLogs = await blockchainService.getAuditLogs(resourceId, owner);
      setLogs(auditLogs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const verifyIntegrity = async (dataHash: string) => {
    setVerifying(true);
    try {
      const isValid = await blockchainService.verifyDataIntegrity(resourceId, owner, dataHash);
      setVerified(isValid);
      setTimeout(() => setVerified(null), 3000); // Clear after 3 seconds
    } catch (err) {
      console.error('Failed to verify integrity:', err);
      setError('Failed to verify data integrity');
    } finally {
      setVerifying(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return <FileText className="h-4 w-4" />;
      case 'accessed':
        return <UserCheck className="h-4 w-4" />;
      case 'updated':
        return <Edit3 className="h-4 w-4" />;
      case 'shared':
        return <Share2 className="h-4 w-4" />;
      case 'revoked':
        return <UserX className="h-4 w-4" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'accessed':
        return 'bg-blue-100 text-blue-800';
      case 'updated':
        return 'bg-yellow-100 text-yellow-800';
      case 'shared':
        return 'bg-purple-100 text-purple-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      case 'deleted':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const openTransaction = (txHash: string) => {
    // This assumes local development. Update for mainnet/testnet
    const explorerUrl = `http://localhost:8545/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Blockchain Audit Trail</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Blockchain Audit Trail</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuditLogs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          Immutable record of all data operations on the blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {verified !== null && (
          <Alert variant={verified ? 'default' : 'destructive'}>
            {verified ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Data integrity verified successfully</AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Data integrity verification failed</AlertDescription>
              </>
            )}
          </Alert>
        )}

        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No audit logs found for this resource
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, index) => (
              <div
                key={`${log.transactionHash}-${index}`}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-md ${getEventColor(log.eventType)}`}>
                      {getEventIcon(log.eventType)}
                    </div>
                    <span className="font-medium capitalize">{log.eventType}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Block #{log.blockNumber}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Actor:</span>
                    <span className="ml-2 font-mono">{formatAddress(log.actor)}</span>
                  </div>
                  
                  {log.recipient && (
                    <div>
                      <span className="text-muted-foreground">Recipient:</span>
                      <span className="ml-2 font-mono">{formatAddress(log.recipient)}</span>
                    </div>
                  )}

                  <div className="col-span-2">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="ml-2">{formatTimestamp(log.timestamp)}</span>
                  </div>
                </div>

                {log.dataHash && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Hash:</span>
                      <span className="ml-2 font-mono">{log.dataHash.slice(0, 16)}...</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => verifyIntegrity(log.dataHash!)}
                      disabled={verifying}
                    >
                      {verifying ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground font-mono">
                    {log.transactionHash.slice(0, 20)}...
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openTransaction(log.transactionHash)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}