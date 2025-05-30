# Troubleshooting Guide

## Common Issues and Solutions

### 1. Node.js Version Issues

**Error:**
```
Incompatible Node.js version (v23.6.0). Refer to our documentation to see the Node.js versions supported by each version of Azure Functions
```

**Solution:**
```bash
# Use Node.js v20
nvm install 20.18.1
nvm use 20.18.1

# Verify version
node --version  # Should show v20.x.x
```

### 2. Missing Environment Variables

**Error:**
```
Error: OPENAI_API_KEY environment variable is required
```

**Solution:**
1. Check if `config/local.settings.json` exists
2. Ensure it contains required values:
   ```json
   {
     "Values": {
       "OPENAI_API_KEY": "your-key-here",
       "OPENAI_CONVERSATION_ASSISTANT_ID": "asst_xxx",
       "OPENAI_ORGANIZATION_ID": "org-xxx"
     }
   }
   ```

### 3. Port Already in Use

**Error:**
```
Port 7071 is unavailable. Close the process using that port, or specify another port using --port [-p]
```

**Solution:**
```bash
# Find process using port
lsof -i :7071

# Kill the process
kill -9 [PID]

# Or use different port
func start --port 7072
```

### 4. OpenAI API Errors

#### Invalid API Key
**Error:**
```
401 Unauthorized: Invalid API key
```

**Solution:**
- Verify API key in `config/local.settings.json`
- Check key hasn't expired or been revoked
- Ensure proper formatting (no extra spaces)

#### Assistant Not Found
**Error:**
```
404 Not Found: Assistant not found
```

**Solution:**
- Verify assistant ID is correct
- Ensure assistant exists in OpenAI platform
- Check you're using correct organization

#### Rate Limiting
**Error:**
```
429 Too Many Requests
```

**Solution:**
- Implement exponential backoff
- Reduce request frequency
- Check OpenAI rate limits for your tier

### 5. FHIR Resource Validation Errors

**Error:**
```
FHIRError: Invalid resource format
```

**Solution:**
1. Check required fields are present:
   - resourceType
   - id
   - status
   - subject reference

2. Validate coding systems:
   ```javascript
   {
     coding: [{
       system: "http://loinc.org",
       code: "89261-2",
       display: "Chief complaint"
     }]
   }
   ```

### 6. Memory/Performance Issues

**Symptoms:**
- Slow response times
- Function timeouts
- Out of memory errors

**Solutions:**

1. **Increase function timeout:**
   ```json
   // host.json
   {
     "functionTimeout": "00:10:00"  // 10 minutes
   }
   ```

2. **Optimize conversation length:**
   ```javascript
   // Limit conversation history
   const MAX_MESSAGES = 20;
   if (messages.length > MAX_MESSAGES) {
     messages = messages.slice(-MAX_MESSAGES);
   }
   ```

3. **Use streaming for large responses:**
   ```javascript
   const stream = await openai.createStreamingResponse();
   stream.on('data', chunk => processChunk(chunk));
   ```

### 7. Test Failures

#### Connection Refused
**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:7071
```

**Solution:**
- Ensure Azure Functions is running: `npm start`
- Verify correct port in test configuration
- Check firewall settings

#### Timeout in Tests
**Error:**
```
Error: Timeout of 5000ms exceeded
```

**Solution:**
```javascript
// Increase test timeout
jest.setTimeout(30000);  // 30 seconds

// Or per test
test('long running test', async () => {
  // test code
}, 30000);
```

### 8. Deployment Issues

#### Function Not Starting in Azure
**Symptoms:**
- 404 errors after deployment
- Function not listed in Azure portal

**Solutions:**

1. **Check deployment logs:**
   ```bash
   az functionapp log deployment show \
     --name your-function-app \
     --resource-group your-rg
   ```

2. **Verify runtime settings:**
   ```bash
   az functionapp config show \
     --name your-function-app \
     --resource-group your-rg
   ```

3. **Check application settings:**
   ```bash
   az functionapp config appsettings list \
     --name your-function-app \
     --resource-group your-rg
   ```

### 9. Debugging Techniques

#### Enable Detailed Logging

1. **In local.settings.json:**
   ```json
   {
     "Values": {
       "AzureWebJobsLogLevel": "Debug",
       "LogLevel": "Debug"
     }
   }
   ```

2. **In code:**
   ```javascript
   const DEBUG = process.env.NODE_ENV !== 'production';
   
   if (DEBUG) {
     console.log('Detailed debug info:', {
       request: req.body,
       headers: req.headers,
       timestamp: new Date().toISOString()
     });
   }
   ```

#### Use Correlation IDs

```javascript
// Track requests across logs
const correlationId = req.headers['x-correlation-id'] || 
                     context.executionContext.invocationId;

logger.info('Processing request', { correlationId });
```

### 10. Emergency Procedures

#### Service Outage

1. **Check service status:**
   - Azure status: https://status.azure.com
   - OpenAI status: https://status.openai.com

2. **Implement circuit breaker:**
   ```javascript
   class CircuitBreaker {
     constructor(threshold = 5, timeout = 60000) {
       this.failureCount = 0;
       this.threshold = threshold;
       this.timeout = timeout;
       this.state = 'CLOSED';
     }
     
     async execute(fn) {
       if (this.state === 'OPEN') {
         throw new Error('Circuit breaker is OPEN');
       }
       
       try {
         const result = await fn();
         this.onSuccess();
         return result;
       } catch (error) {
         this.onFailure();
         throw error;
       }
     }
   }
   ```

#### Data Loss Prevention

1. **Log all requests:**
   ```javascript
   // Log to durable storage
   await logToStorage({
     timestamp: new Date().toISOString(),
     request: req.body,
     response: res.body,
     correlationId
   });
   ```

2. **Implement request replay:**
   ```javascript
   // Store failed requests for retry
   await storeFailedRequest({
     request: req.body,
     error: error.message,
     timestamp: new Date().toISOString()
   });
   ```

## Getting Help

### Log Analysis

1. **Search logs by correlation ID:**
   ```bash
   grep "correlation-id-here" logs/*.log
   ```

2. **Filter by error level:**
   ```bash
   grep "ERROR" logs/*.log | grep "2024-01-15"
   ```

### Support Channels

1. **Internal Resources:**
   - Check team documentation
   - Ask in Slack channel
   - Review past issues

2. **External Resources:**
   - Azure Support
   - OpenAI Developer Forum
   - Stack Overflow

### Reporting Issues

When reporting issues, include:
1. Error message and stack trace
2. Correlation ID
3. Time of occurrence
4. Steps to reproduce
5. Environment details (dev/staging/prod)
6. Recent changes

Example issue report:
```markdown
## Issue: Function timeout during high load

**Environment:** Production
**Time:** 2024-01-15 14:30 UTC
**Correlation ID:** abc-123-def

**Error:**
```
Timeout: Function execution exceeded 5 minutes
```

**Steps to reproduce:**
1. Send 100 concurrent requests
2. Wait for responses
3. ~10% timeout after 5 minutes

**Expected behavior:**
All requests complete within 30 seconds

**Additional context:**
Started after deploying version 1.2.3
```