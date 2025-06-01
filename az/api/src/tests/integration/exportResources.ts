/**
 * Standalone utility to extract and export FHIR resources from existing test results
 * 
 * Usage: ts-node exportResources.ts [testResultDirectory]
 * Example: ts-node exportResources.ts ./lekink-test-results/chestPain-1747673207863
 */

import { promises as fs } from 'fs';
import { join } from 'path';

interface ConversationData {
  resources?: any[];
  messages?: Array<{
    received?: {
      resources?: { [key: string]: any };
    };
  }>;
}

interface SummaryData {
  resourcesGenerated?: Array<{
    type: string;
    id: string;
    status: string;
    filePath: string;
  }>;
  [key: string]: any;
}

export async function exportResources(testResultDir: string): Promise<void> {
  try {
    // Validate directory exists
    try {
      await fs.access(testResultDir);
    } catch (error) {
      console.error(`Error: Directory not found: ${testResultDir}`);
      return;
    }

    console.log(`\n=== Exporting FHIR Resources from ${testResultDir} ===`);

    // Create resources directory
    const resourcesDir = join(testResultDir, 'resources');
    await fs.mkdir(resourcesDir, { recursive: true });

    // Read conversation.json
    const conversationFile = join(testResultDir, 'conversation.json');
    const conversationData: ConversationData = JSON.parse(await fs.readFile(conversationFile, 'utf8'));

    // Resources can be in:
    // 1. conversation.resources array
    // 2. Individual message.received.resources objects
    
    const allResources: any[] = [];
    const resourceIds = new Set<string>();

    // Check for top-level resources
    if (conversationData.resources && Array.isArray(conversationData.resources)) {
      for (const resource of conversationData.resources) {
        if (resource.id && !resourceIds.has(resource.id)) {
          allResources.push(resource);
          resourceIds.add(resource.id);
        }
      }
    }

    // Extract resources from all messages
    if (conversationData.messages && Array.isArray(conversationData.messages)) {
      for (const msg of conversationData.messages) {
        if (msg.received && msg.received.resources) {
          for (const [resourceType, resource] of Object.entries(msg.received.resources)) {
            if (resource.id && !resourceIds.has(resource.id)) {
              allResources.push(resource);
              resourceIds.add(resource.id);
              console.log(`Found resource in message: ${resourceType} (${resource.id})`);
            }
          }
        }
      }
    }

    // Save each resource to a file
    let exportCount = 0;
    for (const resource of allResources) {
      const resourceType = resource.resourceType;
      const resourceId = resource.id || `unknown-id-${Date.now()}`;
      const filename = `${resourceType}-${resourceId}.json`;
      const filePath = join(resourcesDir, filename);
      
      await fs.writeFile(filePath, JSON.stringify(resource, null, 2));
      console.log(`✅ Exported ${resourceType} to ${filename}`);
      exportCount++;
    }

    // Update summary.json with resource file paths
    try {
      const summaryFile = join(testResultDir, 'summary.json');
      const summaryData: SummaryData = JSON.parse(await fs.readFile(summaryFile, 'utf8'));
      
      // Update resource information in the summary
      summaryData.resourcesGenerated = allResources.map(r => ({
        type: r.resourceType,
        id: r.id,
        status: r.status,
        filePath: `resources/${r.resourceType}-${r.id || 'unknown-id'}.json`
      }));
      
      await fs.writeFile(summaryFile, JSON.stringify(summaryData, null, 2));
      console.log(`✅ Updated summary.json with resource paths`);
    } catch (error: any) {
      console.warn(`⚠️ Could not update summary.json: ${error.message}`);
    }

    console.log(`\n=== Export Complete ===`);
    console.log(`Total FHIR resources exported: ${exportCount}`);
    console.log(`Resources saved to: ${resourcesDir}`);
    
  } catch (error: any) {
    console.error(`Error exporting resources: ${error.message}`);
    console.error(error.stack);
  }
}

// Process command line arguments
async function main(): Promise<void> {
  const targetDir = process.argv[2];
  
  if (!targetDir) {
    console.error('Error: Please provide a directory path');
    console.log('Usage: ts-node exportResources.ts <testResultDirectory>');
    console.log('Example: ts-node exportResources.ts ./lekink-test-results/chestPain-1747673207863');
    return;
  }
  
  await exportResources(targetDir);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}