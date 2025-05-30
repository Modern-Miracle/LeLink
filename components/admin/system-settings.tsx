"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Shield, Bell, Database, Clock, Save, Wallet, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { blockchainService } from "@/lib/services/blockchain"

export default function SystemSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [blockchainConnected, setBlockchainConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [contractStatus, setContractStatus] = useState<any>(null)
  const [blockchainError, setBlockchainError] = useState<string | null>(null)

  useEffect(() => {
    checkBlockchainConnection()
  }, [])

  const checkBlockchainConnection = async () => {
    try {
      const address = await blockchainService.getConnectedAddress()
      setBlockchainConnected(!!address)
      setWalletAddress(address)
      
      if (address) {
        const status = await blockchainService.getContractStatus()
        setContractStatus(status)
      }
    } catch (error) {
      console.error('Failed to check blockchain connection:', error)
    }
  }

  const connectBlockchainWallet = async () => {
    setBlockchainError(null)
    try {
      const address = await blockchainService.connectWallet()
      if (address) {
        setBlockchainConnected(true)
        setWalletAddress(address)
        const status = await blockchainService.getContractStatus()
        setContractStatus(status)
      }
    } catch (error: any) {
      setBlockchainError(error.message || 'Failed to connect wallet')
    }
  }

  const handleSave = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-full h-12 border shadow-sm">
        <TabsTrigger
          value="general"
          className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
        >
          <Settings className="mr-2 h-4 w-4" />
          General
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
        >
          <Shield className="mr-2 h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
        >
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger
          value="integrations"
          className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
        >
          <Database className="mr-2 h-4 w-4" />
          Integrations
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Manage system-wide settings and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="system-name">System Name</Label>
                  <Input id="system-name" defaultValue="LeLink Healthcare Platform" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Administrator Email</Label>
                  <Input id="admin-email" defaultValue="admin@lelink.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                      <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                      <SelectItem value="cst">CST (Central Standard Time)</SelectItem>
                      <SelectItem value="mst">MST (Mountain Standard Time)</SelectItem>
                      <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-description">System Description</Label>
                <Textarea
                  id="system-description"
                  rows={3}
                  defaultValue="LeLink is a secure healthcare platform for refugees, providing immediate access to medical services with robust data privacy."
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">System Preferences</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable maintenance mode to restrict access during updates
                    </p>
                  </div>
                  <Switch id="maintenance-mode" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-logout">Auto Logout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out inactive users after 30 minutes
                    </p>
                  </div>
                  <Switch id="auto-logout" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="debug-mode">Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable detailed logging for system troubleshooting</p>
                  </div>
                  <Switch id="debug-mode" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="rounded-full px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
              >
                {isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Configure security policies and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Password Policy</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="min-password-length">Minimum Password Length</Label>
                  <Select defaultValue="12">
                    <SelectTrigger id="min-password-length">
                      <SelectValue placeholder="Select minimum length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8 characters</SelectItem>
                      <SelectItem value="10">10 characters</SelectItem>
                      <SelectItem value="12">12 characters</SelectItem>
                      <SelectItem value="14">14 characters</SelectItem>
                      <SelectItem value="16">16 characters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-expiry">Password Expiry</Label>
                  <Select defaultValue="90">
                    <SelectTrigger id="password-expiry">
                      <SelectValue placeholder="Select expiry period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="require-special-chars">Require Special Characters</Label>
                    <p className="text-sm text-muted-foreground">
                      Passwords must contain at least one special character
                    </p>
                  </div>
                  <Switch id="require-special-chars" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="require-numbers">Require Numbers</Label>
                    <p className="text-sm text-muted-foreground">Passwords must contain at least one number</p>
                  </div>
                  <Switch id="require-numbers" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="require-mixed-case">Require Mixed Case</Label>
                    <p className="text-sm text-muted-foreground">
                      Passwords must contain both uppercase and lowercase letters
                    </p>
                  </div>
                  <Switch id="require-mixed-case" defaultChecked />
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Authentication</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-factor-auth">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require two-factor authentication for all admin users
                    </p>
                  </div>
                  <Switch id="two-factor-auth" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="session-timeout">Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out users after 30 minutes of inactivity
                    </p>
                  </div>
                  <Switch id="session-timeout" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ip-restriction">IP Restriction</Label>
                    <p className="text-sm text-muted-foreground">Restrict admin access to specific IP addresses</p>
                  </div>
                  <Switch id="ip-restriction" />
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Data Protection</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="data-encryption">Data Encryption</Label>
                    <p className="text-sm text-muted-foreground">Enable end-to-end encryption for all patient data</p>
                  </div>
                  <Switch id="data-encryption" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="audit-logging">Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all data access and modifications for compliance
                    </p>
                  </div>
                  <Switch id="audit-logging" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="data-anonymization">Data Anonymization</Label>
                    <p className="text-sm text-muted-foreground">Anonymize patient data for reporting and analytics</p>
                  </div>
                  <Switch id="data-anonymization" defaultChecked />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="rounded-full px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
              >
                {isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure system notifications and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Email Notifications</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">SMTP Server</Label>
                  <Input id="smtp-server" defaultValue="smtp.lelink.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input id="smtp-port" defaultValue="587" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">SMTP Username</Label>
                  <Input id="smtp-username" defaultValue="notifications@lelink.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">SMTP Password</Label>
                  <Input id="smtp-password" type="password" defaultValue="••••••••••••" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-sender">Email Sender Name</Label>
                <Input id="email-sender" defaultValue="LeLink Healthcare" />
              </div>

              <h3 className="text-lg font-medium mt-6">Notification Types</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="user-registration">User Registration</Label>
                    <p className="text-sm text-muted-foreground">Send notifications when new users register</p>
                  </div>
                  <Switch id="user-registration" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="critical-alerts">Critical Patient Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications for critical patient status changes
                    </p>
                  </div>
                  <Switch id="critical-alerts" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="system-updates">System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications about system updates and maintenance
                    </p>
                  </div>
                  <Switch id="system-updates" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="security-alerts">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications about security events and breaches
                    </p>
                  </div>
                  <Switch id="security-alerts" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="department-reports">Department Reports</Label>
                    <p className="text-sm text-muted-foreground">Send weekly department performance reports</p>
                  </div>
                  <Switch id="department-reports" />
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Notification Recipients</h3>

              <div className="space-y-2">
                <Label htmlFor="admin-emails">Administrator Emails</Label>
                <Textarea
                  id="admin-emails"
                  rows={3}
                  defaultValue="admin@lelink.com, security@lelink.com, support@lelink.com"
                  placeholder="Enter email addresses separated by commas"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  These email addresses will receive all system notifications
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="rounded-full px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
              >
                {isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="integrations">
        <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
            <CardTitle>Integration Settings</CardTitle>
            <CardDescription>Configure third-party integrations and APIs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Blockchain Integration</h3>

              {blockchainError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{blockchainError}</AlertDescription>
                </Alert>
              )}

              {!blockchainConnected ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect your wallet to enable blockchain audit logging for healthcare data
                    </p>
                    <Button
                      onClick={connectBlockchainWallet}
                      variant="outline"
                      className="w-full"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Wallet Connected</span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {walletAddress && `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                      </Badge>
                    </div>
                  </div>

                  {contractStatus && (
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label className="text-muted-foreground">Contract Address</Label>
                        <p className="font-mono text-xs mt-1">
                          {contractStatus.address.slice(0, 10)}...{contractStatus.address.slice(-8)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Total Records</Label>
                        <p className="font-medium mt-1">{contractStatus.recordCount}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Contract Owner</Label>
                        <p className="font-mono text-xs mt-1">
                          {contractStatus.owner.slice(0, 10)}...{contractStatus.owner.slice(-8)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Status</Label>
                        <Badge 
                          variant={contractStatus.paused ? "destructive" : "default"}
                          className="mt-1"
                        >
                          {contractStatus.paused ? "Paused" : "Active"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="blockchain-endpoint">Blockchain RPC Endpoint</Label>
                    <Input 
                      id="blockchain-endpoint" 
                      defaultValue={process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || "http://localhost:8545"}
                      disabled={blockchainConnected}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract-address">LeLink Contract Address</Label>
                    <Input 
                      id="contract-address" 
                      defaultValue={process.env.NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS || ""}
                      disabled={blockchainConnected}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="blockchain-enabled">Enable Blockchain Logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically log all FHIR resources to blockchain
                      </p>
                    </div>
                    <Switch id="blockchain-enabled" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="verify-integrity">Verify Data Integrity</Label>
                      <p className="text-sm text-muted-foreground">
                        Check blockchain hashes against stored data
                      </p>
                    </div>
                    <Switch id="verify-integrity" defaultChecked />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkBlockchainConnection}
                    className="w-full"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Refresh Blockchain Status
                  </Button>
                </div>
              )}

              <h3 className="text-lg font-medium mt-6">AI Integration</h3>

              <div className="space-y-2">
                <Label htmlFor="ai-provider">AI Provider</Label>
                <Select defaultValue="openai">
                  <SelectTrigger id="ai-provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="azure">Azure AI</SelectItem>
                    <SelectItem value="google">Google AI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-api-key">API Key</Label>
                <Input id="ai-api-key" type="password" defaultValue="••••••••••••••••••••••••••••••" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-model">AI Model</Label>
                <Select defaultValue="gpt-4o">
                  <SelectTrigger id="ai-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-triage">AI Triage</Label>
                  <p className="text-sm text-muted-foreground">Use AI for initial patient triage and assessment</p>
                </div>
                <Switch id="ai-triage" defaultChecked />
              </div>

              <h3 className="text-lg font-medium mt-6">External APIs</h3>

              <div className="space-y-2">
                <Label htmlFor="ehr-integration">Electronic Health Record (EHR) Integration</Label>
                <Select defaultValue="fhir">
                  <SelectTrigger id="ehr-integration">
                    <SelectValue placeholder="Select integration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fhir">FHIR</SelectItem>
                    <SelectItem value="hl7">HL7</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                    <SelectItem value="cerner">Cerner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ehr-endpoint">EHR API Endpoint</Label>
                <Input id="ehr-endpoint" defaultValue="https://api.ehrprovider.com/fhir/r4" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ehr-api-key">EHR API Key</Label>
                <Input id="ehr-api-key" type="password" defaultValue="••••••••••••••••••••••••••••••" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ehr-enabled">Enable EHR Integration</Label>
                  <p className="text-sm text-muted-foreground">Connect to external electronic health record systems</p>
                </div>
                <Switch id="ehr-enabled" defaultChecked />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="rounded-full px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
              >
                {isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

