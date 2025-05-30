# LeLink Triage Assistant Test Tools

This directory contains tools for testing the LeLink Triage Assistant and extracting FHIR resources from test results.

## Test Runner

The main test file, `testLelinkBot.js`, runs simulated conversations with the LeLink Triage Assistant to test functionality and generate FHIR resources.

```bash
# Run all test scenarios
node testLelinkBot.js

# Export FHIR resources from a specific test result directory
node testLelinkBot.js --export ./lekink-test-results/chestPain-1747673207863

# Export FHIR resources from all test result directories
node testLelinkBot.js --export-all
```

## Resource Exporter

The standalone resource exporter, `exportResources.js`, extracts FHIR resources from test result directories and saves them as individual JSON files.

```bash
# Export FHIR resources from a specific test result directory
node exportResources.js ./lekink-test-results/chestPain-1747673207863
```

## Generated FHIR Resources

The following FHIR resources are generated during testing:

- **RiskAssessment**: Contains the risk level assigned to the patient's symptoms
- **Observation**: Contains observations about the patient's condition
- **Other resources**: Depending on the scenario, additional resources may be generated

## Test Result Structure

Each test result directory contains:

- `conversation.json`: The complete conversation between the patient simulator and LeLink bot
- `summary.json`: Summary of the test results including resource references
- `resources/`: Directory containing individual FHIR resource JSON files