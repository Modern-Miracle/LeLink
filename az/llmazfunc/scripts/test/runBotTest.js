const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const mainBotDir = path.join(__dirname, '..', '..'); // Root directory
const testBotDir = path.join(mainBotDir, 'tests');
const symptomAssessmentBotDir = path.join(mainBotDir, 'src', 'functions', 'symptomAssessmentBot');
const logDir = path.join(mainBotDir, 'logs');
const logFile = path.join(logDir, `bottest-${new Date().toISOString().replace(/:/g, '-')}.log`);
const azuriteDataDir = path.join(mainBotDir, '.azurite');

// Create log directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create azurite data directory if it doesn't exist
if (!fs.existsSync(azuriteDataDir)) {
  fs.mkdirSync(azuriteDataDir, { recursive: true });
}

// Stream for writing to log file
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Logger function to display in terminal and write to file
function log(source, message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${source}] ${message}`;
  
  console.log(formattedMessage);
  logStream.write(formattedMessage + '\n');
}

// Function to check and set Node.js version
function ensureCorrectNodeVersion() {
  log('SETUP', 'Checking Node.js version...');
  
  // Get current Node version
  const currentVersion = process.version;
  log('SETUP', `Current Node.js version: ${currentVersion}`);
  
  // Check if we're on Node 23 and need to switch to Node 20
  if (currentVersion.startsWith('v23')) {
    log('SETUP', 'Node.js v23 detected. Switching to Node.js v20 for Azure Functions compatibility...');
    
    // Check if nvm is available
    try {
      // Try to find nvm path (this is typical for macOS)
      const nvmPath = process.env.NVM_DIR ? path.join(process.env.NVM_DIR, 'nvm.sh') : path.join(process.env.HOME, '.nvm/nvm.sh');
      
      if (fs.existsSync(nvmPath)) {
        log('SETUP', 'nvm found. Attempting to switch to Node.js v20...');
        log('WARNING', 'You should run this script with Node.js v20 active. Try:');
        log('WARNING', 'nvm use 20.18.1 && node runBotTest.js');
        process.exit(1);
      } else {
        log('WARNING', 'Node.js v23 is active, but Azure Functions requires v20.');
        log('WARNING', 'Please switch to Node.js v20 manually before running this script.');
        log('WARNING', 'If using nvm: nvm use 20.18.1');
        process.exit(1);
      }
    } catch (error) {
      log('ERROR', `Failed to check for nvm: ${error.message}`);
      log('WARNING', 'Please switch to Node.js v20 manually before running this script.');
      process.exit(1);
    }
  } else if (currentVersion.startsWith('v20')) {
    log('SETUP', 'Node.js v20 detected. Compatible with Azure Functions.');
  } else {
    log('WARNING', `Node.js ${currentVersion} detected. Azure Functions works best with v20.`);
    log('WARNING', 'Consider switching to Node.js v20 for best compatibility.');
  }
}

// Function to ensure npm dependencies are installed
function ensureDependencies() {
  log('SETUP', 'Checking npm dependencies...');
  
  // Check and install dependencies for symptomAssessmentBot
  if (fs.existsSync(path.join(symptomAssessmentBotDir, 'package.json'))) {
    log('SETUP', 'Checking symptomAssessmentBot dependencies...');
    try {
      // Check if @azure/storage-blob is installed
      execSync('npm list @azure/storage-blob', { cwd: symptomAssessmentBotDir, stdio: 'ignore' });
      log('SETUP', 'Dependencies already installed.');
    } catch (error) {
      log('SETUP', 'Missing dependencies detected. Installing...');
      try {
        execSync('npm install', { cwd: symptomAssessmentBotDir, stdio: 'inherit' });
        log('SETUP', 'Dependencies installed successfully.');
      } catch (installError) {
        log('ERROR', `Failed to install dependencies: ${installError.message}`);
        process.exit(1);
      }
    }
  }
  
  // Check main project dependencies if needed
  const mainPackageJson = path.join(mainBotDir, 'package.json');
  if (fs.existsSync(mainPackageJson)) {
    log('SETUP', 'Checking main project dependencies...');
    try {
      // Quick check for node_modules
      if (!fs.existsSync(path.join(mainBotDir, 'node_modules'))) {
        log('SETUP', 'Installing main project dependencies...');
        execSync('npm install', { cwd: mainBotDir, stdio: 'inherit' });
      }
    } catch (error) {
      log('WARNING', `Failed to check main project dependencies: ${error.message}`);
    }
  }
}

// Function to start Azurite (Azure Storage Emulator)
function startAzurite() {
  log('SETUP', 'Starting Azurite (Azure Storage Emulator)...');
  
  // Check if Azurite is installed
  try {
    execSync('azurite --version', { stdio: 'ignore' });
  } catch (error) {
    log('ERROR', 'Azurite is not installed or not in PATH. Please install with: npm install -g azurite');
    process.exit(1);
  }
  
  // Start Azurite with blob, queue, and table services
  const azuriteProcess = spawn('azurite', [
    '--silent',
    '--location', azuriteDataDir,
    '--debug', path.join(logDir, 'azurite-debug.log')
  ]);
  
  azuriteProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => log('AZURITE', line));
  });
  
  azuriteProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => log('AZURITE-ERROR', line));
  });
  
  azuriteProcess.on('close', (code) => {
    log('AZURITE', `Process exited with code ${code}`);
  });
  
  // Wait a moment for Azurite to initialize
  log('SETUP', 'Waiting for Azurite to initialize...');
  
  return azuriteProcess;
}

// Check if Azurite is already running
function isAzuriteRunning() {
  try {
    // Check if blob storage port (10000) is in use
    if (process.platform === 'win32') {
      const result = execSync('netstat -ano | findstr "10000"').toString();
      return result.length > 0;
    } else {
      const result = execSync('lsof -i:10000').toString();
      return result.length > 0;
    }
  } catch (error) {
    return false;
  }
}

// Function to start the main bot (Azure Functions)
function startMainBot() {
  log('SETUP', 'Starting main bot (Azure Functions)...');
  
  // Ensure environment is set up properly
  try {
    if (!fs.existsSync(path.join(mainBotDir, 'local.settings.json'))) {
      log('ERROR', 'local.settings.json not found! Please create this file with proper configuration.');
      process.exit(1);
    }
    
    // Check for required keys in local.settings.json
    const settings = JSON.parse(fs.readFileSync(path.join(mainBotDir, 'local.settings.json'), 'utf8'));
    const requiredSettings = ['OPENAI_API_KEY', 'OPENAI_CONVERSATION_ASSISTANT_ID', 'OPENAI_ORGANIZATION_ID'];
    
    for (const setting of requiredSettings) {
      if (!settings.Values[setting]) {
        log('ERROR', `Missing required setting in local.settings.json: ${setting}`);
        process.exit(1);
      }
    }
    
    // Ensure AzureWebJobsStorage is set to use Azurite
    if (!settings.Values.AzureWebJobsStorage || 
        !settings.Values.AzureWebJobsStorage.includes('UseDevelopmentStorage=true')) {
      log('WARNING', 'AzureWebJobsStorage might not be configured to use Azurite.');
      log('WARNING', 'Make sure it is set to "UseDevelopmentStorage=true" in local.settings.json');
    }
  } catch (error) {
    log('ERROR', `Failed to check settings: ${error.message}`);
    process.exit(1);
  }
  
  // Start Azure Functions
  const funcProcess = spawn('npm', ['run', 'start'], { 
    cwd: mainBotDir,
    env: { ...process.env, NODE_VERSION: '20' } // Hint for Azure Functions
  });
  
  funcProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => log('MAIN-BOT', line));
  });
  
  funcProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => log('MAIN-BOT-ERROR', line));
  });
  
  funcProcess.on('close', (code) => {
    log('MAIN-BOT', `Process exited with code ${code}`);
  });
  
  return funcProcess;
}

// Function to run test bot with specified scenarios
function runTestBot(numScenarios) {
  return new Promise(async (resolve, reject) => {
    log('SETUP', `Running test bot with ${numScenarios || 'all'} scenarios...`);
    
    // Wait a bit to ensure services are fully ready
    log('SETUP', 'Waiting 5 seconds to ensure services are ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run test bot with specified number of scenarios
    const testProcess = spawn('node', [
      'integration/testLelinkBot.js', 
      numScenarios ? numScenarios.toString() : ''
    ], { 
      cwd: testBotDir,
      env: { ...process.env, FORCE_COLOR: true } // Preserve colors in output
    });
    
    testProcess.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        // Customize the log prefix based on line content to differentiate between bot and patient
        if (line.includes('[Patient-Bot]') || line.includes('[Patient-Sim')) {
          log('PATIENT', line);
        } else if (line.includes('[LeLink-Bot]')) {
          log('LELINK', line);
        } else if (line.includes('[Thread Debug]') || line.includes('Debug]')) {
          log('DEBUG', line);
        } else if (line.includes('WARNING:') || line.includes('⚠️')) {
          log('WARNING', line);
        } else if (line.includes('ERROR:') || line.includes('❌')) {
          log('ERROR', line);
        } else {
          log('TEST-BOT', line);
        }
      });
    });
    
    testProcess.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => log('ERROR', line));
    });
    
    testProcess.on('close', (code) => {
      log('TEST-BOT', `Process exited with code ${code}`);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test bot exited with code ${code}`));
      }
    });
  });
}

// Function to export FHIR resources from test results
function exportResources() {
  return new Promise((resolve, reject) => {
    log('EXPORT', 'Exporting FHIR resources from test results...');
    
    // Run the export utility on all test results
    const exportProcess = spawn('node', [
      'integration/testLelinkBot.js',
      '--export-all'
    ], { 
      cwd: testBotDir,
      env: { ...process.env, FORCE_COLOR: true }
    });
    
    exportProcess.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => log('EXPORT', line));
    });
    
    exportProcess.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => log('EXPORT-ERROR', line));
    });
    
    exportProcess.on('close', (code) => {
      if (code === 0) {
        log('EXPORT', 'FHIR resource export completed successfully');
        resolve();
      } else {
        log('EXPORT-ERROR', `Export process exited with code ${code}`);
        // We don't reject here, as we don't want to fail the whole test process if export fails
        resolve();
      }
    });
  });
}

// Check if Azure Functions is already running on port 7071
function isAzureFunctionsRunning() {
  try {
    // Different commands for different OS
    if (process.platform === 'win32') {
      const result = execSync('netstat -ano | findstr "7071"').toString();
      return result.length > 0;
    } else {
      const result = execSync('lsof -i:7071').toString();
      return result.length > 0;
    }
  } catch (error) {
    return false;
  }
}

// Main function to run the entire test
async function runTest() {
  log('SETUP', '=== Starting Bot Test System ===');
  
  // Check Node.js version first
  ensureCorrectNodeVersion();
  
  // Ensure dependencies are installed
  ensureDependencies();
  
  let azuriteProcess = null;
  let azuriteAlreadyRunning = isAzuriteRunning();
  
  let mainBotProcess = null;
  let mainBotAlreadyRunning = isAzureFunctionsRunning();
  
  try {
    // Start Azurite if it's not already running
    if (!azuriteAlreadyRunning) {
      azuriteProcess = startAzurite();
      // Give Azurite time to start
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      log('SETUP', 'Azurite already running on port 10000. Using existing instance.');
    }
    
    // Start the main bot only if it's not already running
    if (!mainBotAlreadyRunning) {
      mainBotProcess = startMainBot();
      
      // Give the Azure Functions time to start
      log('SETUP', 'Waiting for Azure Functions to start (30 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    } else {
      log('SETUP', 'Azure Functions already running on port 7071. Using existing instance.');
    }
    
    // Parse command line arguments
    // --no-export: Skip exporting resources
    // --use-npx: Use npx to run azurite
    // [number]: Number of scenarios to run
    const args = process.argv.slice(2);
    const numScenarios = args.find(arg => !arg.startsWith('--') && !isNaN(parseInt(arg))) 
      ? parseInt(args.find(arg => !arg.startsWith('--') && !isNaN(parseInt(arg))))
      : null;
    
    const skipExport = args.includes('--no-export');
    
    // Run test bot
    await runTestBot(numScenarios);
    
    // Export FHIR resources from test results (unless --no-export is specified)
    if (!skipExport) {
      log('SETUP', 'Exporting FHIR resources from test results...');
      await exportResources();
    } else {
      log('SETUP', 'Skipping FHIR resource export (--no-export flag set)');
    }
    
    log('SETUP', '=== All tests completed successfully ===');
    
    // Clean up
    if (mainBotProcess && !mainBotAlreadyRunning) {
      log('SETUP', 'Shutting down main bot...');
      mainBotProcess.kill();
    }
    
    if (azuriteProcess && !azuriteAlreadyRunning) {
      log('SETUP', 'Shutting down Azurite...');
      azuriteProcess.kill();
    }
    
    logStream.end();
    process.exit(0);
  } catch (error) {
    log('ERROR', `Test failed: ${error.message}`);
    
    // Clean up
    if (mainBotProcess && !mainBotAlreadyRunning) {
      log('SETUP', 'Shutting down main bot due to error...');
      mainBotProcess.kill();
    }
    
    if (azuriteProcess && !azuriteAlreadyRunning) {
      log('SETUP', 'Shutting down Azurite due to error...');
      azuriteProcess.kill();
    }
    
    logStream.end();
    process.exit(1);
  }
}

// Handle termination signals
process.on('SIGINT', () => {
  log('SETUP', 'Received SIGINT. Shutting down...');
  logStream.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('SETUP', 'Received SIGTERM. Shutting down...');
  logStream.end();
  process.exit(0);
});

// Run the test
runTest();