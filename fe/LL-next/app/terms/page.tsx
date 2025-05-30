export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <div className="bg-white rounded-lg shadow-lg p-8 prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <h2>Agreement to Terms</h2>
          <p>
            By accessing or using LeLink, you agree to be bound by these Terms of Service. 
            If you disagree with any part of these terms, you may not access the service.
          </p>

          <h2>Description of Service</h2>
          <p>
            LeLink is a healthcare platform that provides:
          </p>
          <ul>
            <li>AI-powered medical triage and symptom assessment</li>
            <li>Secure storage and management of medical records</li>
            <li>Healthcare provider communication tools</li>
            <li>Blockchain-based audit trails for data integrity</li>
          </ul>

          <h2>Medical Disclaimer</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6">
            <p className="text-yellow-800 font-semibold">
              IMPORTANT: LeLink is not a substitute for professional medical advice, diagnosis, or treatment. 
              Always seek the advice of qualified healthcare providers for any medical concerns.
            </p>
          </div>

          <h2>User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Maintain the confidentiality of your account credentials</li>
            <li>Use the platform only for legitimate healthcare purposes</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Respect the privacy and rights of other users</li>
          </ul>

          <h2>Data Ownership and Control</h2>
          <p>
            You retain full ownership and control of your medical data. LeLink acts as a secure 
            custodian of your information, ensuring:
          </p>
          <ul>
            <li>Your data remains under your control</li>
            <li>You can grant or revoke access permissions</li>
            <li>Data portability if you choose to leave the platform</li>
            <li>Transparent audit trails of all data access</li>
          </ul>

          <h2>Prohibited Uses</h2>
          <p>You may not use LeLink to:</p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Access unauthorized data or systems</li>
            <li>Share false or misleading medical information</li>
            <li>Interfere with platform security or operations</li>
            <li>Use the service for commercial purposes without authorization</li>
          </ul>

          <h2>Service Availability</h2>
          <p>
            We strive for 99.9% uptime but cannot guarantee uninterrupted service. 
            Maintenance windows will be scheduled during non-peak hours with advance notice.
          </p>

          <h2>Privacy and Security</h2>
          <p>
            Your privacy is paramount. We implement robust security measures including 
            blockchain technology and encryption. See our Privacy Policy for detailed information.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            LeLink is provided "as is" without warranties. In no event shall Hora e.V. or 
            Modern-Miracle.eu be liable for any indirect, incidental, or consequential damages.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We may update these terms periodically. Users will be notified of significant 
            changes, and continued use constitutes acceptance of the updated terms.
          </p>

          <h2>Contact Information</h2>
          <p>
            For questions about these Terms of Service:
          </p>
          <p>
            <strong>Hora e.V.</strong><br />
            ZVR: 1335812639<br />
            Email: legal@hora-ev.eu<br />
            Website: <a href="https://hora-ev.eu" className="text-teal-600">hora-ev.eu</a>
          </p>
        </div>
      </div>
    </div>
  )
}