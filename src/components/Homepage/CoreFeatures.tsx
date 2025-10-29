// import { useEffect, useRef } from 'react';
// import gsap from 'gsap';
// import { ScrollTrigger } from 'gsap/ScrollTrigger';

// gsap.registerPlugin(ScrollTrigger);

// const CoreFeatures = () => {
//   const sectionRef = useRef<HTMLDivElement>(null);
//   const cardsContainerRef = useRef<HTMLDivElement>(null);

//   const features = [
//     {
//       title: 'Skill Validation Engine',
//       description: 'Authenticates skills via structured assessment data.',
//       icon: (
//         <svg
//           className="w-8 h-8 text-gray-800"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={1.5}
//             d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//           />
//         </svg>
//       ),
//     },
//     {
//       title: 'Digital Badging & Certificates',
//       description: 'Tamper-proof and shareable proof of competence.',
//       icon: (
//         <svg
//           className="w-8 h-8 text-gray-800"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={1.5}
//             d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
//           />
//         </svg>
//       ),
//     },
//     {
      // title: 'Analytics Dashboard',
      // description: 'Visualize training ROI and identify skill gaps.',
//       icon: (
//         <svg
//           className="w-8 h-8 text-gray-800"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={1.5}
//             d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
//           />
//         </svg>
//       ),
//     },
//     {
      // title: 'Competenc Mapping',
      // description: 'Align internal frameworks with industry standards.',
//       icon: (
//         <svg
//           className="w-8 h-8 text-gray-800"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={1.5}
//             d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
//           />
//         </svg>
//       ),
//     },
//     {
      // title: 'Enterprise APIs',
      // description: 'Integrate and scale across locations and departments.',
//       icon: (
//         <svg
//           className="w-8 h-8 text-gray-800"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={1.5}
//             d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//           />
//         </svg>
//       ),
//     },
//   ];

//   useEffect(() => {
//     const section = sectionRef.current;
//     const cardsContainer = cardsContainerRef.current;

//     if (!section || !cardsContainer) return;

//     // Calculate optimal scroll distance based on viewport
//     const getScrollAmount = () => {
//       const containerWidth = cardsContainer.scrollWidth;
//       const viewportWidth = window.innerWidth;
//       const isMobile = viewportWidth < 640;
//       const padding = isMobile ? 100 : 200;
//       const actualScrollDistance = containerWidth - viewportWidth + padding;
      
//       // Apply a reduction factor to minimize bottom gap
//       // Mobile needs more aggressive reduction
//       const reductionFactor = isMobile ? 0.5 : 0.6;
//       return actualScrollDistance * reductionFactor;
//     };

//     // Create horizontal scroll animation
//     const scrollTween = gsap.to(cardsContainer, {
//       x: () => {
//         const containerWidth = cardsContainer.scrollWidth;
//         const viewportWidth = window.innerWidth;
//         const padding = viewportWidth < 640 ? 100 : 200;
//         return -(containerWidth - viewportWidth + padding);
//       },
//       ease: 'none',
//       scrollTrigger: {
//         trigger: section,
//         start: 'top top',
//         end: () => {
//           const scrollAmount = getScrollAmount();
//           return `+=${scrollAmount}`;
//         },
//         scrub: 1,
//         pin: true,
//         pinSpacing: true,
//         anticipatePin: 1,
//         invalidateOnRefresh: true,
//       },
//     });

//     // Cleanup
//     return () => {
//       ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
//     };
//   }, []);

//   return (
//     <section
//       ref={sectionRef}
//       className="relative bg-gradient-to-b from-white to-gray-50 overflow-hidden py-8 sm:py-12 lg:py-16 z-10"
//     >
//       <div className="flex flex-col">
//         {/* Section Header */}
        // <div className="text-center mb-6 sm:mb-8 px-4">
        //   <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">
        //     Core Features
        //   </h2>
        //   <p className="text-sm sm:text-lg lg:text-xl text-gray-600">
        //     Comprehensive skill management ecosystem
        //   </p>
        // </div>

//         {/* Horizontal Scroll Container */}
//         <div className="relative">
//           <div
//             ref={cardsContainerRef}
//             className="flex gap-4 sm:gap-6 lg:gap-8"
//             style={{ 
//               paddingLeft: 'calc(50vw - 140px)', // Center first card for mobile (280px/2 = 140px)
//             }}
//           >
//           {features.map((feature, index) => (
//             <div
//               key={index}
//               className="feature-card flex-shrink-0 bg-white rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl p-5 sm:p-6 lg:p-8 border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:border-blue-200 group"
//               style={{ width: '280px', maxWidth: '90vw' }}
//             >
//               {/* Icon */}
//               <div className="mb-4 sm:mb-6 flex items-center justify-start">
//                 <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center border border-gray-200 group-hover:border-blue-300 group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
//                   <div className="scale-75 sm:scale-90 lg:scale-100">
//                     {feature.icon}
//                   </div>
//                 </div>
//               </div>

//               {/* Title */}
//               <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
//                 {feature.title}
//               </h3>

//               {/* Description */}
//               <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
//                 {feature.description}
//               </p>
//             </div>
//           ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default CoreFeatures;







// import React, { useEffect, useRef, useState } from "react";
// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { FaCertificate, FaChartLine, FaCogs, FaNetworkWired, FaShieldAlt } from "react-icons/fa";

// gsap.registerPlugin(ScrollTrigger);

// const data = [
//   { title: "Skill Validation Engine", desc: "Authenticates skills via structured assessment data.", icon: FaShieldAlt, border: false },
//   { title: 'Digital Badging & Certificates', desc: 'Tamper-proof and shareable proof of competence.', icon: FaCertificate, border: true },
//   { title: 'Analytics Dashboard', desc: 'Visualize training ROI and identify skill gaps.', icon: FaChartLine, border: false },
//   { title: 'Competency Mapping', desc: 'Align internal frameworks with industry standards.', icon: FaCogs, border: true },
//   { title: 'Enterprise APIs', desc: 'Integrate and scale across locations and departments.', icon: FaNetworkWired, border: false },
// ];

// const red = "#D80016";
// const grayText = "#374151";
// const cardShadow = "0 12px 28px rgba(0,0,0,0.08)";

// export default function CoreValuesDesktop() {
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const svgRef = useRef<SVGSVGElement | null>(null);
//   const centerRef = useRef<HTMLDivElement | null>(null);
//   const cardRefs = useRef<HTMLDivElement[]>([]);
//   const [paths, setPaths] = useState<string[]>([]);

//   const setCardRef = (el: HTMLDivElement | null, i: number) => {
//     if (el) cardRefs.current[i] = el;
//   };

//   function buildOrthogonalPath(from: { x: number; y: number }, to: { x: number; y: number }) {
//     // make lines longer for elegance
//     const midX = from.x + (to.x - from.x) * 0.4; 
//     return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
//   }

//   useEffect(() => {
//     const compute = () => {
//       const centerRect = centerRef.current?.getBoundingClientRect();
//       const svgRect = svgRef.current?.getBoundingClientRect();
//       if (!centerRect || !svgRect) return;

//       const from = {
//         x: centerRect.left + centerRect.width / 2 - svgRect.left,
//         y: centerRect.top + centerRect.height / 2 - svgRect.top,
//       };

//       const newPaths: string[] = [];

//       for (let i = 0; i < cardRefs.current.length; i++) {
//         const card = cardRefs.current[i];
//         const iconBox = card?.querySelector(".cv-icon-box") as HTMLDivElement | null;
//         if (!card || !iconBox) continue;
//         const iconRect = iconBox.getBoundingClientRect();

//         const to = {
//           x: iconRect.left + iconRect.width / 2 - svgRect.left,
//           y: iconRect.top + iconRect.height / 2 - svgRect.top,
//         };

//         newPaths.push(buildOrthogonalPath(from, to));
//       }

//       setPaths(newPaths);
//     };

//     compute();
//     const ro = new ResizeObserver(compute);
//     ro.observe(document.documentElement);
//     window.addEventListener("resize", compute);
//     return () => {
//       ro.disconnect();
//       window.removeEventListener("resize", compute);
//     };
//   }, []);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     gsap.fromTo(
//       containerRef.current.querySelectorAll(".cv-card"),
//       { autoAlpha: 0, y: 24 },
//       {
//         autoAlpha: 1,
//         y: 0,
//         duration: 0.8,
//         stagger: 0.15,
//         ease: "power3.out",
//         scrollTrigger: { trigger: containerRef.current, start: "top 85%" },
//       }
//     );

//     const svg = svgRef.current;
//     if (!svg) return;
//     const pathEls = Array.from(svg.querySelectorAll("path.connector")) as SVGPathElement[];
//     if (!pathEls.length) return;

//     pathEls.forEach((p) => {
//       const len = p.getTotalLength();
//       p.style.strokeDasharray = `${len}`;
//       p.style.strokeDashoffset = `${len}`;
//       p.style.visibility = "visible";
//     });

//     gsap.to(pathEls, {
//       strokeDashoffset: 0,
//       duration: 1.5,
//       stagger: 0.2,
//       ease: "power2.out",
//       scrollTrigger: { trigger: containerRef.current, start: "top 85%" },
//     });

//     gsap.to(centerRef.current, {
//       scale: 1.03,
//       repeat: -1,
//       yoyo: true,
//       duration: 2,
//       ease: "power1.inOut",
//     });

//     return () => ScrollTrigger.getAll().forEach((t) => t.kill());
//   }, [paths]);

//   const cardPositions = [
//     { left: 600, top: 40 },
//     { left: 780, top: 130 },
//     { left: 780, top: 230 },
//     { left: 780, top: 330 },
//     { left: 600, top: 420 },
//   ];

//   return (
//     <section
//       ref={containerRef}
//       className="relative flex justify-center items-center py-28 bg-white"
//       style={{ minHeight: 650 }}
//     >
//       <h2
//         style={{
//           position: "absolute",
//           top: 10,
//           color: "black",
//           fontSize: 44,
//           fontWeight: 900,
//           letterSpacing: "0.5px",
//         }}
//       >
//        Core Features
//       </h2><br></br>
//       <p
//         style={{
//           position: "absolute",
//           top: 90,
//           color: "black",
//           fontSize: 20,
//           fontWeight: 300,
//           letterSpacing: "0.5px",
//         }}
//       >
//       Comprehensive skill management ecosystem
//       </p>


//       <div style={{ width: 980, height: 520, position: "relative" }}>
//         <div
//           ref={centerRef}
//           style={{
//             position: "absolute",
//             left: 120,
//             top: 175,
//             width: 180,
//             height: 180,
//             background: "#f9fafb",
//             borderRadius: 20,
//             boxShadow: cardShadow,
//             border: "1px solid #e5e7eb",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             fontWeight: 800,
//             color: "#111827",
//             zIndex: 30,
//             fontSize: 20,
//           }}
//         >
//           <div style={{ textAlign: "center", lineHeight: 1.05 }}>
//             <div>OUR</div>
//             <div>FEATURES</div>
//           </div>
//         </div>

//         <svg
//           ref={svgRef}
//           viewBox={`0 0 980 520`}
//           style={{
//             position: "absolute",
//             left: 0,
//             top: 0,
//             width: "100%",
//             height: "100%",
//             pointerEvents: "none",
//             zIndex: 20,
//           }}
//         >
//           {paths.map((d, i) => (
//             <path
//               key={i}
//               className="connector"
//               d={d}
//               stroke={data[i].border ? red : "#111827"}
//               strokeWidth={data[i].border ? 2.5 : 1.5}
//               fill="none"
//               strokeLinecap="round"
//               style={{ visibility: paths.length ? "visible" : "hidden", opacity: 0.6 }}
//             />
//           ))}
//         </svg>

//         {data.map((item, i) => {
//           const pos = cardPositions[i];
//           const Icon = item.icon;
//           return (
//             <div
//               key={i}
//               ref={(el) => setCardRef(el, i)}
//               className="cv-card"
//               style={{
//                 position: "absolute",
//                 left: pos.left,
//                 top: pos.top,
//                 width: 260,
//                 height: 100,
//                 display: "flex",
//                 gap: 16,
//                 alignItems: "center",
//                 zIndex: 40,
//               }}
//             >
//               <div
//                 className="cv-icon-box"
//                 style={{
//                   width: 72,
//                   height: 72,
//                   borderRadius: 16,
//                   background: "#fff",
//                   boxShadow: cardShadow,
//                   border: item.border ? `2px solid ${red}` : "1px solid #e6e6e6",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontSize: 28,
//                   color: item.border ? red : "#111827",
//                 }}
//               >
//                 <Icon />
//               </div>

//               <div style={{ display: "flex", flexDirection: "column" }}>
//                 <div style={{ color: red, fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
//                   {item.title}
//                 </div>
//                 <div style={{ color: grayText, fontSize: 14, lineHeight: 1.4 }}>
//                   {item.desc}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </section>
//   );
// }


// import React, { useEffect, useRef, useState } from "react";
// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { FaCertificate, FaChartLine, FaCogs, FaNetworkWired, FaShieldAlt } from "react-icons/fa";

// gsap.registerPlugin(ScrollTrigger);

// const data = [
//   { title: "Skill Validation Engine", desc: "Authenticates skills via structured assessment data.", icon: FaShieldAlt, border: false },
//   { title: 'Digital Badging & Certificates', desc: 'Tamper-proof and shareable proof of competence.', icon: FaCertificate, border: true },
//   { title: 'Analytics Dashboard', desc: 'Visualize training ROI and identify skill gaps.', icon: FaChartLine, border: false },
//   { title: 'Competency Mapping', desc: 'Align internal frameworks with industry standards.', icon: FaCogs, border: true },
//   { title: 'Enterprise APIs', desc: 'Integrate and scale across locations and departments.', icon: FaNetworkWired, border: false },
// ];

// const red = "#D80016";
// const grayText = "#374151";
// const cardShadow = "0 12px 28px rgba(0,0,0,0.08)";

// export default function CoreValuesDesktop() {
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const svgRef = useRef<SVGSVGElement | null>(null);
//   const centerRef = useRef<HTMLDivElement | null>(null);
//   const cardRefs = useRef<HTMLDivElement[]>([]);
//   const [paths, setPaths] = useState<string[]>([]);
//   const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

//   const setCardRef = (el: HTMLDivElement | null, i: number) => {
//     if (el) cardRefs.current[i] = el;
//   };

//   function buildOrthogonalPath(from: { x: number; y: number }, to: { x: number; y: number }) {
//     const midX = from.x + (to.x - from.x) * 0.4;
//     return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
//   }

//   useEffect(() => {
//     const compute = () => {
//       const centerRect = centerRef.current?.getBoundingClientRect();
//       const svgRect = svgRef.current?.getBoundingClientRect();
//       if (!centerRect || !svgRect) return;

//       const from = {
//         x: centerRect.left + centerRect.width / 2 - svgRect.left,
//         y: centerRect.top + centerRect.height / 2 - svgRect.top,
//       };

//       const newPaths: string[] = [];

//       for (let i = 0; i < cardRefs.current.length; i++) {
//         const card = cardRefs.current[i];
//         const iconBox = card?.querySelector(".cv-icon-box") as HTMLDivElement | null;
//         if (!card || !iconBox) continue;
//         const iconRect = iconBox.getBoundingClientRect();

//         const to = {
//           x: iconRect.left + iconRect.width / 2 - svgRect.left,
//           y: iconRect.top + iconRect.height / 2 - svgRect.top,
//         };

//         newPaths.push(buildOrthogonalPath(from, to));
//       }

//       setPaths(newPaths);
//     };

//     compute();
//     const ro = new ResizeObserver(compute);
//     ro.observe(document.documentElement);
//     window.addEventListener("resize", () => {
//       setWindowWidth(window.innerWidth);
//       compute();
//     });
//     return () => {
//       ro.disconnect();
//       window.removeEventListener("resize", compute);
//     };
//   }, []);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     gsap.fromTo(
//       containerRef.current.querySelectorAll(".cv-card"),
//       { autoAlpha: 0, y: 24 },
//       {
//         autoAlpha: 1,
//         y: 0,
//         duration: 0.8,
//         stagger: 0.15,
//         ease: "power3.out",
//         scrollTrigger: { trigger: containerRef.current, start: "top 85%" },
//       }
//     );

//     const svg = svgRef.current;
//     if (!svg) return;
//     const pathEls = Array.from(svg.querySelectorAll("path.connector")) as SVGPathElement[];
//     if (!pathEls.length) return;

//     pathEls.forEach((p) => {
//       const len = p.getTotalLength();
//       p.style.strokeDasharray = `${len}`;
//       p.style.strokeDashoffset = `${len}`;
//       p.style.visibility = "visible";
//     });

//     gsap.to(pathEls, {
//       strokeDashoffset: 0,
//       duration: 1.5,
//       stagger: 0.2,
//       ease: "power2.out",
//       scrollTrigger: { trigger: containerRef.current, start: "top 85%" },
//     });

//     gsap.to(centerRef.current, {
//       scale: 1.03,
//       repeat: -1,
//       yoyo: true,
//       duration: 2,
//       ease: "power1.inOut",
//     });

//     return () => ScrollTrigger.getAll().forEach((t) => t.kill());
//   }, [paths]);

//   const cardPositions = windowWidth > 768
//     ? [
//         { left: 600, top: 40 },
//         { left: 780, top: 130 },
//         { left: 780, top: 230 },
//         { left: 780, top: 330 },
//         { left: 600, top: 420 },
//       ]
//     : [ // mobile: stack cards vertically
//         { left: 40, top: 380 },
//         { left: 40, top: 500 },
//         { left: 40, top: 620 },
//         { left: 40, top: 740 },
//         { left: 40, top: 860 },
//       ];

//   return (
//     <section
//       ref={containerRef}
//       className="relative flex justify-center items-center py-28 bg-white"
//       style={{ minHeight: 900 }}
//     >
//       <h2
//         style={{
//           position: "absolute",
//           top: 10,
//           color: "black",
//           fontSize: 44,
//           fontWeight: 900,
//           letterSpacing: "0.5px",
//         }}
//       >
//         Core Features
//       </h2>
//       <p
//         style={{
//           position: "absolute",
//           top: 90,
//           color: "black",
//           fontSize: 20,
//           fontWeight: 430,
//           letterSpacing: "0.5px",
//         }}
//       >
//         Comprehensive skill management ecosystem
//       </p>

//       <div style={{ width: "100%", maxWidth: 980, height: 1200, position: "relative" }}>
//         <div
//           ref={centerRef}
//           style={{
//             position: "absolute",
//             left: windowWidth > 768 ? 120 : "50%",
//             transform: windowWidth <= 768 ? "translateX(-50%)" : undefined,
//             top: 175,
//             width: 180,
//             height: 180,
//             background: "#f9fafb",
//             borderRadius: 20,
//             boxShadow: cardShadow,
//             border: "1px solid #e5e7eb",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             fontWeight: 800,
//             color: "#111827",
//             zIndex: 30,
//             fontSize: 20,
//           }}
//         >
//           <div style={{ textAlign: "center", lineHeight: 1.05 }}>
//             <div>OUR</div>
//             <div>FEATURES</div>
//           </div>
//         </div>

//         <svg
//           ref={svgRef}
//           viewBox={`0 0 980 1200`}
//           style={{
//             position: "absolute",
//             left: 0,
//             top: 0,
//             width: "100%",
//             height: "100%",
//             pointerEvents: "none",
//             zIndex: 20,
//           }}
//         >
//           {paths.map((d, i) => (
//             <path
//               key={i}
//               className="connector"
//               d={d}
//               stroke={data[i].border ? red : "black"}
//               strokeWidth={data[i].border ? 2.5 : 1.5}
//               fill="none"
//               strokeLinecap="round"
//               style={{ visibility: paths.length ? "visible" : "hidden", opacity: 0.6 }}
//             />
//           ))}
//         </svg>

//         {data.map((item, i) => {
//           const pos = cardPositions[i];
//           const Icon = item.icon;
//           return (
//             <div
//               key={i}
//               ref={(el) => setCardRef(el, i)}
//               className="cv-card"
//               style={{
//                 position: "absolute",
//                 left: pos.left,
//                 top: pos.top,
//                 width: 260,
//                 height: 100,
//                 display: "flex",
//                 gap: 16,
//                 alignItems: "center",
//                 zIndex: 40,
//               }}
//             >
//               <div
//                 className="cv-icon-box"
//                 style={{
//                   width: 72,
//                   height: 72,
//                   borderRadius: 16,
//                   background: "#fff",
//                   boxShadow: cardShadow,
//                   border: item.border ? `2px solid ${red}` : "2px solid black",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontSize: 28,
//                   color: item.border ? red : "#111827",
//                 }}
//               >
//                 <Icon />
//               </div>

//               <div style={{ display: "flex", flexDirection: "column" }}>
//                 <div style={{ color: red, fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
//                   {item.title}
//                 </div>
//                 <div style={{ color: grayText, fontWeight: 480, fontSize: 14, lineHeight: 1.4 }}>
//                   {item.desc}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </section>
//   );
// }

// import React, { useEffect, useRef, useState } from "react";
// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { FaCertificate, FaChartLine, FaCogs, FaNetworkWired, FaShieldAlt } from "react-icons/fa";

// gsap.registerPlugin(ScrollTrigger);

// const data = [
//   { title: "Skill Validation Engine", desc: "Authenticates skills via structured assessment data.", icon: FaShieldAlt, border: false },
//   { title: 'Digital Badging & Certificates', desc: 'Tamper-proof and shareable proof of competence.', icon: FaCertificate, border: true },
//   { title: 'Analytics Dashboard', desc: 'Visualize training ROI and identify skill gaps.', icon: FaChartLine, border: false },
//   { title: 'Competency Mapping', desc: 'Align internal frameworks with industry standards.', icon: FaCogs, border: true },
//   { title: 'Enterprise APIs', desc: 'Integrate and scale across locations and departments.', icon: FaNetworkWired, border: false },
// ];

// const red = "#D80016";
// const grayText = "#374151";
// const cardShadow = "0 12px 28px rgba(0,0,0,0.08)";

// export default function CoreValuesDesktop() {
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const svgRef = useRef<SVGSVGElement | null>(null);
//   const centerRef = useRef<HTMLDivElement | null>(null);
//   const cardRefs = useRef<HTMLDivElement[]>([]);
//   const [paths, setPaths] = useState<string[]>([]);
//   const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

//   const setCardRef = (el: HTMLDivElement | null, i: number) => {
//     if (el) cardRefs.current[i] = el;
//   };

//   function buildOrthogonalPath(from: { x: number; y: number }, to: { x: number; y: number }) {
//     const midX = from.x + (to.x - from.x) * 0.4;
//     return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
//   }

//   // Compute paths
//   useEffect(() => {
//     const compute = () => {
//       const centerRect = centerRef.current?.getBoundingClientRect();
//       const svgRect = svgRef.current?.getBoundingClientRect();
//       if (!centerRect || !svgRect) return;

//       const from = {
//         x: centerRect.left + centerRect.width / 2 - svgRect.left,
//         y: centerRect.top + centerRect.height / 2 - svgRect.top,
//       };

//       const newPaths: string[] = [];
//       for (let i = 0; i < cardRefs.current.length; i++) {
//         const card = cardRefs.current[i];
//         const iconBox = card?.querySelector(".cv-icon-box") as HTMLDivElement | null;
//         if (!card || !iconBox) continue;
//         const iconRect = iconBox.getBoundingClientRect();
//         const to = {
//           x: iconRect.left + iconRect.width / 2 - svgRect.left,
//           y: iconRect.top + iconRect.height / 2 - svgRect.top,
//         };
//         newPaths.push(buildOrthogonalPath(from, to));
//       }
//       setPaths(newPaths);
//     };

//     compute();
//     const ro = new ResizeObserver(compute);
//     ro.observe(document.documentElement);
//     window.addEventListener("resize", () => {
//       setWindowWidth(window.innerWidth);
//       compute();
//     });
//     return () => {
//       ro.disconnect();
//       window.removeEventListener("resize", compute);
//     };
//   }, []);

//   // Animate cards + strokes
//   useEffect(() => {
//     if (!containerRef.current) return;

//     const svg = svgRef.current;
//     const pathEls = svg ? Array.from(svg.querySelectorAll("path.connector")) as SVGPathElement[] : [];

//     if (windowWidth > 768 && pathEls.length) {
//       // Set stroke initial state
//       pathEls.forEach((p) => {
//         const len = p.getTotalLength();
//         p.style.strokeDasharray = `${len}`;
//         p.style.strokeDashoffset = `${len}`;
//         p.style.visibility = "visible";
//       });

//       // Timeline for sequential stroke & card animation
//       const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

//       pathEls.forEach((p, i) => {
//         const card = cardRefs.current[i];

//         tl.to(p, { strokeDashoffset: 0, duration: 0.8 });
//         tl.fromTo(
//           card,
//           { autoAlpha: 0, y: 24 },
//           { autoAlpha: 1, y: 0, duration: 0.6 },
//           "-=0.4" // Slight overlap for smooth effect
//         );
//       });

//       // Center pulse
//       tl.to(centerRef.current, {
//         scale: 1.03,
//         repeat: -1,
//         yoyo: true,
//         duration: 2,
//       }, 0);

//       // Scroll trigger for secondary appearance if user scrolls
//       pathEls.forEach((p) => {
//         gsap.fromTo(
//           p,
//           { strokeDashoffset: p.getTotalLength() },
//           {
//             strokeDashoffset: 0,
//             duration: 1,
//             ease: "power2.out",
//             scrollTrigger: { trigger: containerRef.current, start: "top 85%" },
//           }
//         );
//       });

//     } else {
//       // Mobile: only fade-in cards
//       gsap.fromTo(
//         containerRef.current.querySelectorAll(".cv-card"),
//         { autoAlpha: 0, y: 24 },
//         { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.2, ease: "power3.out", scrollTrigger: { trigger: containerRef.current, start: "top 85%" } }
//       );
//     }

//     return () => ScrollTrigger.getAll().forEach(t => t.kill());
//   }, [paths, windowWidth]);

//   // Card positions (spaced more for clean layout)
//   const cardPositions = windowWidth > 768
//     ? [
//         { left: 600, top: 20 },
//         { left: 780, top: 120 },
//         { left: 780, top: 240 },
//         { left: 780, top: 360 },
//         { left: 600, top: 480 },
//       ]
//     : [ // mobile: stack cards with more spacing
//         { left: 40, top: 380 },
//         { left: 40, top: 520 },
//         { left: 40, top: 660 },
//         { left: 40, top: 800 },
//         { left: 40, top: 940 },
//       ];

//   return (
//     <section ref={containerRef} className="relative flex justify-center items-center py-28 bg-white" style={{ minHeight: 900 }}>
//       <h2 style={{ position: "absolute", top: 10, color: "black", fontSize: 44, fontWeight: 900, letterSpacing: "0.5px" }}>
//         Core Features
//       </h2>
//       <p style={{ position: "absolute", top: 90, color: "black", fontSize: 20, fontWeight: 430, letterSpacing: "0.5px" }}>
//         Comprehensive skill management ecosystem
//       </p>

//       <div style={{ width: "100%", maxWidth: 980, height: 1200, position: "relative" }}>
//         <div ref={centerRef} style={{
//           position: "absolute",
//           left: windowWidth > 768 ? 120 : "50%",
//           transform: windowWidth <= 768 ? "translateX(-50%)" : undefined,
//           top: 175,
//           width: 180,
//           height: 180,
//           background: "#f9fafb",
//           borderRadius: 20,
//           boxShadow: cardShadow,
//           border: "1px solid #e5e7eb",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           fontWeight: 800,
//           color: "#111827",
//           zIndex: 30,
//           fontSize: 20,
//         }}>
//           <div style={{ textAlign: "center", lineHeight: 1.05 }}>
//             <div>OUR</div>
//             <div>FEATURES</div>
//           </div>
//         </div>

//         <svg ref={svgRef} viewBox={`0 0 980 1200`} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 20 }}>
//           {paths.map((d, i) => (
//             <path key={i} className="connector" d={d} stroke={data[i].border ? red : "black"} strokeWidth={data[i].border ? 2.5 : 1.5} fill="none" strokeLinecap="round" style={{ visibility: paths.length ? "visible" : "hidden", opacity: 0.6 }} />
//           ))}
//         </svg>

//         {data.map((item, i) => {
//           const pos = cardPositions[i];
//           const Icon = item.icon;
//           return (
//             <div key={i} ref={(el) => setCardRef(el, i)} className="cv-card" style={{
//               position: "absolute",
//               left: pos.left,
//               top: pos.top,
//               width: 260,
//               height: 100,
//               display: "flex",
//               gap: 16,
//               alignItems: "center",
//               zIndex: 40,
//             }}>
//               <div className="cv-icon-box" style={{
//                 width: 72,
//                 height: 72,
//                 borderRadius: 16,
//                 background: "#fff",
//                 boxShadow: cardShadow,
//                 border: item.border ? `2px solid ${red}` : "2px solid black",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: 28,
//                 color: item.border ? red : "#111827",
//               }}>
//                 <Icon />
//               </div>

//               <div style={{ display: "flex", flexDirection: "column" }}>
//                 <div style={{ color: red, fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{item.title}</div>
//                 <div style={{ color: grayText, fontWeight: 480, fontSize: 14, lineHeight: 1.4 }}>{item.desc}</div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </section>
//   );
// }



// import React, { useEffect, useRef, useState } from "react";
// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { FaCertificate, FaChartLine, FaCogs, FaNetworkWired, FaShieldAlt } from "react-icons/fa";

// gsap.registerPlugin(ScrollTrigger);

// const data = [
//   { title: "Skill Validation Engine", desc: "Authenticates skills via structured assessment data.", icon: FaShieldAlt, border: false },
//   { title: 'Digital Badging & Certificates', desc: 'Tamper-proof and shareable proof of competence.', icon: FaCertificate, border: true },
//   { title: 'Analytics Dashboard', desc: 'Visualize training ROI and identify skill gaps.', icon: FaChartLine, border: false },
//   { title: 'Competency Mapping', desc: 'Align internal frameworks with industry standards.', icon: FaCogs, border: true },
//   { title: 'Enterprise APIs', desc: 'Integrate and scale across locations and departments.', icon: FaNetworkWired, border: false },
// ];

// const red = "#D80016";
// const grayText = "#374151";
// const cardShadow = "0 12px 28px rgba(0,0,0,0.08)";

// export default function CoreValuesDesktop() {
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const svgRef = useRef<SVGSVGElement | null>(null);
//   const centerRef = useRef<HTMLDivElement | null>(null);
//   const cardRefs = useRef<HTMLDivElement[]>([]);
//   const [paths, setPaths] = useState<string[]>([]);
//   const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

//   const setCardRef = (el: HTMLDivElement | null, i: number) => {
//     if (el) cardRefs.current[i] = el;
//   };

//   function buildOrthogonalPath(from: { x: number; y: number }, to: { x: number; y: number }) {
//     const midX = from.x + (to.x - from.x) * 0.5; // center the stroke nicely
//     return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
//   }

//   // Compute paths
//   useEffect(() => {
//     const compute = () => {
//       const centerRect = centerRef.current?.getBoundingClientRect();
//       const svgRect = svgRef.current?.getBoundingClientRect();
//       if (!centerRect || !svgRect) return;

//       const from = {
//         x: centerRect.left + centerRect.width / 2 - svgRect.left,
//         y: centerRect.top + centerRect.height / 2 - svgRect.top,
//       };

//       const newPaths: string[] = [];
//       for (let i = 0; i < cardRefs.current.length; i++) {
//         const card = cardRefs.current[i];
//         const iconBox = card?.querySelector(".cv-icon-box") as HTMLDivElement | null;
//         if (!card || !iconBox) continue;
//         const iconRect = iconBox.getBoundingClientRect();
//         const to = {
//           x: iconRect.left + iconRect.width / 2 - svgRect.left,
//           y: iconRect.top + iconRect.height / 2 - svgRect.top,
//         };
//         newPaths.push(buildOrthogonalPath(from, to));
//       }
//       setPaths(newPaths);
//     };

//     compute();
//     const ro = new ResizeObserver(compute);
//     ro.observe(document.documentElement);
//     window.addEventListener("resize", () => {
//       setWindowWidth(window.innerWidth);
//       compute();
//     });
//     return () => {
//       ro.disconnect();
//       window.removeEventListener("resize", compute);
//     };
//   }, []);

//   // Animate cards + strokes
//   useEffect(() => {
//     if (!containerRef.current) return;

//     const svg = svgRef.current;
//     const pathEls = svg ? Array.from(svg.querySelectorAll("path.connector")) as SVGPathElement[] : [];

//     if (windowWidth > 768 && pathEls.length) {
//       // Set stroke initial state
//       pathEls.forEach((p) => {
//         const len = p.getTotalLength();
//         p.style.strokeDasharray = `${len}`;
//         p.style.strokeDashoffset = `${len}`;
//         p.style.visibility = "visible";
//       });

//       // Timeline for sequential stroke & card animation
//       const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

//       pathEls.forEach((p, i) => {
//         const card = cardRefs.current[i];
//         tl.to(p, { strokeDashoffset: 0, duration: 0.8 });
//         tl.fromTo(
//           card,
//           { autoAlpha: 0, y: 24 },
//           { autoAlpha: 1, y: 0, duration: 0.6 },
//           "-=0.4"
//         );
//       });

//       // Center pulse
//       tl.to(centerRef.current, {
//         scale: 1.03,
//         repeat: -1,
//         yoyo: true,
//         duration: 2,
//       }, 0);

//       // Continuous stroke movement every 4s
//       pathEls.forEach((p) => {
//         gsap.to(p, {
//           strokeDashoffset: 0,
//           duration: 1.2,
//           repeat: -1,
//           yoyo: true,
//           ease: "power1.inOut",
//           delay: 2, // start after 2s
//         });
//       });

//     } else {
//       // Mobile: only fade-in cards
//       gsap.fromTo(
//         containerRef.current.querySelectorAll(".cv-card"),
//         { autoAlpha: 0, y: 24 },
//         { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.2, ease: "power3.out", scrollTrigger: { trigger: containerRef.current, start: "top 85%" } }
//       );
//     }

//     return () => ScrollTrigger.getAll().forEach(t => t.kill());
//   }, [paths, windowWidth]);

//   // Card positions (spaced more for clean layout)
//   const cardPositions = windowWidth > 768
//     ? [
//         { left: 600, top: 120 },
//         { left: 780, top: 260 },
//         { left: 780, top: 400 },
//         { left: 780, top: 540 },
//         { left: 600, top: 680 },
//       ]
//     : [ 
//         { left: 40, top: 400 },
//         { left: 40, top: 540 },
//         { left: 40, top: 680 },
//         { left: 40, top: 820 },
//         { left: 40, top: 960 },
//       ];

//   return (
//     <section ref={containerRef} className="relative flex justify-center items-center py-24 bg-white" style={{ minHeight: 900 }}>
//       {/* Heading */}
//       <h2 style={{ position: "absolute", top: 10, color: "black", fontSize: 44, fontWeight: 900, letterSpacing: "0.5px" }}>
//         Core Features
//       </h2>
//       <p style={{ position: "absolute", top: 80, color: "black", fontSize: 20, fontWeight: 430, letterSpacing: "0.5px" }}>
//         Comprehensive skill management ecosystem
//       </p>

//       <div style={{ width: "100%", maxWidth: 980, height: 1200, position: "relative" }}>
//         {/* Center OUR FEATURES card */}
//         <div ref={centerRef} style={{
//           position: "absolute",
//           left: windowWidth > 768 ? 120 : "50%",
//           transform: windowWidth <= 768 ? "translateX(-50%)" : undefined,
//           top: 180,
//           width: 180,
//           height: 180,
//           background: "#f9fafb",
//           borderRadius: 20,
//           boxShadow: cardShadow,
//           border: "1px solid #e5e7eb",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           fontWeight: 800,
//           color: "#111827",
//           zIndex: 30,
//           fontSize: 20,
//         }}>
//           <div style={{ textAlign: "center", lineHeight: 1.05 }}>
//             <div>OUR</div>
//             <div>FEATURES</div>
//           </div>
//         </div>

//         {/* SVG connectors */}
//         <svg ref={svgRef} viewBox={`0 0 980 1200`} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 20 }}>
//           {paths.map((d, i) => (
//             <path key={i} className="connector" d={d} stroke={data[i].border ? red : "black"} strokeWidth={data[i].border ? 2.5 : 1.5} fill="none" strokeLinecap="round" style={{ visibility: paths.length ? "visible" : "hidden", opacity: 0.6 }} />
//           ))}
//         </svg>

//         {/* Feature cards */}
//         {data.map((item, i) => {
//           const pos = cardPositions[i];
//           const Icon = item.icon;
//           return (
//             <div key={i} ref={(el) => setCardRef(el, i)} className="cv-card" style={{
//               position: "absolute",
//               left: pos.left,
//               top: pos.top,
//               width: 260,
//               height: 100,
//               display: "flex",
//               gap: 16,
//               alignItems: "center",
//               zIndex: 40,
//             }}>
//               <div className="cv-icon-box" style={{
//                 width: 72,
//                 height: 72,
//                 borderRadius: 16,
//                 background: "#fff",
//                 boxShadow: cardShadow,
//                 border: item.border ? `2px solid ${red}` : "2px solid black",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: 28,
//                 color: item.border ? red : "#111827",
//               }}>
//                 <Icon />
//               </div>

//               <div style={{ display: "flex", flexDirection: "column" }}>
//                 <div style={{ color: red, fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{item.title}</div>
//                 <div style={{ color: grayText, fontWeight: 480, fontSize: 14, lineHeight: 1.4 }}>{item.desc}</div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </section>
//   );
// }



// import React, { useEffect, useRef, useState } from "react";
// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { FaCertificate, FaChartLine, FaCogs, FaNetworkWired, FaShieldAlt } from "react-icons/fa";

// gsap.registerPlugin(ScrollTrigger);

// const data = [
//   { title: "Skill Validation Engine", desc: "Authenticates skills via structured assessment data.", icon: FaShieldAlt, border: false },
//   { title: 'Digital Badging & Certificates', desc: 'Tamper-proof and shareable proof of competence.', icon: FaCertificate, border: true },
//   { title: 'Analytics Dashboard', desc: 'Visualize training ROI and identify skill gaps.', icon: FaChartLine, border: false },
//   { title: 'Competency Mapping', desc: 'Align internal frameworks with industry standards.', icon: FaCogs, border: true },
//   { title: 'Enterprise APIs', desc: 'Integrate and scale across locations and departments.', icon: FaNetworkWired, border: false },
// ];

// const red = "#D80016";
// const grayText = "#374151";
// const cardShadow = "0 12px 28px rgba(0,0,0,0.08)";

// export default function CoreValuesDesktop() {
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const svgRef = useRef<SVGSVGElement | null>(null);
//   const centerRef = useRef<HTMLDivElement | null>(null);
//   const cardRefs = useRef<HTMLDivElement[]>([]);
//   const [paths, setPaths] = useState<string[]>([]);
//   const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

//   const setCardRef = (el: HTMLDivElement | null, i: number) => {
//     if (el) cardRefs.current[i] = el;
//   };

//   function buildOrthogonalPath(from: { x: number; y: number }, to: { x: number; y: number }) {
//     const midX = from.x + (to.x - from.x) * 0.4;
//     return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
//   }

//   useEffect(() => {
//     const compute = () => {
//       const centerRect = centerRef.current?.getBoundingClientRect();
//       const svgRect = svgRef.current?.getBoundingClientRect();
//       if (!centerRect || !svgRect) return;

//       const from = {
//         x: centerRect.left + centerRect.width / 2 - svgRect.left,
//         y: centerRect.top + centerRect.height / 2 - svgRect.top,
//       };

//       const newPaths: string[] = [];

//       for (let i = 0; i < cardRefs.current.length; i++) {
//         const card = cardRefs.current[i];
//         const iconBox = card?.querySelector(".cv-icon-box") as HTMLDivElement | null;
//         if (!card || !iconBox) continue;
//         const iconRect = iconBox.getBoundingClientRect();

//         const to = {
//           x: iconRect.left + iconRect.width / 2 - svgRect.left,
//           y: iconRect.top + iconRect.height / 2 - svgRect.top,
//         };

//         newPaths.push(buildOrthogonalPath(from, to));
//       }

//       setPaths(newPaths);
//     };

//     compute();
//     const ro = new ResizeObserver(compute);
//     ro.observe(document.documentElement);
//     window.addEventListener("resize", () => {
//       setWindowWidth(window.innerWidth);
//       compute();
//     });
//     return () => {
//       ro.disconnect();
//       window.removeEventListener("resize", compute);
//     };
//   }, []);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     // Animate cards
//     gsap.fromTo(
//       containerRef.current.querySelectorAll(".cv-card"),
//       { autoAlpha: 0, y: 24 },
//       {
//         autoAlpha: 1,
//         y: 0,
//         duration: 0.8,
//         stagger: 0.15,
//         ease: "power3.out",
//         scrollTrigger: { trigger: containerRef.current, start: "top 85%" },
//       }
//     );

//     // Animate stroke connectors continuously
//     const svg = svgRef.current;
//     if (!svg) return;
//     const pathEls = Array.from(svg.querySelectorAll("path.connector")) as SVGPathElement[];
//     if (!pathEls.length) return;

//     pathEls.forEach((p) => {
//       const len = p.getTotalLength();
//       p.style.strokeDasharray = `${len}`;
//       p.style.strokeDashoffset = `${len}`;
//       p.style.visibility = "visible";

//       gsap.fromTo(
//         p,
//         { strokeDashoffset: len },
//         {
//           strokeDashoffset: 0,
//           duration: 10,
//           repeat: -1,
//           ease: "linear",
//         }
//       );
//     });

//     // Center card pulse
//     gsap.to(centerRef.current, {
//       scale: 1.03,
//       repeat: -1,
//       yoyo: true,
//       duration: 2,
//       ease: "power1.inOut",
//     });

//     return () => ScrollTrigger.getAll().forEach((t) => t.kill());
//   }, [paths]);

//   // --- Spacing offsets ---
//   const headingToCardsOffset = 50; // gap between heading and first card
//   const cardVerticalGap = 20; // gap between cards

//   const cardPositions = windowWidth > 768
//     ? [
//         { left: 600, top: 40 + headingToCardsOffset },
//         { left: 780, top: 130 + headingToCardsOffset + cardVerticalGap },
//         { left: 780, top: 230 + headingToCardsOffset + cardVerticalGap * 2 },
//         { left: 780, top: 330 + headingToCardsOffset + cardVerticalGap * 3 },
//         { left: 600, top: 420 + headingToCardsOffset + cardVerticalGap * 4 },
//       ]
//     : [
//         { left: 40, top: 380 + headingToCardsOffset },
//         { left: 40, top: 500 + headingToCardsOffset + cardVerticalGap },
//         { left: 40, top: 620 + headingToCardsOffset + cardVerticalGap * 2 },
//         { left: 40, top: 740 + headingToCardsOffset + cardVerticalGap * 3 },
//         { left: 40, top: 860 + headingToCardsOffset + cardVerticalGap * 4 },
//       ];

//   return (
//     <section
//       ref={containerRef}
//       className="relative flex justify-center items-center py-28 bg-white"
//       style={{ minHeight: 900 }}
//     >
//       {/* Heading */}
//       <h2
//         style={{
//           position: "absolute",
//           top: 30, // increased spacing
//           color: "black",
//           fontSize: 44,
//           fontWeight: 900,
//           letterSpacing: "0.5px",
//         }}
//       >
//         Core Features
//       </h2>
//       <p
//         style={{
//           position: "absolute",
//           top: 110, // increased spacing
//           color: "black",
//           fontSize: 20,
//           fontWeight: 430,
//           letterSpacing: "0.5px",
//         }}
//       >
//         Comprehensive skill management ecosystem
//       </p>

//       <div style={{ width: "100%", maxWidth: 980, height: 800, position: "relative" }}>
//         {/* Center Card */}
//         <div
//           ref={centerRef}
//           style={{
//             position: "absolute",
//             left: windowWidth > 768 ? 120 : "50%",
//             transform: windowWidth <= 768 ? "translateX(-50%)" : undefined,
//             top: 280,
//             width: 180,
//             height: 180,
//             marginRight:10,
//             background: "#f9fafb",
//             borderRadius: 20,
//             boxShadow: cardShadow,
//             border: "1px solid #e5e7eb",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             fontWeight: 800,
//             color: "#111827",
//             zIndex: 30,
//             fontSize: 20,
//           }}
//         >
//           <div style={{ textAlign: "center", lineHeight: 1.05 }}>
//             <div>OUR</div>
//             <div>FEATURES</div>
//           </div>
//         </div>

//         {/* SVG connectors */}
//         <svg
//           ref={svgRef}
//           viewBox={`0 0 980 1200`}
//           style={{
//             position: "absolute",
//             left: 0,
//             top: 0,
//             width: "100%",
//             height: "100%",
//             pointerEvents: "none",
//             zIndex: 20,
//           }}
//         >
//           {paths.map((d, i) => (
//             <path
//               key={i}
//               className="connector"
//               d={d}
//               stroke={data[i].border ? red : "black"}
//               strokeWidth={data[i].border ? 2.5 : 1.5}
//               fill="none"
//               strokeLinecap="round"
//               style={{ visibility: paths.length ? "visible" : "hidden", opacity: 0.6 }}
//             />
//           ))}
//         </svg>

//         {/* Cards */}
//         {data.map((item, i) => {
//           const pos = cardPositions[i];
//           const Icon = item.icon;
//           return (
//             <div
//               key={i}
//               ref={(el) => setCardRef(el, i)}
//               className="cv-card"
//               style={{
//                 position: "absolute",
//                 left: pos.left,
//                 top: pos.top,
//                 width: 260,
//                 height: 100,
//                 marginRight:30,
//                 display: "flex",
//                 gap: 16,
//                 alignItems: "center",
//                 zIndex: 40,
//               }}
//             >
//               <div
//                 className="cv-icon-box"
//                 style={{
//                   width: 72,
//                   height: 72,
//                   borderRadius: 16,
//                   background: "#fff",
//                   boxShadow: cardShadow,
//                   border: item.border ? `2px solid ${red}` : "2px solid black",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontSize: 28,
//                   color: item.border ? red : "#111827",
//                 }}
//               >
//                 <Icon />
//               </div>

//               <div style={{ display: "flex", flexDirection: "column" }}>
//                 <div style={{ color: red, fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
//                   {item.title}
//                 </div>
//                 <div style={{ color: grayText, fontWeight: 480, fontSize: 14, lineHeight: 1.4 }}>
//                   {item.desc}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </section>
//   );
// }


// import React, { useEffect, useRef, useState } from "react";
// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { FaCertificate, FaChartLine, FaCogs, FaNetworkWired, FaShieldAlt } from "react-icons/fa";

// gsap.registerPlugin(ScrollTrigger);

// const data = [
//   { title: "Skill Validation Engine", desc: "Authenticates skills via structured assessment data.", icon: FaShieldAlt, border: false },
//   { title: 'Digital Badging & Certificates', desc: 'Tamper-proof and shareable proof of competence.', icon: FaCertificate, border: true },
//   { title: 'Analytics Dashboard', desc: 'Visualize training ROI and identify skill gaps.', icon: FaChartLine, border: false },
//   { title: 'Competency Mapping', desc: 'Align internal frameworks with industry standards.', icon: FaCogs, border: true },
//   { title: 'Enterprise APIs', desc: 'Integrate and scale across locations and departments.', icon: FaNetworkWired, border: false },
// ];

// const red = "#D80016";
// const grayText = "#374151";
// const cardShadow = "0 12px 28px rgba(0,0,0,0.08)";

// export default function CoreValuesDesktop() {
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const svgRef = useRef<SVGSVGElement | null>(null);
//   const centerRef = useRef<HTMLDivElement | null>(null);
//   const cardRefs = useRef<HTMLDivElement[]>([]);
//   const [paths, setPaths] = useState<string[]>([]);
//   const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

//   const setCardRef = (el: HTMLDivElement | null, i: number) => {
//     if (el) cardRefs.current[i] = el;
//   };

//   function buildOrthogonalPath(from: { x: number; y: number }, to: { x: number; y: number }) {
//     const midX = from.x + (to.x - from.x) * 0.4;
//     return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
//   }

//   useEffect(() => {
//     const compute = () => {
//       const centerRect = centerRef.current?.getBoundingClientRect();
//       const svgRect = svgRef.current?.getBoundingClientRect();
//       if (!centerRect || !svgRect) return;

//       const from = {
//         x: centerRect.left + centerRect.width / 2 - svgRect.left,
//         y: centerRect.top + centerRect.height / 2 - svgRect.top,
//       };

//       const newPaths: string[] = [];

//       for (let i = 0; i < cardRefs.current.length; i++) {
//         const card = cardRefs.current[i];
//         const iconBox = card?.querySelector(".cv-icon-box") as HTMLDivElement | null;
//         if (!card || !iconBox) continue;
//         const iconRect = iconBox.getBoundingClientRect();

//         const to = {
//           x: iconRect.left + iconRect.width / 2 - svgRect.left,
//           y: iconRect.top + iconRect.height / 2 - svgRect.top,
//         };

//         newPaths.push(buildOrthogonalPath(from, to));
//       }

//       setPaths(newPaths);
//     };

//     compute();
//     const ro = new ResizeObserver(compute);
//     ro.observe(document.documentElement);
//     window.addEventListener("resize", () => {
//       setWindowWidth(window.innerWidth);
//       compute();
//     });
//     return () => {
//       ro.disconnect();
//       window.removeEventListener("resize", compute);
//     };
//   }, []);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     // Animate cards
//     gsap.fromTo(
//       containerRef.current.querySelectorAll(".cv-card"),
//       { autoAlpha: 0, y: 24 },
//       {
//         autoAlpha: 1,
//         y: 0,
//         duration: 0.8,
//         stagger: 0.15,
//         ease: "power3.out",
//         scrollTrigger: { trigger: containerRef.current, start: "top 85%" },
//       }
//     );

//     // Animate stroke connectors continuously
//     const svg = svgRef.current;
//     if (!svg) return;
//     const pathEls = Array.from(svg.querySelectorAll("path.connector")) as SVGPathElement[];
//     if (!pathEls.length) return;

//     pathEls.forEach((p) => {
//       const len = p.getTotalLength();
//       p.style.strokeDasharray = `${len}`;
//       p.style.strokeDashoffset = `${len}`;
//       p.style.visibility = "visible";

//       gsap.fromTo(
//         p,
//         { strokeDashoffset: len },
//         {
//           strokeDashoffset: 0,
//           duration: 10,
//           repeat: -1,
//           ease: "linear",
//         }
//       );
//     });

//     // Center card pulse
//     gsap.to(centerRef.current, {
//       scale: 1.03,
//       repeat: -1,
//       yoyo: true,
//       duration: 2,
//       ease: "power1.inOut",
//     });

//     return () => ScrollTrigger.getAll().forEach((t) => t.kill());
//   }, [paths]);

//   // --- Spacing offsets ---
//   const headingToCardsOffset = 50;
//   const cardVerticalGap = 20;

//   const cardPositions = windowWidth > 768
//     ? [
//         { left: 600, top: 40 + headingToCardsOffset },
//         { left: 780, top: 130 + headingToCardsOffset + cardVerticalGap },
//         { left: 780, top: 230 + headingToCardsOffset + cardVerticalGap * 2 },
//         { left: 780, top: 330 + headingToCardsOffset + cardVerticalGap * 3 },
//         { left: 600, top: 420 + headingToCardsOffset + cardVerticalGap * 4 },
//       ]
//     : [
//         { left: 40, top: 380 + headingToCardsOffset },
//         { left: 40, top: 500 + headingToCardsOffset + cardVerticalGap },
//         { left: 40, top: 620 + headingToCardsOffset + cardVerticalGap * 2 },
//         { left: 40, top: 740 + headingToCardsOffset + cardVerticalGap * 3 },
//         { left: 40, top: 860 + headingToCardsOffset + cardVerticalGap * 4 },
//       ];

//   return (
//     <section
//       ref={containerRef}
//       className="relative flex justify-center items-center py-28 bg-white"
//       style={{ minHeight: 900 }}
//     >
//       {/* Heading */}
//       <h2
//         style={{
//           position: "absolute",
//           top: 30,
//           color: "black",
//           fontSize: 44,
//           fontWeight: 900,
//           letterSpacing: "0.5px",
//         }}
//       >
//         Core Features
//       </h2>
//       <p
//         style={{
//           position: "absolute",
//           top: 110,
//           color: "black",
//           fontSize: 20,
//           fontWeight: 430,
//           letterSpacing: "0.5px",
//         }}
//       >
//         Comprehensive skill management ecosystem
//       </p>

//       {/* Container for cards */}
//       <div style={{ width: "100%", maxWidth: 980, height: 800, position: "relative" }}>
//         {/* Center Card */}
//         <div
//           ref={centerRef}
//           style={{
//             position: "absolute",
//             left: windowWidth > 768 ? 120 : "50%",
//             transform: windowWidth <= 768 ? "translateX(-50%)" : undefined,
//             top: 280,
//             width: 180,
//             height: 180,
//             background: "#f9fafb",
//             borderRadius: 20,
//             boxShadow: cardShadow,
//             border: "1px solid #e5e7eb",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             fontWeight: 800,
//             color: "#111827",
//             zIndex: 30,
//             fontSize: 20,
//           }}
//         >
//           <div style={{ textAlign: "center", lineHeight: 1.05 }}>
//             <div>OUR</div>
//             <div>FEATURES</div>
//           </div>
//         </div>

//         {/* SVG connectors */}
//         <svg
//           ref={svgRef}
//           viewBox={`0 0 980 800`}
//           style={{
//             position: "absolute",
//             left: 0,
//             top: 0,
//             width: "100%",
//             height: "100%",
//             pointerEvents: "none",
//             zIndex: 20,
//           }}
//         >
//           {paths.map((d, i) => (
//             <path
//               key={i}
//               className="connector"
//               d={d}
//               stroke={data[i].border ? red : "black"}
//               strokeWidth={data[i].border ? 2.5 : 1.5}
//               fill="none"
//               strokeLinecap="round"
//               style={{ visibility: paths.length ? "visible" : "hidden", opacity: 0.6 }}
//             />
//           ))}
//         </svg>

//         {/* Cards */}
//         {data.map((item, i) => {
//           const pos = cardPositions[i];
//           const Icon = item.icon;
//           return (
//             <div
//               key={i}
//               ref={(el) => setCardRef(el, i)}
//               className="cv-card"
//               style={{
//                 position: "absolute",
//                 left: pos.left,
//                 top: pos.top,
//                 width: 260,
//                 height: 100,
//                 display: "flex",
//                 gap: 16,
//                 alignItems: "center",
//                 zIndex: 40,
//               }}
//             >
//               <div
//                 className="cv-icon-box"
//                 style={{
//                   width: 72,
//                   height: 72,
//                   borderRadius: 16,
//                   background: "#fff",
//                   boxShadow: cardShadow,
//                   border: item.border ? `2px solid ${red}` : "2px solid black",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontSize: 28,
//                   color: item.border ? red : "#111827",
//                 }}
//               >
//                 <Icon />
//               </div>

//               <div style={{ display: "flex", flexDirection: "column" }}>
//                 <div style={{ color: red, fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
//                   {item.title}
//                 </div>
//                 <div style={{ color: grayText, fontWeight: 480, fontSize: 14, lineHeight: 1.4 }}>
//                   {item.desc}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </section>
//   );
// }



// import React, { useEffect, useRef, useState } from "react";
// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { FaCertificate, FaChartLine, FaCogs, FaNetworkWired, FaShieldAlt } from "react-icons/fa";

// gsap.registerPlugin(ScrollTrigger);

// const data = [
//   { title: "Skill Validation Engine", desc: "Authenticates skills via structured assessment data.", icon: FaShieldAlt, border: false },
//   { title: 'Digital Badging & Certificates', desc: 'Tamper-proof and shareable proof of competence.', icon: FaCertificate, border: true },
//   { title: 'Analytics Dashboard', desc: 'Visualize training ROI and identify skill gaps.', icon: FaChartLine, border: false },
//   { title: 'Competency Mapping', desc: 'Align internal frameworks with industry standards.', icon: FaCogs, border: true },
//   { title: 'Enterprise APIs', desc: 'Integrate and scale across locations and departments.', icon: FaNetworkWired, border: false },
// ];

// const red = "#D80016";
// const grayText = "#374151";
// const cardShadow = "0 12px 28px rgba(0,0,0,0.08)";

// export default function CoreValuesDesktop() {
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const svgRef = useRef<SVGSVGElement | null>(null);
//   const centerRef = useRef<HTMLDivElement | null>(null);
//   const cardRefs = useRef<HTMLDivElement[]>([]);
//   const [paths, setPaths] = useState<string[]>([]);
//   const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

//   const setCardRef = (el: HTMLDivElement | null, i: number) => {
//     if (el) cardRefs.current[i] = el;
//   };

//   function buildOrthogonalPath(from: { x: number; y: number }, to: { x: number; y: number }) {
//     const midX = from.x + (to.x - from.x) * 0.4;
//     return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
//   }

//   useEffect(() => {
//     const compute = () => {
//       const centerRect = centerRef.current?.getBoundingClientRect();
//       const svgRect = svgRef.current?.getBoundingClientRect();
//       if (!centerRect || !svgRect) return;

//       const from = {
//         x: centerRect.left + centerRect.width / 2 - svgRect.left,
//         y: centerRect.top + centerRect.height / 2 - svgRect.top,
//       };

//       const newPaths: string[] = [];

//       for (let i = 0; i < cardRefs.current.length; i++) {
//         const card = cardRefs.current[i];
//         const iconBox = card?.querySelector(".cv-icon-box") as HTMLDivElement | null;
//         if (!card || !iconBox) continue;
//         const iconRect = iconBox.getBoundingClientRect();

//         const to = {
//           x: iconRect.left + iconRect.width / 2 - svgRect.left,
//           y: iconRect.top + iconRect.height / 2 - svgRect.top,
//         };

//         newPaths.push(buildOrthogonalPath(from, to));
//       }

//       setPaths(newPaths);
//     };

//     compute();
//     const ro = new ResizeObserver(compute);
//     ro.observe(document.documentElement);
//     window.addEventListener("resize", () => {
//       setWindowWidth(window.innerWidth);
//       compute();
//     });
//     return () => {
//       ro.disconnect();
//       window.removeEventListener("resize", compute);
//     };
//   }, []);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     // Animate cards
//     gsap.fromTo(
//       containerRef.current.querySelectorAll(".cv-card"),
//       { autoAlpha: 0, y: 24 },
//       {
//         autoAlpha: 1,
//         y: 0,
//         duration: 0.8,
//         stagger: 0.15,
//         ease: "power3.out",
//         scrollTrigger: { trigger: containerRef.current, start: "top 85%" },
//       }
//     );

//     // Animate stroke connectors continuously
//     const svg = svgRef.current;
//     if (!svg) return;
//     const pathEls = Array.from(svg.querySelectorAll("path.connector")) as SVGPathElement[];
//     if (!pathEls.length) return;

//     pathEls.forEach((p) => {
//       const len = p.getTotalLength();
//       p.style.strokeDasharray = `${len}`;
//       p.style.strokeDashoffset = `${len}`;
//       p.style.visibility = "visible";

//       gsap.fromTo(
//         p,
//         { strokeDashoffset: len },
//         {
//           strokeDashoffset: 0,
//           duration: 2,
//           repeat: -1,
//           ease: "linear",
//         }
//       );
//     });

//     // Center card pulse
//     gsap.to(centerRef.current, {
//       scale: 1.03,
//       repeat: -1,
//       yoyo: true,
//       duration: 2,
//       ease: "power1.inOut",
//     });

//     return () => ScrollTrigger.getAll().forEach((t) => t.kill());
//   }, [paths]);

//   // --- Spacing offsets ---
//   const headingToCardsOffset = 50;
//   const cardVerticalGap = 20;

//   // Center everything horizontally by calculating relative left
//   const cardPositions = windowWidth > 768
//     ? [
//         { left: 450, top: 40 + headingToCardsOffset },
//         { left: 630, top: 130 + headingToCardsOffset + cardVerticalGap },
//         { left: 630, top: 230 + headingToCardsOffset + cardVerticalGap * 2 },
//         { left: 630, top: 330 + headingToCardsOffset + cardVerticalGap * 3 },
//         { left: 450, top: 420 + headingToCardsOffset + cardVerticalGap * 4 },
//       ]
//     : [
//         { left: 40, top: 380 + headingToCardsOffset },
//         { left: 40, top: 500 + headingToCardsOffset + cardVerticalGap },
//         { left: 40, top: 620 + headingToCardsOffset + cardVerticalGap * 2 },
//         { left: 40, top: 740 + headingToCardsOffset + cardVerticalGap * 3 },
//         { left: 40, top: 860 + headingToCardsOffset + cardVerticalGap * 4 },
//       ];

//   return (
//     <section
//       ref={containerRef}
//       className="relative flex justify-center items-center py-28 bg-white"
//       style={{ minHeight: 900 }}
//     >
//       {/* Heading */}
//       <h2
//         style={{
//           position: "absolute",
//           top: 30,
//           color: "black",
//           fontSize: 44,
//           fontWeight: 900,
//           letterSpacing: "0.5px",
//         }}
//       >
//         Core Features
//       </h2>
//       <p
//         style={{
//           position: "absolute",
//           top: 100,
//           color: "black",
//           fontSize: 20,
//           fontWeight: 430,
//           letterSpacing: "0.5px",
//         }}
//       >
//         Comprehensive skill management ecosystem
//       </p>

//       {/* Container for cards with horizontal centering */}
//       <div
//         style={{
//           width: "100%",
//           maxWidth: 980,
//           padding: "0 px", // left and right padding
//           height: 800,
//           position: "relative",
//           margin: "0 auto",
//         }}
//       >
//         {/* Center Card */}
//         <div
//           ref={centerRef}
//           style={{
//             position: "absolute",
//             left: windowWidth > 768 ? 120 : "50%",
//             transform: windowWidth <= 768 ? "translateX(-50%)" : undefined,
//             top: 280,
//             width: 180,
//             height: 180,
//             background: "#f9fafb",
//             borderRadius: 20,
//             boxShadow: cardShadow,
//             border: "1px solid #e5e7eb",
//             display: "flex",
//             alignItems: "center",
            
//             justifyContent: "center",
//             fontWeight: 800,
//             color: "#111827",
//             zIndex: 30,
//             fontSize: 20,
//           }}
//         >
//           <div style={{ textAlign: "center", lineHeight: 1.50 }}>
//             <div>OUR</div>
//             <div>FEATURES</div>
//           </div>
//         </div>

//         {/* SVG connectors */}
//         <svg
//           ref={svgRef}
//           viewBox={`0 0 980 800`}
//           style={{
//             position: "absolute",
//             left: 0,
//             top: 0,
//             width: "100%",
//             height: "100%",
//             pointerEvents: "none",
//             zIndex: 20,
//           }}
//         >
//           {paths.map((d, i) => (
//             <path
//               key={i}
//               className="connector"
//               d={d}
//               stroke={data[i].border ? red : "black"}
//               strokeWidth={data[i].border ? 2.5 : 1.5}
//               fill="none"
//               strokeLinecap="round"
//               style={{ visibility: paths.length ? "visible" : "hidden", opacity: 0.6 }}
//             />
//           ))}
//         </svg>

//         {/* Cards */}
//         {data.map((item, i) => {
//           const pos = cardPositions[i];
//           const Icon = item.icon;
//           return (
//             <div
//               key={i}
//               ref={(el) => setCardRef(el, i)}
//               className="cv-card"
//               style={{
//                 position: "absolute",
//                 left: pos.left,
//                 top: pos.top,
//                 width: 260,
//                 height: 100,
//                 display: "flex",
//                 gap: 16,
//                 alignItems: "center",
//                 zIndex: 40,
//               }}
//             >
//               <div
//                 className="cv-icon-box"
//                 style={{
//                   width: 72,
//                   height: 72,
//                   borderRadius: 16,
//                   background: "#fff",
//                   boxShadow: cardShadow,
//                   border: item.border ? "2px solid black" : "2px solid black",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontSize: 28,
//                   color: item.border ? red : red,
//                 }}
//               >
//                 <Icon />
//               </div>

//               <div style={{ display: "flex", flexDirection: "column" }}>
//                 <div style={{ color: "black", fontWeight: 700, fontSize: 19, marginBottom: 6 }}>
//                   {item.title}
//                 </div>
//                 <div style={{ color: "black", fontWeight: 480, fontSize: 15, lineHeight: 1.4 }}>
//                   {item.desc}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </section>
//   );
// }




// import React from "react";
// import {
//   FaUserCog,
//   FaProjectDiagram,
//   FaCertificate,
//   FaUsers,
//   FaChartBar,
// } from "react-icons/fa";

// const CoreFeatures: React.FC = () => {
//   return (
//     <div className="relative flex flex-col items-center justify-center min-h-screen bg-white py-16 overflow-hidden">
//       {/* ===== Heading Section ===== */}
//       <div className="text-center mb-20">
//         <h1 className="text-4xl font-bold text-black">Our Core Features</h1>
//         <p className="text-2xl text-gray-600 mt-8">
//           Comprehensive Skill Management Ecosystem
//         </p>
//       </div>

//       {/* ===== Features Diagram ===== */}
//       <div className="relative w-[1300px] h-[700px] mx-auto scale-100 md:scale-90 sm:scale-75 transition-all duration-300">
//         {/* ===== Center Feature ===== */}
//         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
//           <div className="relative w-[300px] h-[120px]">
//             {/* SVG Circle Borders */}
//             <svg
//               className="absolute left-[-18px] top-[2px] z-0 scale-y-[-1] scale-x-[-1]"
//               width="116"
//               height="111"
//               viewBox="0 0 116 111"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 115.182 24.8693 115.242 54.8242C115.302 85.0699 90.7166 109.658 60.465 109.607L0.218569 109.505"
//                 stroke="black"
//               />
//             </svg>
//             <svg
//               className="absolute right-[-18px] top-[3px] z-0 scale-x-[-1] rotate-180 scale-y-[-1]"
//               width="116"
//               height="111"
//               viewBox="0 0 116 111"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 115.182 24.8693 115.242 54.8242C115.302 85.0699 90.7166 109.658 60.465 109.607L0.218569 109.505"
//                 stroke="black"
//               />
//             </svg>

//             <div className="relative bg-gradient-to-tr bg-[#D4AF37] rounded-[55px] h-[88px] top-3 flex items-center justify-center shadow-md">
//               <div className="text-center text-white font-semibold">
//                 <div className="text-[22px] leading-none">Our</div>
//                 <div className="text-[22px] leading-none">Core Features</div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ===== Top Center Card ===== */}
//         <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-gradient-to-tr from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//             <FaUserCog className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold text-black">
//               Skill Validation Engine
//             </h3>
//             <p className="text-sm font-regular text-gray-600">
//               Authenticates skills via structured assessment data.
//             </p>
//           </div>

//           {/* Connector */}
//         </div>
//          <svg
//             className="absolute left-1/2 top-[130px] -translate-x-1/2"
//             width="2"
//             height="175"
//             viewBox="0 0 2 175"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <line x1="1" y1="0" x2="1" y2="175" stroke="black" />
//           </svg>

//         {/* ===== Top Left Card ===== */}
//         <div className="absolute top-[22%] left-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-gradient-to-tr from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//               <FaProjectDiagram className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold text-black">Enterprise APIs</h3>
//             <p className="text-sm font-regular text-gray-600">
//               Integrate and scale across locations and departments.
//             </p>
//           </div>

//           {/* Connector */}
//         </div>
//         <svg
//             className="absolute left-[380px] top-[260px]"
//             width="254"
//             height="45"
//             viewBox="0 0 254 48"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               d="M253.5 47.427L253.5 33.9571C253.5 25.6729 246.784 18.9572 238.5 18.9571L15.5 18.9567C7.21571 18.9567 0.499999 12.241 0.499997 3.95672L0.499997 0"
//               stroke="black"
//             />
//           </svg>

//         {/* ===== Top Right Card ===== */}
//         <div className="absolute top-[22%] right-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-gradient-to-tr from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//               <FaCertificate className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold text-black">
//               Digital Badging & Certificates
//             </h3>
//             <p className="text-sm font-regular text-gray-600">
//               Tamper-proof and shareable proof of competence.
//             </p>
//           </div>

//           {/* Connector */}
//         </div>
//          <svg
//             className="absolute right-[370px] top-[260px] scale-x-[-1]"
//             width="254"
//             height="48"
//             viewBox="0 0 254 48"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               d="M253.5 47.427L253.5 33.9571C253.5 25.6729 246.784 18.9572 238.5 18.9571L15.5 18.9567C7.21571 18.9567 0.499999 12.241 0.499997 3.95672L0.499997 0"
//               stroke="black"
//             />
//           </svg>

//         {/* ===== Bottom Left Card ===== */}
//         <div className="absolute bottom-[20%] left-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-gradient-to-tr from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//               <FaUsers className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold text-black">
//               Competency Mapping
//             </h3>
//             <p className="text-sm font-regular text-gray-600">
//               Align internal frameworks with industry standards.
//             </p>
//           </div>

//           {/* Connector */}
//         </div>
//          <svg
//             className="absolute left-[370px] bottom-[243px]"
//             width="255"
//             height="67"
//             viewBox="0 0 255 67"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               d="M254.105 0.0198917L254.417 7.83847C254.757 16.3506 247.948 23.4366 239.429 23.4366L15.5 23.4366C7.2157 23.4366 0.499992 30.1524 0.499992 38.4366L0.499992 66.1697"
//               stroke="black"
//             />
//           </svg>

//         {/* ===== Bottom Right Card ===== */}
//         <div className="absolute bottom-[21%] right-[9%]">
//           <div className="-mb-2">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-gradient-to-tr from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//               <FaChartBar className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold text-black">
//               Analytics Dashboard
//             </h3>
//             <p className="text-sm font-regular text-gray-600">
//               Visualize training ROI and identify skill gaps.
//             </p>
//           </div>
//           </div>
//           {/* Connector */}
//         </div>
//         <svg
//             className="absolute right-[350px] bottom-[243px] scale-x-[-1] w-[300px]"
//             width="255"
//             height="67"
//             viewBox="0 0 255 67"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               d="M254.105 0.0198917L254.417 7.83847C254.757 16.3506 247.948 23.4366 239.429 23.4366L15.5 23.4366C7.2157 23.4366 0.499992 30.1524 0.499992 38.4366L0.499992 66.1697"
//               stroke="black"
//             />
//           </svg>
//       </div>
//     </div>
//   );
// };

// export default CoreFeatures;




// Animation
// import React from "react";
// import {
//   FaUserCog,
//   FaProjectDiagram,
//   FaCertificate,
//   FaUsers,
//   FaChartBar,
// } from "react-icons/fa";

// const CoreFeatures: React.FC = () => {
//   return (
//     <div className="relative flex flex-col items-center justify-center min-h-screen bg-white py-16 overflow-hidden">
//       {/* ===== Animation Keyframes ===== */}
//       <style>{`
//         @keyframes drawLine {
//           0% {
//             stroke-dashoffset: var(--path-length);
//           }
//           50% {
//             stroke-dashoffset: 0;
//           }
//           100% {
//             stroke-dashoffset: var(--path-length);
//           }
//         }

//         .animated-draw {
//           stroke: black;
//           stroke-width: 2;
//           fill: none;
//           stroke-dasharray: var(--path-length);
//           stroke-dashoffset: var(--path-length);
//           animation: drawLine 6s ease-in-out infinite;
//         }

//         .delay-1 { animation-delay: 0s; }
//         .delay-2 { animation-delay: 0.8s; }
//         .delay-3 { animation-delay: 1.6s; }
//         .delay-4 { animation-delay: 2.4s; }
//         .delay-5 { animation-delay: 3.2s; }
//       `}</style>

//       {/* ===== Heading Section ===== */}
//       <div className="text-center mb-20">
//         <h1 className="text-4xl font-bold text-black">Our Core Features</h1>
//         <p className="text-2xl text-gray-600 mt-8">
//           Comprehensive Skill Management Ecosystem
//         </p>
//       </div>

//       {/* ===== Features Diagram ===== */}
//       <div className="relative w-[1300px] h-[700px] mx-auto scale-100 md:scale-90 sm:scale-75 transition-all duration-300">
//         {/* ===== Center Feature ===== */}
//         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
//           <div className="relative w-[300px] h-[120px]">
//             {/* SVG Circle Borders (static) */}
//             <svg
//               className="absolute left-[-18px] top-[2px] z-0 scale-y-[-1] scale-x-[-1]"
//               width="116"
//               height="111"
//               viewBox="0 0 116 111"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 115.182 24.8693 115.242 54.8242C115.302 85.0699 90.7166 109.658 60.465 109.607L0.218569 109.505"
//                 stroke="black"
//               />
//             </svg>
//             <svg
//               className="absolute right-[-18px] top-[3px] z-0 scale-x-[-1] rotate-180 scale-y-[-1]"
//               width="116"
//               height="111"
//               viewBox="0 0 116 111"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 115.182 24.8693 115.242 54.8242C115.302 85.0699 90.7166 109.658 60.465 109.607L0.218569 109.505"
//                 stroke="black"
//               />
//             </svg>

//             <div className="relative bg-gradient-to-tr bg-[#D4AF37] rounded-[55px] h-[88px] top-3 flex items-center justify-center shadow-md">
//               <div className="text-center text-white font-semibold">
//                 <div className="text-[22px] leading-none">Our</div>
//                 <div className="text-[22px] leading-none">Core Features</div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ===== Top Center Card ===== */}
//         <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-gradient-to-tr from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//             <FaUserCog className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold text-black">
//               Skill Validation Engine
//             </h3>
//             <p className="text-sm font-regular text-gray-600">
//               Authenticates skills via structured assessment data.
//             </p>
//           </div>
//         </div>

//         {/* Connector */}
//         <svg
//           className="absolute left-1/2 top-[130px] -translate-x-1/2 delay-1"
//           width="2"
//           height="175"
//           viewBox="0 0 2 175"
//           fill="none"
//           xmlns="http://www.w3.org/2000/svg"
//           style={{ "--path-length": 175 } as React.CSSProperties}
//         >
//           <line
//             x1="1"
//             y1="0"
//             x2="1"
//             y2="175"
//             className="animated-draw"
//           />
//         </svg>

//         {/* ===== Top Left Card ===== */}
//         <div className="absolute top-[22%] left-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-gradient-to-tr from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//             <FaProjectDiagram className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold text-black">Enterprise APIs</h3>
//             <p className="text-sm font-regular text-gray-600">
//               Integrate and scale across locations and departments.
//             </p>
//           </div>
//         </div>

//         {/* Connector */}
//         <svg
//           className="absolute left-[380px] top-[260px] delay-2"
//           width="254"
//           height="45"
//           viewBox="0 0 254 48"
//           fill="none"
//           xmlns="http://www.w3.org/2000/svg"
//           style={{ "--path-length": 300 } as React.CSSProperties}
//         >
//           <path
//             d="M253.5 47.427L253.5 33.9571C253.5 25.6729 246.784 18.9572 238.5 18.9571L15.5 18.9567C7.21571 18.9567 0.499999 12.241 0.499997 3.95672L0.499997 0"
//             className="animated-draw"
//           />
//         </svg>

//         {/* ===== Top Right Card ===== */}
//         <div className="absolute top-[22%] right-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-gradient-to-tr from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//             <FaCertificate className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold text-black">
//               Digital Badging & Certificates
//             </h3>
//             <p className="text-sm font-regular text-gray-600">
//               Tamper-proof and shareable proof of competence.
//             </p>
//           </div>
//         </div>

//         {/* Connector */}
//         <svg
//           className="absolute right-[370px] top-[260px] scale-x-[-1] delay-3"
//           width="254"
//           height="48"
//           viewBox="0 0 254 48"
//           fill="none"
//           xmlns="http://www.w3.org/2000/svg"
//           style={{ "--path-length": 300 } as React.CSSProperties}
//         >
//           <path
//             d="M253.5 47.427L253.5 33.9571C253.5 25.6729 246.784 18.9572 238.5 18.9571L15.5 18.9567C7.21571 18.9567 0.499999 12.241 0.499997 3.95672L0.499997 0"
//             className="animated-draw"
//           />
//         </svg>

//         {/* ===== Bottom Left Card ===== */}
//         <div className="absolute bottom-[20%] left-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-gradient-to-tr from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//             <FaUsers className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold text-black">Competency Mapping</h3>
//             <p className="text-sm font-regular text-gray-600">
//               Align internal frameworks with industry standards.
//             </p>
//           </div>
//         </div>

//         {/* Connector */}
//         <svg
//           className="absolute left-[370px] bottom-[243px] delay-4"
//           width="255"
//           height="67"
//           viewBox="0 0 255 67"
//           fill="none"
//           xmlns="http://www.w3.org/2000/svg"
//           style={{ "--path-length": 350 } as React.CSSProperties}
//         >
//           <path
//             d="M254.105 0.0198917L254.417 7.83847C254.757 16.3506 247.948 23.4366 239.429 23.4366L15.5 23.4366C7.2157 23.4366 0.499992 30.1524 0.499992 38.4366L0.499992 66.1697"
//             className="animated-draw"
//           />
//         </svg>

//         {/* ===== Bottom Right Card ===== */}
//         <div className="absolute bottom-[21%] right-[9%]">
//           <div className="-mb-2">
//             <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-xl bg-gradient-to-tr from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//               <FaChartBar className="text-black text-2xl" />
//             </div>
//             <div className="w-[300px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center">
//               <h3 className="text-lg font-bold text-black">
//                 Analytics Dashboard
//               </h3>
//               <p className="text-sm font-regular text-gray-600">
//                 Visualize training ROI and identify skill gaps.
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Connector */}
//         <svg
//           className="absolute right-[350px] bottom-[243px] scale-x-[-1] w-[300px] delay-5"
//           width="255"
//           height="67"
//           viewBox="0 0 255 67"
//           fill="none"
//           xmlns="http://www.w3.org/2000/svg"
//           style={{ "--path-length": 350 } as React.CSSProperties}
//         >
//           <path
//             d="M254.105 0.0198917L254.417 7.83847C254.757 16.3506 247.948 23.4366 239.429 23.4366L15.5 23.4366C7.2157 23.4366 0.499992 30.1524 0.499992 38.4366L0.499992 66.1697"
//             className="animated-draw"
//           />
//         </svg>
//       </div>
//     </div>
//   );
// };

// export default CoreFeatures;



// different animation
// import React from "react";
// import {
//   FaUserCog,
//   FaProjectDiagram,
//   FaCertificate,
//   FaUsers,
//   FaChartBar,
// } from "react-icons/fa";

// const CoreFeatures: React.FC = () => {
//   return (
//     <div className="relative flex flex-col items-center justify-center min-h-screen bg-white py-16 overflow-hidden">
//       {/* === Inline Animation Styles === */}
//       <style>{`
//         @keyframes drawLine {
//           0% {
//             stroke-dashoffset: var(--path-length);
//           }
//           50% {
//             stroke-dashoffset: 0;
//           }
//           100% {
//             stroke-dashoffset: var(--path-length);
//           }
//         }

//         .animated-draw path,
//         .animated-draw line {
//           stroke: black;
//           stroke-width: 2;
//           fill: none;
//           stroke-dasharray: var(--path-length);
//           stroke-dashoffset: var(--path-length);
//           animation: drawLine 6s ease-in-out infinite;
//         }

//         .delay-1 { animation-delay: 0s; }
//         .delay-2 { animation-delay: 0.8s; }
//         .delay-3 { animation-delay: 1.6s; }
//         .delay-4 { animation-delay: 2.4s; }
//         .delay-5 { animation-delay: 3.2s; }
//       `}</style>

//       {/* ===== Heading Section ===== */}
//       <div className="text-center mb-20 px-4">
//         <h1 className="text-4xl font-bold text-black">Our Core Features</h1>
//         <p className="text-2xl text-gray-600 mt-8">
//           Comprehensive Skill Management Ecosystem
//         </p>
//       </div>

//       {/* ===== Desktop Version (Animated Lines + Cards) ===== */}
//       <div className="relative w-[1300px] h-[700px] mx-auto scale-100 md:scale-90 sm:scale-75 transition-all duration-300 hidden md:block">
//         {/* === Center Feature === */}
//         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
//           <div className="relative w-[300px] h-[120px]">
//             {/* Left + Right Border SVGs */}
//             <svg
//               className="absolute left-[-18px] top-[2px] z-0 scale-y-[-1] scale-x-[-1]"
//               width="116"
//               height="111"
//               viewBox="0 0 116 111"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 
//                    115.182 24.8693 115.242 54.8242C115.302 85.0699 
//                    90.7166 109.658 60.465 109.607L0.218569 109.505"
//                 stroke="black"
//               />
//             </svg>
//             <svg
//               className="absolute right-[-18px] top-[3px] z-0 scale-x-[-1] rotate-180 scale-y-[-1]"
//               width="116"
//               height="111"
//               viewBox="0 0 116 111"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 
//                    115.182 24.8693 115.242 54.8242C115.302 85.0699 
//                    90.7166 109.658 60.465 109.607L0.218569 109.505"
//                 stroke="black"
//               />
//             </svg>

//             <div className="relative bg-gradient-to-tr bg-[#D4AF37] rounded-[55px] h-[88px] top-3 flex items-center justify-center shadow-md">
//               <div className="text-center text-white font-semibold">
//                 <div className="text-[22px] leading-none">Our</div>
//                 <div className="text-[22px] leading-none">Core Features</div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* === Top Center === */}
//         <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
//             w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
//             from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//             <FaUserCog className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl 
//             p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold">Skill Validation Engine</h3>
//             <p className="text-sm text-gray-600">
//               Authenticates skills via structured assessment data.
//             </p>
//           </div>
//         </div>
//         <svg
//           className="absolute left-1/2 top-[130px] -translate-x-1/2 animated-draw delay-1"
//           style={{ ["--path-length" as any]: 175 }}
//           width="2"
//           height="175"
//           viewBox="0 0 2 175"
//           xmlns="http://www.w3.org/2000/svg"
//         >
//           <line x1="1" y1="0" x2="1" y2="175" />
//         </svg>

//         {/* === Top Left === */}
//         <div className="absolute top-[22%] left-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
//             w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
//             from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//             <FaProjectDiagram className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl 
//             p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold">Enterprise APIs</h3>
//             <p className="text-sm text-gray-600">
//               Integrate and scale across locations and departments.
//             </p>
//           </div>
//         </div>
//         <svg
//           className="absolute left-[380px] top-[260px] animated-draw delay-2"
//           style={{ ["--path-length" as any]: 320 }}
//           width="254"
//           height="48"
//           viewBox="0 0 254 48"
//           xmlns="http://www.w3.org/2000/svg"
//         >
//           <path
//             d="M253.5 47.427L253.5 33.9571C253.5 25.6729 246.784 18.9572 
//                238.5 18.9571L15.5 18.9567C7.21571 18.9567 0.5 12.241 
//                0.5 3.95672L0.5 0"
//           />
//         </svg>

//         {/* === Top Right === */}
//         <div className="absolute top-[22%] right-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
//             w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
//             from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//             <FaCertificate className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl 
//             p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold">Digital Badging & Certificates</h3>
//             <p className="text-sm text-gray-600">
//               Tamper-proof and shareable proof of competence.
//             </p>
//           </div>
//         </div>
//         <svg
//           className="absolute right-[370px] top-[260px] scale-x-[-1] animated-draw delay-3"
//           style={{ ["--path-length" as any]: 320 }}
//           width="254"
//           height="48"
//           viewBox="0 0 254 48"
//           xmlns="http://www.w3.org/2000/svg"
//         >
//           <path
//             d="M253.5 47.427L253.5 33.9571C253.5 25.6729 246.784 18.9572 
//                238.5 18.9571L15.5 18.9567C7.21571 18.9567 0.5 12.241 
//                0.5 3.95672L0.5 0"
//           />
//         </svg>

//         {/* === Bottom Left === */}
//         <div className="absolute bottom-[20%] left-[9%]">
//           <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
//             w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
//             from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//             <FaUsers className="text-black text-2xl" />
//           </div>
//           <div className="w-[300px] bg-white border-2 border-black rounded-2xl 
//             p-4 shadow-md text-center">
//             <h3 className="text-lg font-bold">Competency Mapping</h3>
//             <p className="text-sm text-gray-600">
//               Align internal frameworks with industry standards.
//             </p>
//           </div>
//         </div>
//         <svg
//           className="absolute left-[370px] bottom-[243px] animated-draw delay-4"
//           style={{ ["--path-length" as any]: 400 }}
//           width="255"
//           height="67"
//           viewBox="0 0 255 67"
//           xmlns="http://www.w3.org/2000/svg"
//         >
//           <path
//             d="M254.105 0.0198917L254.417 7.83847C254.757 16.3506 
//                247.948 23.4366 239.429 23.4366L15.5 23.4366C7.2157 
//                23.4366 0.5 30.1524 0.5 38.4366L0.5 66.1697"
//           />
//         </svg>

//         {/* === Bottom Right === */}
//         <div className="absolute bottom-[21%] right-[9%]">
//           <div className="-mb-2">
//             <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
//               w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
//               from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//               <FaChartBar className="text-black text-2xl" />
//             </div>
//             <div className="w-[300px] bg-white border-2 border-black rounded-2xl 
//               p-4 shadow-md text-center">
//               <h3 className="text-lg font-bold">Analytics Dashboard</h3>
//               <p className="text-sm text-gray-600">
//                 Visualize training ROI and identify skill gaps.
//               </p>
//             </div>
//           </div>
//         </div>
//         <svg
//           className="absolute right-[370px] bottom-[243px] scale-x-[-1] animated-draw delay-5"
//           style={{ ["--path-length" as any]: 400 }}
//           width="255"
//           height="67"
//           viewBox="0 0 255 67"
//           xmlns="http://www.w3.org/2000/svg"
//         >
//           <path
//             d="M254.105 0.0198917L254.417 7.83847C254.757 16.3506 
//                247.948 23.4366 239.429 23.4366L15.5 23.4366C7.2157 
//                23.4366 0.5 30.1524 0.5 38.4366L0.5 66.1697"
//           />
//         </svg>
//       </div>

//       {/* ===== Mobile Version (Cards Only) ===== */}
//       <div className="flex flex-col items-center justify-center space-y-6 px-6 md:hidden">
//         {[
//           {
//             icon: <FaUserCog className="text-black text-2xl" />,
//             title: "Skill Validation Engine",
//             desc: "Authenticates skills via structured assessment data.",
//           },
//           {
//             icon: <FaProjectDiagram className="text-black text-2xl" />,
//             title: "Enterprise APIs",
//             desc: "Integrate and scale across locations and departments.",
//           },
//           {
//             icon: <FaCertificate className="text-black text-2xl" />,
//             title: "Digital Badging & Certificates",
//             desc: "Tamper-proof and shareable proof of competence.",
//           },
//           {
//             icon: <FaUsers className="text-black text-2xl" />,
//             title: "Competency Mapping",
//             desc: "Align internal frameworks with industry standards.",
//           },
//           {
//             icon: <FaChartBar className="text-black text-2xl" />,
//             title: "Analytics Dashboard",
//             desc: "Visualize training ROI and identify skill gaps.",
//           },
//         ].map((item, i) => (
//           <div
//             key={i}
//             className="w-full max-w-[320px] bg-white border-2 border-black rounded-2xl p-4 shadow-md text-center"
//           >
//             <div className="w-[60px] h-[60px] mx-auto mb-3 rounded-xl bg-gradient-to-tr from-[#f6efd9] to-[#e8dcc0] flex items-center justify-center shadow-md">
//               {item.icon}
//             </div>
//             <h3 className="text-lg font-bold text-black">{item.title}</h3>
//             <p className="text-sm text-gray-600">{item.desc}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default CoreFeatures;


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
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-white py-16 overflow-hidden">
      {/* === Inline Animation Styles === */}
     <style>{`
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
      <div className="text-center mb-20 px-4 -mt-4 sm:mt-10">
  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
    Our Core Features
  </h1>
  <p className="text-base sm:text-lg md:text-2xl text-gray-600 mt-3 sm:mt-6">
    Comprehensive Skill Management Ecosystem
  </p>
</div>


      {/* ===== Desktop Diagram ===== */}
      <div className="desktop-diagram relative w-[1300px] h-[700px] mx-auto scale-100 md:scale-90 sm:scale-75 transition-all duration-300">

        {/* === Center Card === */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative w-[300px] h-[120px]">
            <svg
              className="absolute left-[-15px] top-[2px] z-0 scale-y-[-1] scale-x-[-1]"
              width="116"
              height="111"
              viewBox="0 0 116 111"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 115.182 24.8693 115.242 54.8242C115.302 85.0699 90.7166 109.658 60.465 109.607L0.218569 109.505"
                stroke="black"
              />
            </svg>
            <svg
              className="absolute right-[-15px] top-[3px] z-0 scale-x-[-1] rotate-180 scale-y-[-1]"
              width="116"
              height="111"
              viewBox="0 0 116 111"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.00239916 0.500031L60.9935 0.60277C90.9543 0.653238 115.182 24.8693 115.242 54.8242C115.302 85.0699 90.7166 109.658 60.465 109.607L0.218569 109.505"
                stroke="black"
              />
            </svg>

            <div className="relative bg-gradient-to-tr bg-[#D4AF37] rounded-[55px] h-[88px] top-3 flex items-center justify-center shadow-md card-hover">
              <div className="text-center text-white font-semibold">
                <div className="text-[22px] leading-none">Our</div>
                <div className="text-[22px] leading-none">Core Features</div>
              </div>
            </div>
          </div>
        </div>

        {/* === Top Center === */}
        <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
          <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
            w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
            bg-neutral-950  flex items-center justify-center shadow-md">
            <FiCheckCircle className="text-yellow-500 text-3xl" />
          </div>
          <div className="w-[300px] bg-white border-2 border-black rounded-2xl 
            p-4 shadow-md text-center card-hover">
            <h3 className="text-lg font-bold">Skill Validation Engine</h3>
            <p className="text-sm text-gray-600">
              Authenticates skills via structured assessment data.
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
        <div className="absolute top-[22%] left-[9%]">
          <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
            w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
            bg-neutral-950  flex items-center justify-center shadow-md">
            <FiUsers className="text-yellow-500 text-3xl" />
          </div>
          <div className="w-[300px] bg-white border-2 border-black rounded-2xl 
            p-4 shadow-md text-center card-hover">
            <h3 className="text-lg font-bold">Enterprise APIs</h3>
            <p className="text-sm text-gray-600">
              Integrate and scale across locations and departments.
            </p>
          </div>
        </div>
        <svg
          className="absolute left-[380px] top-[260px] delay-2"
          style={{ ["--path-length" as any]: 320 }}
          width="254"
          height="48"
          viewBox="0 0 254 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M253.5 47.427L253.5 33.9571C253.5 25.6729 246.784 18.9572 
               238.5 18.9571L15.5 18.9567C7.21571 18.9567 0.5 12.241 0.5 3.95672L0.5 0"
            className="animated-draw"
          />
        </svg>

        {/* === Top Right === */}
        <div className="absolute top-[22%] right-[9%]">
          <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
            w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
            bg-neutral-950  flex items-center justify-center shadow-md">
            <FiTrendingUp className="text-yellow-500 text-3xl" />
          </div>
          <div className="w-[300px] bg-white border-2 border-black rounded-2xl 
            p-4 shadow-md text-center card-hover">
            <h3 className="text-lg font-bold">Digital Badging & Certificates</h3>
            <p className="text-sm text-gray-600">
              Tamper-proof and shareable proof of competence.
            </p>
          </div>
        </div>
        <svg
          className="absolute right-[370px] top-[260px] scale-x-[-1] delay-3"
          style={{ ["--path-length" as any]: 320 }}
          width="254"
          height="48"
          viewBox="0 0 254 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M253.5 47.427L253.5 33.9571C253.5 25.6729 246.784 18.9572 
               238.5 18.9571L15.5 18.9567C7.21571 18.9567 0.5 12.241 0.5 3.95672L0.5 0"
            className="animated-draw"
          />
        </svg>

        {/* === Bottom Left === */}
        <div className="absolute bottom-[20%] left-[9%]">
          <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
            w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
             bg-neutral-950  flex items-center justify-center shadow-md">
            <FiShield className="text-yellow-500 text-3xl" />
          </div>
          <div className="w-[300px] bg-white border-2 border-black rounded-2xl 
            p-4 shadow-md text-center card-hover">
            <h3 className="text-lg font-bold">Competency Mapping</h3>
            <p className="text-sm text-gray-600">
              Align internal frameworks with industry standards.
            </p>
          </div>
        </div>
        <svg
          className="absolute left-[380px] bottom-[243px] delay-4"
          style={{ ["--path-length" as any]: 400 }}
          width="255"
          height="67"
          viewBox="0 0 255 67"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M254.105 0.0198917L254.417 7.83847C254.757 16.3506 
               247.948 23.4366 239.429 23.4366L15.5 23.4366C7.2157 
               23.4366 0.5 30.1524 0.5 38.4366L0.5 66.1697"
            className="animated-draw"
          />
        </svg>

        {/* === Bottom Right === */}
        <div className="absolute bottom-[21%] right-[9%]">
          <div className="-mb-2">
            <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 
              w-[60px] h-[60px] rounded-xl bg-gradient-to-tr 
               bg-neutral-950  flex items-center justify-center shadow-md">
              <FiGitBranch className="text-yellow-500 text-2xl" />
            </div>
            <div className="w-[300px] bg-white border-2 border-black rounded-2xl 
              p-4 shadow-md text-center card-hover">
              <h3 className="text-lg font-bold">Analytics Dashboard</h3>
              <p className="text-sm text-gray-600">
                Visualize training ROI and identify skill gaps.
              </p>
            </div>
          </div>
        </div>
        <svg
          className="absolute right-[370px] bottom-[243px] scale-x-[-1] delay-5"
          style={{ ["--path-length" as any]: 400 }}
          width="255"
          height="67"
          viewBox="0 0 255 67"
          xmlns="http://www.w3.org/2000/svg"
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
      icon: <FiGitBranch className="text-yellow-500text-2xl" />,
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
