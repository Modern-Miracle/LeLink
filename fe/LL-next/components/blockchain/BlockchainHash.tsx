import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Shield, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Hash
} from 'lucide-react';
import { blockchainService } from '@/lib/services/blockchain';

interface BlockchainHashProps {
  resourceId: string;
  owner: string;
  currentHash?: string;
  className?: string;
  showVerification?: boolean;
}

export function BlockchainHash({ 
  resourceId, 
  owner, 
  currentHash,
  className,
  showVerification = true 
}: BlockchainHashProps) {
  const [onChainHash, setOnChainHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    fetchBlockchainHash();
  }, [resourceId, owner]);

  useEffect(() => {
    if (showVerification && onChainHash && currentHash) {
      setVerified(onChainHash === currentHash);
    }
  }, [onChainHash, currentHash, showVerification]);

  const fetchBlockchainHash = async () => {
    setLoading(true);
    try {
      const hash = await blockchainService.getRecordHash(resourceId, owner);
      setOnChainHash(hash);
    } catch (error) {
      console.error('Failed to fetch blockchain hash:', error);
      setOnChainHash(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (onChainHash) {
      navigator.clipboard.writeText(onChainHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatHash = (hash: string) => {
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Shield className="h-4 w-4 animate-pulse text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading blockchain data...</span>
      </div>
    );
  }

  if (!onChainHash) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <span className="text-sm text-muted-foreground">Not recorded on blockchain</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-2">
          {showVerification && verified !== null && (
            <Tooltip>
              <TooltipTrigger>
                {verified ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {verified ? 'Data integrity verified' : 'Data integrity check failed'}
              </TooltipContent>
            </Tooltip>
          )}
          
          <Shield className="h-4 w-4 text-muted-foreground" />
          
          <Badge variant="secondary" className="font-mono text-xs">
            <Hash className="h-3 w-3 mr-1" />
            {formatHash(onChainHash)}
          </Badge>
        </div>

        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-6 w-6 p-0"
              >
                {copied ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {copied ? 'Copied!' : 'Copy full hash'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Open blockchain explorer or show more details
                  console.log('Full hash:', onChainHash);
                }}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View on blockchain</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}