export default function Compliance() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Compliance & Certifications</h1>
        <div className="bg-white rounded-lg shadow-lg p-8 prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <h2>Regulatory Compliance</h2>
          <p>
            LeLink is designed to meet the highest international standards for healthcare 
            data protection and privacy. Our compliance framework covers multiple jurisdictions 
            to ensure global accessibility while maintaining strict security standards.
          </p>

          <div className="grid md:grid-cols-3 gap-6 my-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-blue-800 font-semibold mb-3">GDPR Compliant</h3>
              <p className="text-blue-700 text-sm">
                Full compliance with the European General Data Protection Regulation, 
                ensuring complete user control over personal data.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-green-800 font-semibold mb-3">HIPAA Aligned</h3>
              <p className="text-green-700 text-sm">
                Following US Health Insurance Portability and Accountability Act standards 
                for protected health information.
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-purple-800 font-semibold mb-3">PIPEDA Aligned</h3>
              <p className="text-purple-700 text-sm">
                Adhering to Canada's Personal Information Protection and Electronic Documents Act 
                principles for privacy protection.
              </p>
            </div>
          </div>

          <h2>Security Standards</h2>
          <h3>Data Encryption</h3>
          <ul>
            <li>AES-256 encryption for data at rest</li>
            <li>TLS 1.3 for data in transit</li>
            <li>End-to-end encryption for sensitive communications</li>
          </ul>

          <h3>Access Control</h3>
          <ul>
            <li>Multi-factor authentication (MFA) required</li>
            <li>Role-based access control (RBAC)</li>
            <li>Zero-trust network architecture</li>
            <li>Regular access reviews and audits</li>
          </ul>

          <h3>Blockchain Security</h3>
          <ul>
            <li>Immutable audit trails for all data access</li>
            <li>Cryptographic hashing for data integrity verification</li>
            <li>Decentralized architecture prevents single points of failure</li>
          </ul>

          <h2>Audit and Monitoring</h2>
          <h3>Continuous Monitoring</h3>
          <ul>
            <li>24/7 security monitoring and alerting</li>
            <li>Automated threat detection systems</li>
            <li>Regular vulnerability assessments</li>
            <li>Incident response procedures</li>
          </ul>

          <h3>Compliance Audits</h3>
          <ul>
            <li>Annual third-party security audits</li>
            <li>Regular compliance assessments</li>
            <li>Penetration testing every 6 months</li>
            <li>Documentation of all security controls</li>
          </ul>

          <h2>Data Governance</h2>
          <h3>Data Minimization</h3>
          <p>
            We collect only the minimum data necessary for providing healthcare services, 
            and automatically purge data according to retention policies.
          </p>

          <h3>Data Sovereignty</h3>
          <p>
            Patients maintain complete control over their data, including:
          </p>
          <ul>
            <li>Who can access their information</li>
            <li>How long data is retained</li>
            <li>Where data is processed and stored</li>
            <li>The right to data portability and deletion</li>
          </ul>

          <h2>International Standards</h2>
          <h3>ISO 27001</h3>
          <p>
            Our information security management system follows ISO 27001 best practices 
            for systematic security management.
          </p>

          <h3>ISO 27799</h3>
          <p>
            We implement health informatics security management specifically designed 
            for healthcare organizations.
          </p>

          <h3>FHIR R4</h3>
          <p>
            Full compliance with Fast Healthcare Interoperability Resources (FHIR) R4 
            standard for healthcare data exchange.
          </p>

          <h2>Disaster Recovery & Business Continuity</h2>
          <ul>
            <li><strong>RPO (Recovery Point Objective):</strong> 1 hour maximum data loss</li>
            <li><strong>RTO (Recovery Time Objective):</strong> 4 hours maximum downtime</li>
            <li>Automated backups with geographic redundancy</li>
            <li>Regular disaster recovery testing</li>
            <li>99.9% uptime service level agreement</li>
          </ul>

          <h2>Transparency and Accountability</h2>
          <h3>Open Source Commitment</h3>
          <p>
            LeLink is an open-source project, ensuring:
          </p>
          <ul>
            <li>Full transparency of security implementations</li>
            <li>Community review and contributions</li>
            <li>No hidden backdoors or vulnerabilities</li>
            <li>Public audit of all code changes</li>
          </ul>

          <h3>Public Reporting</h3>
          <ul>
            <li>Annual transparency reports</li>
            <li>Security incident disclosure (when appropriate)</li>
            <li>Compliance certification updates</li>
            <li>Open documentation of security practices</li>
          </ul>

          <h2>Contact Our Compliance Team</h2>
          <p>
            For compliance inquiries, security reports, or certification questions:
          </p>
          <p>
            <strong>Hora e.V. Compliance Office</strong><br />
            ZVR: 1335812639<br />
            Email: compliance@hora-ev.eu<br />
            Security Issues: security@hora-ev.eu<br />
            Website: <a href="https://hora-ev.eu" className="text-teal-600">hora-ev.eu</a>
          </p>

          <div className="bg-teal-50 border-l-4 border-teal-400 p-4 mt-8">
            <p className="text-teal-800">
              <strong>Responsible Disclosure:</strong> If you discover a security vulnerability, 
              please report it to security@hora-ev.eu. We appreciate responsible disclosure 
              and will acknowledge and address reports promptly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}