export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <div className="bg-white rounded-lg shadow-lg p-8 prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <h2>Introduction</h2>
          <p>
            LeLink is committed to protecting the privacy and security of your personal information. 
            This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
          </p>

          <h2>Data We Collect</h2>
          <h3>Medical Information</h3>
          <ul>
            <li>Health records and medical history</li>
            <li>Symptoms and triage assessments</li>
            <li>Healthcare provider interactions</li>
            <li>Treatment records and medications</li>
          </ul>

          <h3>Personal Information</h3>
          <ul>
            <li>Name, date of birth, and contact information</li>
            <li>Emergency contact details</li>
            <li>Authentication credentials</li>
          </ul>

          <h2>How We Use Your Data</h2>
          <p>Your data is used exclusively for:</p>
          <ul>
            <li>Providing medical triage and healthcare services</li>
            <li>Maintaining your medical records</li>
            <li>Enabling healthcare provider communications</li>
            <li>Ensuring platform security and compliance</li>
          </ul>

          <h2>Data Security</h2>
          <p>
            We implement industry-leading security measures including:
          </p>
          <ul>
            <li>Blockchain-based immutable record storage</li>
            <li>End-to-end encryption for all data transmission</li>
            <li>Multi-factor authentication</li>
            <li>Zero-trust architecture</li>
          </ul>

          <h2>Compliance</h2>
          <p>
            LeLink complies with major healthcare and privacy regulations:
          </p>
          <ul>
            <li><strong>GDPR</strong> - Full compliance with European data protection laws</li>
            <li><strong>HIPAA</strong> - Aligned with US healthcare privacy standards</li>
            <li><strong>PIPEDA</strong> - Following Canadian privacy principles</li>
          </ul>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request data deletion (subject to medical record retention requirements)</li>
            <li>Control who has access to your medical information</li>
            <li>Receive a copy of your data in a portable format</li>
          </ul>

          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or your data rights, please contact:
          </p>
          <p>
            <strong>Hora e.V.</strong><br />
            ZVR: 1335812639<br />
            Email: privacy@hora-ev.eu<br />
            Website: <a href="https://hora-ev.eu" className="text-teal-600">hora-ev.eu</a>
          </p>
        </div>
      </div>
    </div>
  )
}