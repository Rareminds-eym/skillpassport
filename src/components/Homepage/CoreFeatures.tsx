
import React, {useEffect} from "react";
import { FiCheckCircle, FiUsers, FiTrendingUp, FiShield, FiGitBranch } from "react-icons/fi";

const CoreFeatures: React.FC = () => {
   useEffect(() => {
    const lines = document.querySelectorAll<SVGPathElement | SVGLineElement>(
      ".animated-draw"
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-now");
          } else {
            entry.target.classList.remove("animate-now");
          }
        });
      },
      { threshold: 0.3 } // Trigger when 30% visible
    );

    lines.forEach((line) => observer.observe(line));

    return () => observer.disconnect();
  }, []);
  return (
    <div 
      className="relative flex flex-col items-center justify-center min-h-screen py-12 overflow-hidden bg-section-with-opacity"
    >
      {/* === Inline Animation Styles === */}
     <style>{`
  .bg-section-with-opacity::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("/assets/HomePage/background.webp");
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.05;
    z-index: 0;
  }

  @media (max-width: 768px) {
    .bg-section-with-opacity::before {
      background-image: url("/assets/HomePage/background_mobile.webp");
    }
  }

  @keyframes drawLine {
    0% { stroke-dashoffset: var(--path-length); }
    100% { stroke-dashoffset: 0; }
  }

  .animated-draw {
    stroke: black;
    stroke-width: 1;
    fill: none;
    stroke-dasharray: var(--path-length);
    stroke-dashoffset: var(--path-length);
    transition: stroke-dashoffset 1s ease;
  }

  .animate-now {
    animation: drawLine 3s ease-in-out forwards;
  }

  .card-hover {
    transition: all 0.1s ease;
  }

  .card-hover:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    border-color: #d4af37;
  }

  @media (max-width: 768px) {
    .desktop-diagram { display: none; }
  }
`}</style>

      {/* ===== Heading Section ===== */}
      <div className="relative z-10 text-center mb-20 px-4 -mt-4 sm:mt-10">
  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
    Our Core Features
  </h1>
  <p className="text-base sm:text-lg md:text-2xl text-gray-600 mt-3 sm:mt-6">
    Comprehensive Skill Management Ecosystem
  </p>
</div>


      {/* ===== Desktop Diagram ===== */}
     {/* ===== Desktop Diagram ===== */}
      <div className="desktop-diagram relative w-full max-w-[1300px] h-[700px] mx-auto px-4 lg:scale-100 md:scale-75 transition-all duration-300">

        {/* === Center Card === */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative w-[300px] h-[120px]">
            <svg
  className="
    absolute 
    left-[-15px] 
    top-[2px] 
    lg:top-[2px]
    lg:left-[-15px]
    md:left-[-10px] 
    sm:left-[-5px] 
    sm:top-[4px] 
    z-0 
    scale-y-[-1] 
    scale-x-[-1] 
    w-[10vw] 
    max-w-[116px] 
    h-auto
  "
  viewBox="0 0 116 111"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid meet"
>
  <path
    d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 
       115.182 24.8693 115.242 54.8242C115.302 85.0699 
       90.7166 109.658 60.465 109.607L0.218569 109.505"
    stroke="black"
  />
</svg>
            <svg
  className="
    absolute 
    right-[-15px] 
    top-[3px] 
    lg:right-[-15px]
    lg:top-[3px]
    md:right-[-10px] 
    sm:right-[-5px] 
    sm:top-[5px] 
    z-0 
    scale-x-[-1] 
    rotate-180 
    scale-y-[-1] 
    w-[10vw] 
    max-w-[116px] 
    h-auto
  "
  viewBox="0 0 116 111"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid meet"
>
  <path
    d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 
       115.182 24.8693 115.242 54.8242C115.302 85.0699 
       90.7166 109.658 60.465 109.607L0.218569 109.505"
    stroke="black"
  />
</svg>

            <div className="relative bg-gradient-to-tr bg-[#D4AF37] rounded-[55px] h-[85px] lg:h-[85px] md:h-[80px] top-4 lg:top-4 md:top-3 sm:top-4 flex items-center justify-center shadow-md card-hover">
              <div className="text-center text-black font-semibold">
                <div className="text-[22px] lg:text-[22px] md:text-[21px] leading-none -mt-2 gap-1">Skill Ecosystem</div>
                <div className="text-[22px] lg:text-[22px] md:text-[21px]  leading-none">Stakeholders</div>
              </div>
            </div>
          </div>
        </div>

        {/* === Top Center === */}
        <div className="absolute top-[1%] left-1/2 -translate-x-1/2">
          <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
            w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
            bg-neutral-950  flex items-center justify-center shadow-md">
            <FiCheckCircle className="text-yellow-500 text-3xl" />
          </div>
          <div className="w-[300px] h-[120px] bg-white border-2 border-black rounded-2xl 
            p-4 shadow-md text-center card-hover flex flex-col justify-center">
            <h3 className="text-lg font-bold">Schools & Universities</h3>
            <p className="text-sm text-gray-600">
              Integrate skills into curriculum, enable credit pathways, and prepare learners for work.
            </p>
          </div>
        </div>
        <svg
          className="absolute left-1/2 top-[130px] -translate-x-1/2 delay-1"
          style={{ ["--path-length" as any]: 175 }}
          width="2"
          height="175"
          viewBox="0 0 2 175"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="1" y1="0" x2="1" y2="175" className="animated-draw" />
        </svg>

        {/* === Top Left === */}
        <div className="absolute top-[25%] left-[9%] lg-top-[25%] md:top-[21%]">
          <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
            w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
            bg-neutral-950  flex items-center justify-center shadow-md">
            <FiUsers className="text-yellow-500 text-3xl" />
          </div>
          <div className="w-[300px] h-[120px] bg-white border-2 border-black rounded-2xl 
            p-4 shadow-md text-center card-hover flex flex-col justify-center">
            <h3 className="text-lg font-bold">Students & Workforce Talent</h3>
            <p className="text-sm text-gray-600">
             School learners, university students, and professionals building skill portfolios.
            </p>
          </div>
        </div>
       <svg
  className="
    absolute 
    top-[260px] 
    left-[400px] 
    lg:left-[400px] 
    md:left-[310px] 
    md:top-[270px] 
    sm:left-[180px] 
    delay-2 
    w-[15vw] 
    max-w-[254px] 
    h-auto
  "
  style={{ ["--path-length" as any]: 320 }}
  viewBox="0 0 254 48"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid meet"
>
  <path
    d="M253.5 47.427L253.5 33.9571C253.5 25.6729 246.784 18.9572 
       238.5 18.9571L15.5 18.9567C7.21571 18.9567 0.5 12.241 0.5 3.95672L0.5 0"
    className="animated-draw"
  />
</svg>

        {/* === Top Right === */}
        <div className="absolute top-[22%] right-[10%] lg:top[22%] md:top-[21%]">
          <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
            w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
            bg-neutral-950  flex items-center justify-center shadow-md">
            <FiTrendingUp className="text-yellow-500 text-3xl" />
          </div>
          <div className="w-[300px] h-[120px] bg-white border-2 border-black rounded-2xl 
            p-4 shadow-md text-center card-hover flex flex-col justify-center">
            <h3 className="text-lg font-bold">Employers & Recruiters</h3>
            <p className="text-sm text-gray-600">
             Companies, HR teams, and recruiters who define hiring needs and validate job-readiness.
            </p>
          </div>
        </div>
    <svg
  className="
    absolute 
    top-[260px] 
    right-[400px] 
    lg:right-[400px] 
    md:right-[310px] 
    md:top-[270px]
    sm:right-[180px] 
    scale-x-[-1] 
    delay-3 
    w-[15vw] 
    max-w-[254px] 
    h-auto
  "
  style={{ ["--path-length" as any]: 320 }}
  viewBox="0 0 254 48"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid meet"
>
  <path
    d="M253.5 47.427L253.5 33.9571C253.5 25.6729 246.784 18.9572 
       238.5 18.9571L15.5 18.9567C7.21571 18.9567 0.5 12.241 0.5 3.95672L0.5 0"
    className="animated-draw"
  />
</svg>


        {/* === Bottom Left === */}
        <div className="absolute bottom-[22%] left-[9%] lg:bottom-[19%] md:bottom-[25%]">
          <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
            w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
             bg-neutral-950  flex items-center justify-center shadow-md">
            <FiShield className="text-yellow-500 text-3xl" />
          </div>
          <div className="w-[300px] h-[120px] bg-white border-2 border-black rounded-2xl 
            p-4 shadow-md text-center card-hover flex flex-col justify-center">
            <h3 className="text-lg font-bold">Training & EdTech Providers</h3>
            <p className="text-sm text-gray-600">
              Deliver competency-aligned learning, labs, apprenticeships, and on-the-job skilling.
            </p>
          </div>
        </div>
   <svg
  className="
    absolute 
    bottom-[250px] 
    left-[400px] 
    lg:left-[400px] 
    lg:bottom-[250px]
    md:left-[310px] 
    md:bottom-[270px]
    sm:left-[180px] 
    delay-4 
    w-[15vw] 
    max-w-[255px] 
    h-auto
  "
  style={{ ["--path-length" as any]: 400 }}
  viewBox="0 0 255 67"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid meet"
>
  <path
    d="M254.105 0.0198917L254.417 7.83847C254.757 16.3506 
       247.948 23.4366 239.429 23.4366L15.5 23.4366C7.2157 
       23.4366 0.5 30.1524 0.5 38.4366L0.5 66.1697"
    className="animated-draw"
  />
</svg>


        {/* === Bottom Right === */}
        <div className="absolute bottom-[22%] right-[9%] lg:bottom-[20%] md:bottom-[25%]">
          <div className="-mb-2">
            <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
              w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
               bg-neutral-950  flex items-center justify-center shadow-md">
              <FiGitBranch className="text-yellow-500 text-2xl" />
            </div>
            <div className="w-[300px] h-[120px] bg-white border-2 border-black rounded-2xl 
              p-4 shadow-md text-center card-hover flex flex-col justify-center">
              <h3 className="text-lg font-bold">Assessment & Credentialing Bodies</h3>
              <p className="text-sm text-gray-600">
                Run assessments and issue trusted, portable credentials and digital badges.
              </p>
            </div>
          </div>
        </div>
       <svg
        className="
          absolute 
          bottom-[250px] 
          right-[400px] 
          lg:right-[400px] 
          lg:bottom-[250px]
          md:right-[310px] 
          md:bottom-[270px]
          sm:right-[180px] 
          scale-x-[-1] 
          delay-5 
          w-[15vw] 
          max-w-[255px] 
          h-auto
        "
        style={{ ["--path-length" as any]: 400 }}
        viewBox="0 0 255 67"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d="M254.105 0.0198917L254.417 7.83847C254.757 16.3506 
             247.948 23.4366 239.429 23.4366L15.5 23.4366C7.2157 
             23.4366 0.5 30.1524 0.5 38.4366L0.5 66.1697"
          className="animated-draw"
        />
      </svg>
      </div>

      {/* ===== Mobile Version (No SVGs) ===== */}
      {/* ===== Mobile Version (Icons + Cards, No SVGs) ===== */}
      <div className = "mb-7">
<div className="flex flex-col items-center justify-center space-y-12 px-6 md:hidden">
  {[
    {
      icon: <FiCheckCircle className="text-yellow-500 text-2xl" />,
      title: "Skill Validation Engine",
      desc: "Authenticates skills via structured assessment data.",
    },
    {
      icon: <FiUsers className="text-yellow-500 text-2xl" />,
      title: "Enterprise APIs",
      desc: "Integrate and scale across locations and departments.",
    },
    {
      icon: <FiShield className="text-yellow-500 text-2xl" />,
      title: "Digital Badging & Certificates",
      desc: "Tamper-proof and shareable proof of competence.",
    },
    {
      icon: <FiTrendingUp className="text-yellow-500 text-2xl" />,
      title: "Competency Mapping",
      desc: "Align internal frameworks with industry standards.",
    },
    {
      icon: <FiGitBranch className="text-yellow-500 text-2xl" />,
      title: "Analytics Dashboard",
      desc: "Visualize training ROI and identify skill gaps.",
    },
  ].map((item, i) => (
    <div key={i} className="relative flex flex-col items-center">
      {/* === Icon above card === */}
      <div className="absolute -top-[37px] w-[60px] h-[60px] rounded-xl bg-gradient-to-tr bg-neutral-950 flex items-center justify-center shadow-md">
        {item.icon}
      </div>

      {/* === Card === */}
      <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center mt-[36px] card-hover">
        <h3 className="text-lg font-bold text-black">{item.title}</h3>
        <p className="text-sm text-gray-600">{item.desc}</p>
      </div>
    </div>
  ))}
</div>
</div>
    </div>
  );
};

export default CoreFeatures;


// import React, { useEffect } from "react";
// import { FiCheckCircle, FiUsers, FiTrendingUp, FiShield, FiGitBranch } from "react-icons/fi";

// const CoreFeatures: React.FC = () => {
//   useEffect(() => {
//     const lines = document.querySelectorAll<SVGPathElement | SVGLineElement>(
//       ".animated-draw"
//     );

//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             entry.target.classList.add("animate-now");
//           } else {
//             entry.target.classList.remove("animate-now");
//           }
//         });
//       },
//       { threshold: 0.3 }
//     );

//     lines.forEach((line) => observer.observe(line));

//     return () => observer.disconnect();
//   }, []);

//   return (
//     <div className="relative flex flex-col items-center justify-center min-h-screen bg-white py-12 overflow-hidden">
//       <style>{`
//         @keyframes drawLine {
//           0% { stroke-dashoffset: var(--path-length); }
//           100% { stroke-dashoffset: 0; }
//         }

//         .animated-draw {
//           stroke: black;
//           stroke-width: 1;
//           fill: none;
//           stroke-dasharray: var(--path-length);
//           stroke-dashoffset: var(--path-length);
//           transition: stroke-dashoffset 1s ease;
//         }

//         .animate-now {
//           animation: drawLine 3s ease-in-out forwards;
//         }

//         .card-hover {
//           transition: all 0.1s ease;
//         }

//         .card-hover:hover {
//           transform: translateY(-5px);
//           box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
//           border-color: #d4af37;
//         }

//         /* Desktop view */
//         @media (min-width: 1024px) {
//           .desktop-diagram { display: block; }
//           .tablet-diagram { display: none; }
//           .mobile-cards { display: none; }
//         }

//         /* Tablet view */
//         @media (min-width: 768px) and (max-width: 1023px) {
//           .desktop-diagram { display: none; }
//           .tablet-diagram { display: block; }
//           .mobile-cards { display: none; }
//         }

//         /* Mobile view */
//         @media (max-width: 767px) {
//           .desktop-diagram { display: none; }
//           .tablet-diagram { display: none; }
//           .mobile-cards { display: flex; }
//         }
//       `}</style>

//       {/* Heading Section */}
//       <div className="text-center mb-20 px-4 -mt-4 sm:mt-10">
//         <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
//           Our Core Features
//         </h1>
//         <p className="text-base sm:text-lg md:text-2xl text-gray-600 mt-3 sm:mt-6">
//           Comprehensive Skill Management Ecosystem
//         </p>
//       </div>

//       {/* Desktop Diagram */}
//       <div className="desktop-diagram relative w-full max-w-[1300px] h-[700px] mx-auto px-4">
//         {/* Center Card */}
//         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
//           <div className="relative w-[300px] h-[120px]">
//             <svg className="absolute left-[-15px] top-[2px] z-0 scale-y-[-1] scale-x-[-1]" width="116" height="111" viewBox="0 0 116 111" fill="none">
//               <path d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 115.182 24.8693 115.242 54.8242C115.302 85.0699 90.7166 109.658 60.465 109.607L0.218569 109.505" stroke="black" />
//             </svg>
//             <svg className="absolute right-[-15px] top-[3px] z-0 scale-x-[-1] rotate-180 scale-y-[-1]" width="116" height="111" viewBox="0 0 116 111" fill="none">
//               <path d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 115.182 24.8693 115.242 54.8242C115.302 85.0699 90.7166 109.658 60.465 109.607L0.218569 109.505" stroke="black" />
//             </svg>
//             <div className="relative bg-[#D4AF37] rounded-[55px] h-[88px] top-3 flex items-center justify-center shadow-md card-hover">
//               <div className="text-center text-white font-semibold">
//                 <div className="text-[22px] leading-none">Our</div>
//                 <div className="text-[22px] leading-none">Core Features</div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Top Center */}
//         <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-neutral-950 flex items-center justify-center shadow-md">
//             <FiCheckCircle className="text-yellow-500 text-3xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center card-hover">
//             <h3 className="text-lg font-bold">Skill Validation Engine</h3>
//             <p className="text-sm text-gray-600">Authenticates skills via structured assessment data.</p>
//           </div>
//         </div>
//         <svg className="absolute left-1/2 top-[130px] -translate-x-1/2" style={{ ["--path-length" as any]: 175 }} width="2" height="175" viewBox="0 0 2 175">
//           <line x1="1" y1="0" x2="1" y2="175" className="animated-draw" />
//         </svg>

//         {/* Top Left */}
//         <div className="absolute top-[22%] left-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-neutral-950 flex items-center justify-center shadow-md">
//             <FiUsers className="text-yellow-500 text-3xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center card-hover">
//             <h3 className="text-lg font-bold">Enterprise APIs</h3>
//             <p className="text-sm text-gray-600">Integrate and scale across locations and departments.</p>
//           </div>
//         </div>
//         <svg className="absolute left-[380px] top-[260px]" style={{ ["--path-length" as any]: 320 }} width="254" height="48" viewBox="0 0 254 48">
//           <path d="M253.5 47.427L253.5 33.9571C253.5 25.6729 246.784 18.9572 238.5 18.9571L15.5 18.9567C7.21571 18.9567 0.5 12.241 0.5 3.95672L0.5 0" className="animated-draw" />
//         </svg>

//         {/* Top Right */}
//         <div className="absolute top-[22%] right-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-neutral-950 flex items-center justify-center shadow-md">
//             <FiTrendingUp className="text-yellow-500 text-3xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center card-hover">
//             <h3 className="text-lg font-bold">Digital Badging & Certificates</h3>
//             <p className="text-sm text-gray-600">Tamper-proof and shareable proof of competence.</p>
//           </div>
//         </div>
//         <svg className="absolute right-[370px] top-[260px] scale-x-[-1]" style={{ ["--path-length" as any]: 320 }} width="254" height="48" viewBox="0 0 254 48">
//           <path d="M253.5 47.427L253.5 33.9571C253.5 25.6729 246.784 18.9572 238.5 18.9571L15.5 18.9567C7.21571 18.9567 0.5 12.241 0.5 3.95672L0.5 0" className="animated-draw" />
//         </svg>

//         {/* Bottom Left */}
//         <div className="absolute bottom-[20%] left-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-neutral-950 flex items-center justify-center shadow-md">
//             <FiShield className="text-yellow-500 text-3xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center card-hover">
//             <h3 className="text-lg font-bold">Competency Mapping</h3>
//             <p className="text-sm text-gray-600">Align internal frameworks with industry standards.</p>
//           </div>
//         </div>
//         <svg className="absolute left-[380px] bottom-[243px]" style={{ ["--path-length" as any]: 400 }} width="255" height="67" viewBox="0 0 255 67">
//           <path d="M254.105 0.0198917L254.417 7.83847C254.757 16.3506 247.948 23.4366 239.429 23.4366L15.5 23.4366C7.2157 23.4366 0.5 30.1524 0.5 38.4366L0.5 66.1697" className="animated-draw" />
//         </svg>

//         {/* Bottom Right */}
//         <div className="absolute bottom-[21%] right-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-neutral-950 flex items-center justify-center shadow-md">
//             <FiGitBranch className="text-yellow-500 text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center card-hover">
//             <h3 className="text-lg font-bold">Analytics Dashboard</h3>
//             <p className="text-sm text-gray-600">Visualize training ROI and identify skill gaps.</p>
//           </div>
//         </div>
//         <svg className="absolute right-[370px] bottom-[243px] scale-x-[-1]" style={{ ["--path-length" as any]: 400 }} width="255" height="67" viewBox="0 0 255 67">
//           <path d="M254.105 0.0198917L254.417 7.83847C254.757 16.3506 247.948 23.4366 239.429 23.4366L15.5 23.4366C7.2157 23.4366 0.5 30.1524 0.5 38.4366L0.5 66.1697" className="animated-draw" />
//         </svg>
//       </div>

//       {/* Tablet Diagram */}
//       {/* === TABLET DIAGRAM UPDATED === */}
// <div className="relative w-full max-w-[650px] h-[1150px] mx-auto px-4">

//   {/* === Center Card === */}
//   <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
//     <div className="relative w-[220px] h-[95px]">
//       <svg className="absolute left-[-10px] top-[1px] z-0 scale-y-[-1] scale-x-[-1]" width="85" height="85" viewBox="0 0 116 111" fill="none">
//         <path d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 115.182 24.8693 115.242 54.8242C115.302 85.0699 90.7166 109.658 60.465 109.607L0.218569 109.505" stroke="black" />
//       </svg>
//       <svg className="absolute right-[-10px] top-[1px] z-0 scale-x-[-1] rotate-180 scale-y-[-1]" width="85" height="85" viewBox="0 0 116 111" fill="none">
//         <path d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 115.182 24.8693 115.242 54.8242C115.302 85.0699 90.7166 109.658 60.465 109.607L0.218569 109.505" stroke="black" />
//       </svg>
//       <div className="relative bg-[#D4AF37] rounded-[42px] h-[68px] top-2 flex items-center justify-center shadow-md card-hover">
//         <div className="text-center text-white font-semibold">
//           <div className="text-[17px] leading-none">Our</div>
//           <div className="text-[17px] leading-none">Core Features</div>
//         </div>
//       </div>
//     </div>
//   </div>

//   {/* === Top Center === */}
//   <div className="absolute top-[4%] left-1/2 -translate-x-1/2">
//     <div className="absolute -top-[52px] left-1/2 -translate-x-1/2 w-[48px] h-[48px] rounded-xl bg-neutral-950 flex items-center justify-center shadow-md">
//       <FiCheckCircle className="text-yellow-500 text-2xl" />
//     </div>
//     <div className="w-[220px] bg-white border-2 border-black rounded-2xl p-3 shadow-md text-center card-hover">
//       <h3 className="text-base font-bold">Skill Validation Engine</h3>
//       <p className="text-xs text-gray-600">Authenticates skills via structured assessment data.</p>
//     </div>
//   </div>
//   <svg className="absolute left-1/2 top-[130px] -translate-x-1/2" style={{ ["--path-length" as any]: 180 }} width="2" height="180" viewBox="0 0 2 180">
//     <line x1="1" y1="0" x2="1" y2="180" className="animated-draw" />
//   </svg>

//   {/* === Top Left === */}
//   <div className="absolute top-[34%] left-[2%] md:left-[-5%]">
//     <div className="absolute -top-[52px] left-1/2 -translate-x-1/2 w-[48px] h-[48px] rounded-xl bg-neutral-950 flex items-center justify-center shadow-md">
//       <FiUsers className="text-yellow-500 text-2xl" />
//     </div>
//     <div className="w-[220px] bg-white border-2 border-black rounded-2xl p-3 shadow-md text-center card-hover">
//       <h3 className="text-base font-bold">Enterprise APIs</h3>
//       <p className="text-xs text-gray-600">Integrate and scale across locations and departments.</p>
//     </div>
//   </div>

//   <svg className="absolute md:left-[180px] left-[200px] top-[400px]" style={{ ["--path-length" as any]: 220 }} width="160" height="40" viewBox="0 0 160 40">
//     <path d="M159.5 40L159.5 24.5C159.5 19.5 155.5 15.5 150.5 15.5L10 15.5C4.7 15.5 0.5 11.3 0.5 6L0.5 0" className="animated-draw" />
//   </svg>

//   {/* === Top Right === */}
//   <div className="absolute top-[34%] right-[2%] md:right-[-5%]">
//     <div className="absolute -top-[52px] left-1/2 -translate-x-1/2 w-[48px] h-[48px] rounded-xl bg-neutral-950 flex items-center justify-center shadow-md">
//       <FiTrendingUp className="text-yellow-500 text-2xl" />
//     </div>
//     <div className="w-[220px] bg-white border-2 border-black rounded-2xl p-3 shadow-md text-center card-hover">
//       <h3 className="text-base font-bold">Digital Badging & Certificates</h3>
//       <p className="text-xs text-gray-600">Tamper-proof and shareable proof of competence.</p>
//     </div>
//   </div>

//   <svg className="absolute md:right-[180px] right-[200px] top-[400px] scale-x-[-1]" style={{ ["--path-length" as any]: 220 }} width="160" height="40" viewBox="0 0 160 40">
//     <path d="M159.5 40L159.5 24.5C159.5 19.5 155.5 15.5 150.5 15.5L10 15.5C4.7 15.5 0.5 11.3 0.5 6L0.5 0" className="animated-draw" />
//   </svg>

//   {/* === Bottom Left === */}
//   <div className="absolute bottom-[18%] left-[2%] md:left-[-5%]">
//     <div className="absolute -top-[52px] left-1/2 -translate-x-1/2 w-[48px] h-[48px] rounded-xl bg-neutral-950 flex items-center justify-center shadow-md">
//       <FiShield className="text-yellow-500 text-2xl" />
//     </div>
//     <div className="w-[220px] bg-white border-2 border-black rounded-2xl p-3 shadow-md text-center card-hover">
//       <h3 className="text-base font-bold">Competency Mapping</h3>
//       <p className="text-xs text-gray-600">Align internal frameworks with industry standards.</p>
//     </div>
//   </div>

//   <svg className="absolute md:left-[180px] left-[200px] bottom-[295px]" style={{ ["--path-length" as any]: 260 }} width="160" height="45" viewBox="0 0 160 45">
//     <path d="M159.5 0L159.5 6C159.5 11 155.5 15 150.5 15L10 15C4.7 15 0.5 19.2 0.5 24.5L0.5 44.5" className="animated-draw" />
//   </svg>

//   {/* === Bottom Right === */}
//   <div className="absolute bottom-[18%] right-[2%] md:right-[-5%]">
//     <div className="absolute -top-[52px] left-1/2 -translate-x-1/2 w-[48px] h-[48px] rounded-xl bg-neutral-950 flex items-center justify-center shadow-md">
//       <FiGitBranch className="text-yellow-500 text-2xl" />
//     </div>
//     <div className="w-[220px] bg-white border-2 border-black rounded-2xl p-3 shadow-md text-center card-hover">
//       <h3 className="text-base font-bold">Analytics Dashboard</h3>
//       <p className="text-xs text-gray-600">Visualize training ROI and identify skill gaps.</p>
//     </div>
//   </div>

//   <svg className="absolute md:right-[200px] right-[200px] bottom-[295px] scale-x-[-1]" style={{ ["--path-length" as any]: 230 }} width="160" height="45" viewBox="0 0 160 45">
//     <path d="M159.5 0L159.5 6C159.5 11 155.5 15 150.5 15L10 15C4.7 15 0.5 19.2 0.5 24.5L0.5 44.5" className="animated-draw" />
//   </svg>
// </div>

//       {/* Mobile Version */}
//       <div className="mobile-cards mb-7">
//         <div className="flex flex-col items-center justify-center space-y-12 px-6">
//           {[
//             {
//               icon: <FiCheckCircle className="text-yellow-500 text-2xl" />,
//               title: "Skill Validation Engine",
//               desc: "Authenticates skills via structured assessment data.",
//             },
//             {
//               icon: <FiUsers className="text-yellow-500 text-2xl" />,
//               title: "Enterprise APIs",
//               desc: "Integrate and scale across locations and departments.",
//             },
//             {
//               icon: <FiTrendingUp className="text-yellow-500 text-2xl" />,
//               title: "Digital Badging & Certificates",
//               desc: "Tamper-proof and shareable proof of competence.",
//             },
//             {
//               icon: <FiShield className="text-yellow-500 text-2xl" />,
//               title: "Competency Mapping",
//               desc: "Align internal frameworks with industry standards.",
//             },
//             {
//               icon: <FiGitBranch className="text-yellow-500 text-2xl" />,
//               title: "Analytics Dashboard",
//               desc: "Visualize training ROI and identify skill gaps.",
//             },
//           ].map((item, i) => (
//             <div key={i} className="relative flex flex-col items-center">
//               <div className="absolute -top-[37px] w-[60px] h-[60px] rounded-xl bg-neutral-950 flex items-center justify-center shadow-md">
//                 {item.icon}
//               </div>
//               <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center mt-[36px] card-hover">
//                 <h3 className="text-lg font-bold text-black">{item.title}</h3>
//                 <p className="text-sm text-gray-600">{item.desc}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CoreFeatures;