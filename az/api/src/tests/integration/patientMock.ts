// Mock patient responses for testing

interface PatientResponsesType {
  [key: string]: string[];
}

const patientResponses: PatientResponsesType = {
  chestPain: [
    "The pain started about 30 minutes ago. It's sharp and crushing, 8 out of 10.",
    "Yes, I have high blood pressure and cholesterol. I take atorvastatin and lisinopril.",
    "Yes, the pain radiates to my left arm and jaw. I feel dizzy and very sweaty.",
    "No allergies to medications. I had a mild heart attack 5 years ago.",
    "The pain is getting worse. I feel very anxious and short of breath."
  ],
  headache: [
    "It started about 3 hours ago. The pain is throbbing, about 7 out of 10.",
    "Yes, I have a history of migraines. This feels like my usual migraine pattern.",
    "No, no numbness or vision loss. Just sensitive to light and mild nausea.",
    "I usually take ibuprofen for headaches. No known allergies.",
    "The pain is on the right side of my head, pulsating with my heartbeat."
  ],
  abdominalPain: [
    "The pain started yesterday afternoon. It's a dull ache, about 5 out of 10.",
    "It's in the lower right area. No radiation to other areas.",
    "No fever or vomiting. Just mild nausea and loss of appetite.",
    "No significant medical history. Not pregnant. Last period was 2 weeks ago.",
    "The pain is worse when I press on it or move around."
  ],
  minorCut: [
    "The cut happened about 10 minutes ago while cutting vegetables.",
    "It's about 1 cm long and not very deep. The bleeding has mostly stopped.",
    "Pain is minimal, maybe 2 out of 10. No signs of infection.",
    "I'm healthy, no medical conditions. My tetanus shot is up to date.",
    "I've cleaned it with soap and water. It looks clean, no debris."
  ]
};

export class PatientMock {
  private responses: string[];
  private responseIndex: number;

  constructor(scenarioName: string) {
    this.responses = patientResponses[scenarioName] || [];
    this.responseIndex = 0;
  }

  getResponse(botQuestion: string): string {
    // Return the next response in sequence, or a default if we run out
    if (this.responseIndex < this.responses.length) {
      return this.responses[this.responseIndex++];
    }
    
    // Default responses for common follow-up questions
    if (botQuestion.toLowerCase().includes('any other')) {
      return "No other symptoms or concerns.";
    }
    if (botQuestion.toLowerCase().includes('scale')) {
      return "The pain level hasn't changed much.";
    }
    if (botQuestion.toLowerCase().includes('when')) {
      return "No significant change in timing.";
    }
    
    return "I've told you everything I can think of about my symptoms.";
  }
}

export default PatientMock;