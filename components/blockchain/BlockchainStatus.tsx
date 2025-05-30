import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Wallet,
  AlertCircle,
  CheckCircle,
  Link2,
  RefreshCw
} from 'lucide-react';
import { blockchainService } from '@/lib/services/blockchain';

interface BlockchainStatusProps {
  className?: string;
}

export function BlockchainStatus({ className }: BlockchainStatusProps) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
    fetchContractStatus();
  }, []);

  const checkConnection = async () => {
    try {
      const addr = await blockchainService.getConnectedAddress();
      setConnected(!!addr);
      setAddress(addr);
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const fetchContractStatus = async () => {
    try {
      const status = await blockchainService.getContractStatus();
      setContractStatus(status);
    } catch (error) {
      console.error('Failed to fetch contract status:', error);
    }
  };

  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      const addr = await blockchainService.connectWallet();
      if (addr) {
        setConnected(true);
        setAddress(addr);
      } else {
        setError('Failed to connect wallet');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Blockchain Integration</CardTitle>
          </div>
          <Badge variant={connected ? 'default' : 'secondary'}>
            {connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        <CardDescription>
          Secure audit trail for healthcare data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!connected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to enable blockchain audit logging
            </p>
            <Button
              onClick={connectWallet}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4 mr-2" />
              )}
              Connect Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Wallet Connected</span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {address && formatAddress(address)}
              </span>
            </div>

            {contractStatus && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Contract:</span>
                  <p className="font-mono text-xs mt-1">
                    {formatAddress(contractStatus.address)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Records:</span>
                  <p className="font-medium mt-1">{contractStatus.recordCount}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge 
                    variant={contractStatus.paused ? 'destructive' : 'default'}
                    className="ml-2"
                  >
                    {contractStatus.paused ? 'Paused' : 'Active'}
                  </Badge>
                </div>
              </div>
            )}

            <div className="pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  checkConnection();
                  fetchContractStatus();
                }}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <Link2 className="h-3 w-3 inline mr-1" />
          All FHIR resources are automatically hashed and logged to the blockchain
        </div>
      </CardContent>
    </Card>
  );
}