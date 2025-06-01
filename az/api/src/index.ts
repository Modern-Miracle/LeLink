import { app } from '@azure/functions';

app.setup({
    enableHttpStream: true,
});

// Import function registrations
import './functions/symptom-assessment-bot/index.js';
import './functions/fhir-storage/index.js';
