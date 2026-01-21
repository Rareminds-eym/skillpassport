import { useState, useEffect } from 'react';
import {
  ChevronDown,
  Menu,
  FileText,
  Calendar,
  RotateCcw,
  Shield,
  Lock,
  Eye,
  Database,
  Globe,
  Users,
  Bell,
  Cookie,
  AlertCircle,
  Mail,
} from 'lucide-react';

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sections = [
    { id: 0, title: 'Introduction', icon: '1' },
    { id: 1, title: 'Data We Collect', icon: '2' },
    { id: 2, title: 'How We Use Your Data', icon: '3' },
    { id: 3, title: 'Legal Basis for Processing', icon: '4' },
    { id: 4, title: 'Data Sharing & Disclosure', icon: '5' },
    { id: 5, title: 'Data Retention', icon: '6' },
    { id: 6, title: 'Your Rights', icon: '7' },
    { id: 7, title: 'Data Security', icon: '8' },
    { id: 8, title: 'Cross-Border Transfers', icon: '9' },
    { id: 9, title: 'Cookies & Tracking', icon: '10' },
    { id: 10, title: "Children's Privacy", icon: '11' },
    { id: 11, title: 'Grievance Redressal', icon: '12' },
    { id: 12, title: 'Policy Updates', icon: '13' },
    { id: 13, title: 'Contact Us', icon: '14' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionNumber = parseInt(entry.target.id.split('-')[1]);
            setActiveSection(sectionNumber);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -75% 0px',
        threshold: 0,
      }
    );

    document.querySelectorAll('section[id^="section-"]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (index) => {
    const element = document.getElementById(`section-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="w-16 h-16 text-blue-200" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-blue-100 mb-2">
              Skill Passport Portal – Rareminds Private Limited
            </p>
            <p className="text-blue-200">DPDP Act, IT Act & Global Compliance Edition – 2026</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Effective: 1 January 2026</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>Last Updated: 1 January 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 mb-4 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Menu className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-gray-900">Sections</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-blue-600 transition-transform ${
                  mobileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Navigation Menu */}
            <div
              className={`${
                mobileOpen ? 'block' : 'hidden'
              } lg:block sticky top-24 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm`}
            >
              <div className="bg-blue-600 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  <h3 className="text-white font-medium text-sm">Table of Contents</h3>
                </div>
              </div>
              <nav className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                        activeSection === section.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {section.icon}
                    </span>
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Introduction Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <p className="text-gray-700 leading-relaxed text-lg">
                This Privacy Policy ("Policy") explains how Rareminds Private Limited ("Rareminds",
                "Company", "we", "our", or "us") collects, uses, stores, shares, and protects
                personal data through the website{' '}
                <a
                  href="https://rareminds.in"
                  className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-2 underline-offset-2"
                >
                  rareminds.in
                </a>
                , its subdomains, platforms, APIs, tools (including Skill Passport), applications,
                dashboards, and services (collectively, the "Platform").
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                By accessing or using the Platform, you acknowledge that you have read, understood,
                and agree to be bound by this Policy. If you do not agree, please discontinue use of
                the Platform.
              </p>
            </div>

            {/* Section 1: Introduction */}
            <section id="section-0" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Introduction & Scope</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>This Policy applies to all users of the Platform, including:</p>
                  <ul className="space-y-3 ml-2">
                    {[
                      'Students and learners accessing skill development, assessments, and career services',
                      'Educational institutions, colleges, and universities',
                      'Employers, recruiters, and corporate partners',
                      'Government bodies and regulatory agencies',
                      'Faculty, educators, and training providers',
                      'Any other individuals or entities interacting with the Platform',
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-2">Compliance Framework:</p>
                    <ul className="space-y-2 text-sm text-blue-800 ml-2">
                      {[
                        'Digital Personal Data Protection Act, 2023 (DPDP Act) – India',
                        'Information Technology Act, 2000 and applicable IT Rules',
                        'General Data Protection Regulation (GDPR) – EU/UK (where applicable)',
                        'Other relevant international data protection frameworks',
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="flex-shrink-0">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Data We Collect */}
            <section id="section-1" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Data We Collect</h2>
                </div>
                <div className="space-y-6 text-gray-700">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Personal Information
                    </h3>
                    <ul className="space-y-2 ml-2">
                      {[
                        'Full name, date of birth, gender, and nationality',
                        'Contact details: email address, phone number, postal address',
                        'Government-issued identification numbers (Aadhaar, PAN, Passport – where legally required)',
                        'Educational qualifications, certifications, and academic records',
                        'Employment history, skills, and professional experience',
                        'Profile photographs and biometric data (where applicable and with consent)',
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      Skill Passport Data
                    </h3>
                    <ul className="space-y-2 ml-2">
                      {[
                        'Skill assessments, competency scores, and evaluation results',
                        'Digital credentials, badges, and certifications',
                        'Learning progress, course completions, and training records',
                        'Career preferences, job applications, and placement data',
                        'Verification status and authenticity records',
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                      Technical & Usage Data
                    </h3>
                    <ul className="space-y-2 ml-2">
                      {[
                        'IP address, device type, browser information, and operating system',
                        'Log data, access times, and session duration',
                        'Pages visited, features used, and interaction patterns',
                        'Cookies, pixels, and similar tracking technologies',
                        'Referral sources and navigation paths',
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-600" />
                      Communication Data
                    </h3>
                    <ul className="space-y-2 ml-2">
                      {[
                        'Messages, inquiries, and support requests',
                        'Feedback, reviews, and survey responses',
                        'Communication preferences and consent records',
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: How We Use Your Data */}
            <section id="section-2" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">How We Use Your Data</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p className="font-medium">
                    We process your personal data for the following purposes:
                  </p>
                  <ul className="space-y-3 ml-2">
                    {[
                      'To provide, maintain, and improve Platform services and features',
                      'To create and manage your Skill Passport profile and digital credentials',
                      'To conduct skill assessments, evaluations, and competency mapping',
                      'To facilitate job matching, placement services, and career opportunities',
                      'To enable communication between students, institutions, and employers',
                      'To process payments, subscriptions, and financial transactions',
                      'To send service-related notifications, updates, and alerts',
                      'To provide customer support and respond to inquiries',
                      'To conduct analytics, research, and platform optimization',
                      'To ensure security, prevent fraud, and detect unauthorized access',
                      'To comply with legal obligations and regulatory requirements',
                      'To enforce our Terms and Conditions and protect our rights',
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4: Legal Basis for Processing */}
            <section id="section-3" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Legal Basis for Processing</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>We process personal data based on the following legal grounds:</p>
                  <div className="grid gap-4 mt-4">
                    {[
                      {
                        title: 'Consent',
                        desc: 'Where you have provided explicit consent for specific processing activities',
                      },
                      {
                        title: 'Contractual Necessity',
                        desc: 'To perform our contractual obligations and deliver services you have requested',
                      },
                      {
                        title: 'Legal Obligation',
                        desc: 'To comply with applicable laws, regulations, and legal processes',
                      },
                      {
                        title: 'Legitimate Interests',
                        desc: 'For our legitimate business interests, provided they do not override your fundamental rights',
                      },
                      {
                        title: 'Public Interest',
                        desc: 'For tasks carried out in the public interest or in exercise of official authority',
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-gray-700">
                      Under the DPDP Act, 2023, we ensure that personal data is processed only for
                      lawful purposes with valid consent or other permissible grounds as specified
                      under the Act.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Data Sharing & Disclosure */}
            <section id="section-4" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    5
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Data Sharing & Disclosure</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p className="font-medium">We may share your personal data with:</p>
                  <ul className="space-y-3 ml-2">
                    {[
                      'Educational institutions and colleges for verification and placement purposes',
                      'Employers and recruiters for job matching and hiring processes',
                      'Government bodies and regulatory authorities as required by law',
                      'Service providers and vendors who assist in Platform operations',
                      'Payment processors and financial institutions for transaction processing',
                      'Analytics providers for platform improvement and insights',
                      'Legal advisors and auditors for compliance and dispute resolution',
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Important Notice
                    </p>
                    <p className="text-sm text-yellow-800">
                      We do not sell your personal data to third parties. Data sharing is limited to
                      what is necessary for service delivery, legal compliance, or with your
                      explicit consent.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Data Retention */}
            <section id="section-5" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    6
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Data Retention</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    We retain personal data only for as long as necessary to fulfill the purposes
                    for which it was collected, including:
                  </p>
                  <ul className="space-y-3 ml-2">
                    {[
                      'Active account data: Retained while your account remains active',
                      'Skill Passport records: Retained for the duration of credential validity plus applicable statutory periods',
                      'Transaction records: Retained as required by tax and financial regulations (typically 7-10 years)',
                      'Communication records: Retained for customer service and legal purposes',
                      'Analytics data: Retained in anonymized form for platform improvement',
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-gray-700">
                      Upon account deletion or withdrawal of consent, we will delete or anonymize
                      your personal data within a reasonable timeframe, except where retention is
                      required by law or for legitimate business purposes.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7: Your Rights */}
            <section id="section-6" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    7
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p className="font-medium">
                    Under applicable data protection laws, you have the following rights:
                  </p>
                  <div className="grid gap-4 mt-4">
                    {[
                      {
                        title: 'Right to Access',
                        desc: 'Request a copy of the personal data we hold about you',
                      },
                      {
                        title: 'Right to Correction',
                        desc: 'Request correction of inaccurate or incomplete personal data',
                      },
                      {
                        title: 'Right to Erasure',
                        desc: 'Request deletion of your personal data (subject to legal exceptions)',
                      },
                      {
                        title: 'Right to Withdraw Consent',
                        desc: 'Withdraw consent for processing at any time (without affecting prior lawful processing)',
                      },
                      {
                        title: 'Right to Data Portability',
                        desc: 'Receive your data in a structured, machine-readable format',
                      },
                      {
                        title: 'Right to Object',
                        desc: 'Object to processing based on legitimate interests or direct marketing',
                      },
                      {
                        title: 'Right to Grievance Redressal',
                        desc: 'Lodge complaints with us or the relevant Data Protection Authority',
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-semibold text-blue-900">{item.title}</p>
                        <p className="text-sm text-blue-700 mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-gray-700">
                      To exercise any of these rights, please contact our Data Protection Officer at{' '}
                      <a
                        href="mailto:privacy@rareminds.in"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        privacy@rareminds.in
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8: Data Security */}
            <section id="section-7" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    8
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    We implement robust security measures to protect your personal data, including:
                  </p>
                  <ul className="space-y-3 ml-2">
                    {[
                      'Encryption of data in transit (TLS/SSL) and at rest (AES-256)',
                      'Secure authentication mechanisms including multi-factor authentication',
                      'Regular security audits, vulnerability assessments, and penetration testing',
                      'Access controls and role-based permissions for data access',
                      'Employee training on data protection and security best practices',
                      'Incident response procedures for data breach management',
                      'Secure data centers with physical and environmental controls',
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <Lock className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      While we implement industry-standard security measures, no system is
                      completely secure. We encourage users to protect their account credentials and
                      report any suspicious activity immediately.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 9: Cross-Border Transfers */}
            <section id="section-8" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    9
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Cross-Border Data Transfers</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Your personal data may be transferred to and processed in countries outside
                    India for:
                  </p>
                  <ul className="space-y-3 ml-2">
                    {[
                      'Cloud hosting and infrastructure services',
                      'Analytics and platform optimization',
                      'Customer support and communication services',
                      'Payment processing and financial services',
                      'Verification and authentication services',
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <Globe className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-2">Transfer Safeguards:</p>
                    <ul className="space-y-2 text-sm text-blue-800 ml-2">
                      {[
                        'Standard Contractual Clauses (SCCs) with data processors',
                        'Adequacy decisions where applicable',
                        'Binding Corporate Rules for intra-group transfers',
                        'Compliance with DPDP Act requirements for cross-border transfers',
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="flex-shrink-0">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="mt-4">
                    By using the Platform, you consent to such cross-border transfers in accordance
                    with applicable law and this Policy.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 10: Cookies & Tracking */}
            <section id="section-9" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    10
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Cookies & Tracking Technologies
                  </h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>We use cookies and similar technologies to enhance your experience:</p>
                  <div className="grid gap-4 mt-4">
                    {[
                      {
                        title: 'Essential Cookies',
                        desc: 'Required for Platform functionality, authentication, and security',
                        type: 'Required',
                      },
                      {
                        title: 'Performance Cookies',
                        desc: 'Help us understand how users interact with the Platform',
                        type: 'Optional',
                      },
                      {
                        title: 'Functional Cookies',
                        desc: 'Remember your preferences and settings',
                        type: 'Optional',
                      },
                      {
                        title: 'Analytics Cookies',
                        desc: 'Collect anonymized data for platform improvement',
                        type: 'Optional',
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-start gap-4"
                      >
                        <Cookie className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900">{item.title}</p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${item.type === 'Required' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {item.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-gray-700">
                      You can manage cookie preferences through your browser settings. Note that
                      disabling certain cookies may affect Platform functionality.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 11: Children's Privacy */}
            <section id="section-10" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    11
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Children's Privacy</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    The Platform is primarily intended for users who are 18 years of age or older.
                    However, certain educational services may be accessible to minors through
                    institutional programs.
                  </p>
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="font-semibold text-purple-900 mb-2">For Users Under 18:</p>
                    <ul className="space-y-2 text-sm text-purple-800 ml-2">
                      {[
                        'Parental or guardian consent is required for data processing',
                        'Institutions must ensure appropriate consent mechanisms are in place',
                        "We implement additional safeguards for minor users' data",
                        'Parents/guardians may exercise data rights on behalf of minors',
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="flex-shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="mt-4">
                    If we become aware that we have collected personal data from a child without
                    appropriate consent, we will take steps to delete such information promptly.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 12: Grievance Redressal */}
            <section id="section-11" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    12
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Grievance Redressal</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    In accordance with the DPDP Act, 2023 and IT Act, 2000, we have appointed a
                    Grievance Officer to address your concerns:
                  </p>
                  <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Grievance Officer Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">Data Protection Officer, Rareminds</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <a
                            href="mailto:grievance@rareminds.in"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            grievance@rareminds.in
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="font-medium text-gray-900 mb-2">Grievance Resolution Process:</p>
                    <ul className="space-y-2 ml-2">
                      {[
                        'Acknowledgment of complaint within 48 hours',
                        'Investigation and response within 30 days',
                        'Escalation to senior management if unresolved',
                        'Right to approach the Data Protection Board of India',
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="text-blue-600 font-bold">{idx + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 13: Policy Updates */}
            <section id="section-12" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    13
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Policy Updates</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>We may update this Privacy Policy from time to time to reflect:</p>
                  <ul className="space-y-3 ml-2">
                    {[
                      'Changes in applicable laws and regulations',
                      'Updates to our data processing practices',
                      'New features or services on the Platform',
                      'Feedback from users and regulatory authorities',
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Notification of Changes:</span> Material
                      changes will be communicated through email, Platform notifications, or
                      prominent notices on our website. The "Last Updated" date at the top of this
                      Policy indicates when it was last revised.
                    </p>
                  </div>
                  <p className="mt-4">
                    Continued use of the Platform after changes constitutes acceptance of the
                    updated Policy.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 14: Contact Us */}
            <section id="section-13" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    14
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    For any questions, concerns, or requests regarding this Privacy Policy or our
                    data practices, please contact us:
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3">General Inquiries</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-gray-500">Email:</span>{' '}
                          <a
                            href="mailto:privacy@rareminds.in"
                            className="text-blue-600 hover:underline"
                          >
                            privacy@rareminds.in
                          </a>
                        </p>
                        <p>
                          <span className="text-gray-500">Website:</span>{' '}
                          <a href="https://rareminds.in" className="text-blue-600 hover:underline">
                            rareminds.in
                          </a>
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Registered Office</h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-700">Rareminds Private Limited</p>
                        <p className="text-gray-600">Bengaluru, Karnataka, India</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer Note */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Your Privacy Matters</h3>
                  <p className="text-blue-100 text-sm">
                    At Rareminds, we are committed to protecting your personal data and ensuring
                    transparency in our data practices. If you have any questions or concerns about
                    how we handle your information, please don't hesitate to reach out to us.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
