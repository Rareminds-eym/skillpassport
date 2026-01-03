import { useState, useEffect } from "react";
import { ChevronDown, Menu, FileText, Calendar, RotateCcw } from "lucide-react";

const TermsAndConditions = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sections = [
    { id: 0, title: "Eligibility & Lawful Use", icon: "1" },
    { id: 1, title: "Scope of Services", icon: "2" },
    { id: 2, title: "User Accounts", icon: "3" },
    { id: 3, title: "Intellectual Property", icon: "4" },
    { id: 4, title: "Acceptable Use", icon: "5" },
    { id: 5, title: "Data Protection", icon: "6" },
    { id: 6, title: "Payments & Taxes", icon: "7" },
    { id: 7, title: "Limitation of Liability", icon: "8" },
    { id: 8, title: "Indemnification", icon: "9" },
    { id: 9, title: "Governing Law", icon: "10" },
    { id: 10, title: "Amendments", icon: "11" },
    { id: 11, title: "Force Majeure", icon: "12" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionNumber = parseInt(entry.target.id.split("-")[1]);
            setActiveSection(sectionNumber);
          }
        });
      },
      {
        root: null,
        rootMargin: "-20% 0px -75% 0px",
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
      element.scrollIntoView({ behavior: "smooth" });
      setMobileOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Terms and Conditions
            </h1>
            <p className="text-xl text-blue-100 mb-2">Rareminds Private Limited</p>
            <p className="text-blue-200">DPDP, IT Act & Global Compliance Edition – 2026</p>
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
                  mobileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Navigation Menu */}
            <div
              className={`${
                mobileOpen ? "block" : "hidden"
              } lg:block sticky top-24 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm`}
            >
              <div className="bg-blue-600 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  <h3 className="text-white font-medium text-sm">Table of Contents</h3>
                </div>
              </div>
              <nav className="divide-y divide-gray-100">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                      activeSection === section.id
                        ? "bg-blue-50 border-l-4 border-blue-600 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                        activeSection === section.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600"
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
                These Terms and Conditions ("Terms") govern access to and use of the website{" "}
                <a
                  href="https://rareminds.in"
                  className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-2 underline-offset-2"
                >
                  rareminds.in
                </a>
                , its subdomains, platforms, APIs, tools (including Skill Passport), applications,
                dashboards, and services (collectively, the "Platform") operated by Rareminds Private
                Limited ("Rareminds", "Company", "we", "our", or "us"). By accessing or using the Platform, you confirm that you have read, understood, and agree to be legally bound by these Terms, our Privacy Policy, and all applicable laws.
              </p>
            </div>

            {/* Section 1: Eligibility */}
            <section id="section-0" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Eligibility & Lawful Use</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p className="font-medium">By using the Platform, you represent and warrant that:</p>
                  <ul className="space-y-3 ml-2">
                    {[
                      "You are 18 years of age or older, or have valid legal capacity under applicable law",
                      "You are accessing the Platform in compliance with all applicable local, national, and international laws, including employment, education, and data protection laws",
                      "You are not prohibited by law from receiving services offered on the Platform",
                      "Certain services, certifications, assessments, or hiring programs may be restricted based on geography, regulation, institution, or government policy",
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-gray-700">
                      Rareminds reserves the right to restrict, suspend, or deny access to any service
                      where required by law or regulatory obligation.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Services */}
            <section id="section-1" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Scope of Services</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p className="font-medium">Rareminds provides workforce, education, and employability infrastructure services, including but not limited to:</p>
                  <ul className="space-y-2 ml-2">
                    {[
                      "Skill Passport, skill verification, and digital credentialing",
                      "Competency mapping and assessment frameworks",
                      "Institutional, corporate, and government training programs",
                      "Faculty Development Programs (FDPs)",
                      "Student employability, placement enablement, and career readiness",
                      "Recruitment enablement, talent verification, and employer dashboards",
                      "Hackathons, assessments, and evaluation initiatives",
                      "Online, blended, and digital learning solutions",
                      "Analytics, insights, and reporting tools",
                      "Career mentoring and advisory services",
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-gray-700">
                      Service availability may vary based on region, institution, regulatory approval, or contractual scope.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: User Accounts */}
            <section id="section-2" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">User Accounts, Accuracy & Regional Compliance</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p className="font-medium">Where account creation is required, you agree to:</p>
                  <ul className="space-y-3 ml-2">
                    {[
                      "Provide accurate, complete, and up-to-date information",
                      "Maintain the confidentiality of login credentials",
                      "Be solely responsible for all activity conducted under your account",
                      "Comply with applicable labour, education, and data protection laws",
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-gray-700">
                      Rareminds may request identity or eligibility verification where required for regulatory, institutional, or compliance purposes.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Intellectual Property */}
            <section id="section-3" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Intellectual Property Rights</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p className="font-medium">All Platform content, including but not limited to:</p>
                  <ul className="space-y-2 ml-2">
                    {[
                      "Software, frameworks, algorithms, and assessments",
                      "Skill Passport architecture",
                      "Course materials, dashboards, and reports",
                      "Logos, trademarks, designs, and branding",
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4">
                    are the exclusive intellectual property of Rareminds or its licensors and are protected under Indian intellectual property laws and international treaties.
                  </p>
                  <p>
                    You may not copy, reverse-engineer, distribute, sublicense, or commercially exploit
                    any content without prior written authorization. Limited rights may be granted to
                    institutional or enterprise partners under separate written agreements.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Acceptable Use */}
            <section id="section-4" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    5
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Acceptable Use & Prohibited Conduct</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p className="font-medium">You agree not to:</p>
                  <ul className="space-y-3 ml-2">
                    {[
                      "Provide false, misleading, or fraudulent information",
                      "Misrepresent skills, certifications, or assessment outcomes",
                      "Attempt unauthorized access to systems, APIs, or databases",
                      "Introduce malware, bots, or disruptive technologies",
                      "Violate employment, education, or data protection laws",
                      "Misuse Rareminds credentials, reports, or branding",
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1 flex-shrink-0">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-gray-700">
                      Violations may result in suspension, termination, or legal action, without prejudice
                      to other available remedies.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Data Protection */}
            <section id="section-5" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    6
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Data Protection, Privacy & Cross-Border Processing</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>Your use of the Platform is governed by our Privacy Policy, which complies with:</p>
                  <ul className="space-y-2 ml-2">
                    {[
                      "Digital Personal Data Protection Act, 2023 (India)",
                      "Information Technology Act, 2000 and applicable IT Rules",
                      "GDPR (EU/UK), Optional", 
                      "Other relevant global data protection frameworks",
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-2">Key DPDP & Global Commitments:</p>
                    <ul className="space-y-2 text-sm text-blue-800 ml-2">
                      {[
                        "Personal data is collected only for lawful, specific, and legitimate purposes",
  "Data is processed based on valid user consent, contractual necessity, or legal obligation",
  "Users have rights to access, correction, withdrawal of consent, grievance redressal, and erasure, as provided under applicable law",
  "Personal data may be stored or processed outside India for secure service delivery, communication, analytics, or verification, subject to appropriate safeguards",
  "Reasonable security practices and technical safeguards are implemented to protect personal data",
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="flex-shrink-0">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-700 font-medium">
                      By using the Platform, you expressly consent to such processing in accordance with applicable law.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7: Payments */}
            <section id="section-6" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    7
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Payments, Taxes & Regional Commercial Terms</h2>
                </div>
                <ul className="space-y-3 text-gray-700 ml-2">
                  {[
                    "Pricing may vary by geography, institution, or engagement model",
                    "Payments must be made through authorized payment gateways or invoicing mechanisms",
                    "Institutional, B2B, or government engagements may be governed by custom contracts, which shall prevail over these Terms",
                    "You are responsible for all applicable taxes, duties, or levies",
                    "Refunds, if applicable, are governed by our Refund Policy or specific contractual terms",
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-blue-600 font-bold mt-1 flex-shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Section 8: Limitation of Liability */}
            <section id="section-7" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    8
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Limitation of Liability</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p className="font-medium">To the maximum extent permitted by applicable law:</p>
                  <ul className="space-y-3 ml-2">
                    {[
                      "Rareminds shall not be liable for indirect, incidental, special, or consequential damages",
                      "Rareminds is not responsible for failures caused by third-party platforms, infrastructure outages, regulatory changes, or force majeure events",
                      "Total liability shall not exceed the amount paid by you for the specific service giving rise to the claim",
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-gray-700">
                      Where liability limitations are restricted by law, liability shall be limited to the minimum extent permitted.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 9: Indemnification */}
            <section id="section-8" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    9
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Indemnification</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    You agree to indemnify and hold harmless Rareminds, its directors, officers,
                    employees, partners, and licensors from any claims arising out of:
                  </p>
                  <ul className="space-y-3 ml-2">
                    {[
                      "Your use or misuse of the Platform",
                      "Breach of these Terms",
                      "Violation of applicable laws or third-party rights",
                      "Misrepresentation or misuse of credentials, verification data, or reports",
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

            {/* Section 10: Governing Law */}
            <section id="section-9" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    10
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Governing Law & Jurisdiction</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-900">Governing Law:</p>
                    <p>Laws of India</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Jurisdiction:</p>
                    <p>Courts of Bengaluru, Karnataka</p>
                  </div>
                  <p className="pt-4 border-t border-gray-200">
                    International or institutional engagements may provide for alternate dispute resolution mechanisms under written agreements.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 11: Amendments */}
            <section id="section-10" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    11
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Amendments & Platform Evolution</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>Rareminds may modify these Terms to reflect:</p>
                  <ul className="space-y-2 ml-2">
                    {[
                      "Changes in law or regulation",
                      "Platform upgrades or feature enhancements",
                      "Expansion into new geographies",
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-600 font-bold mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4">
                    Revised Terms will be published with an updated effective date. Continued use of the Platform constitutes acceptance.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 12: Force Majeure */}
            <section id="section-11" className="scroll-mt-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    12
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Force Majeure</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Rareminds shall not be liable for delays or failures caused by events beyond reasonable control, including:
                  </p>
                  <ul className="space-y-2 ml-2">
                    {[
                      "Natural disasters",
                      "Pandemics or public health emergencies",
                      "Government actions or regulatory changes",
                      "Internet or infrastructure failures",
                      "Geopolitical or regional disruptions",
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


          </div>
        </div>
      </div>


    </div>
  );
};

export default TermsAndConditions;