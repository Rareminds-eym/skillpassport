import { Workflow } from "lucide-react";
import step1 from "../../assets/images/StepProcess/Step1.webp";
import step2 from "../../assets/images/StepProcess/Step2.webp";
import step3 from "../../assets/images/StepProcess/Step3.webp";
import step4 from "../../assets/images/StepProcess/Step4.webp";

const StepBlock = ({
  title,
  desc,
  img,
  reverse = false,
}: {
  title: string;
  desc: string;
  img: string;
  reverse?: boolean;
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-12 items-center">
      {/* Image */}
      {reverse ? (
        <div className="flex justify-center md:order-1">
          <img
            src={img}
            alt={title}
            className="w-full max-w-md object-contain drop-shadow-md"
          />
        </div>
      ) : (
        <div className="flex justify-center md:order-2">
          <img
            src={img}
            alt={title}
            className="w-full max-w-md object-contain drop-shadow-md"
          />
        </div>
      )}

      {/* Text */}
      <div
        className={`flex flex-col items-center text-center px-4 ${
          reverse ? "md:order-2" : "md:order-1"
        }`}
      >
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#011938] mb-6">
          {title}
        </h3>
        <p className="text-gray-700 text-base md:text-lg leading-relaxed max-w-xl">
          {desc}
        </p>
      </div>
    </div>
  );
};

export default function WorkSection() {
  return (
    <section className="relative py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
         {/* Top Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#000000] rounded-2xl w-12 h-12 flex items-center justify-center shadow-md">
            <Workflow  className="text-white w-5 h-5" />
          </div>
        </div>
        {/* Heading */}
        <h2 className="text-center text-3xl md:text-4xl font-extrabold text-[#011938] mb-4">
          How Skill Passport <span className="text-[#E32A18]">Works.</span>
        </h2>
        <p className="text-center text-gray-500 text-sm md:text-base mb-16">
          The Rareminds Skill Passport transforms training outcomes into
          measurable skill intelligence through a simple yet powerful process —
          from learning to verification to employability.
        </p>

        {/* Step 1 */}
        <StepBlock
          title="Train & Assess"
          desc="Learners undergo structured training programs delivered by Rareminds or partner institutions. Each module includes industry-aligned assessments and project-based evaluations mapped to defined skill standards."
          img={step1 as unknown as string}
        />

        {/* SVG 1: Between Step 1 & 2 */}
        <div className="hidden md:flex justify-center md:-mt-10 lg:-mt-24">
          <div className="relative w-full md:max-w-sm lg:max-w-xl">
            <div style={{ paddingTop: `${(495 / 758) * 100}%` }} />
            <svg
              viewBox="0 0 758 495"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
              className="absolute top-0 left-0 w-full h-full"
            >
              <path
                d="M31.4439 59.7144C48.8099 59.7144 62.8879 46.3469 62.8879 29.8572C62.8879 13.3675 48.8099 0 31.4439 0C14.0779 0 0 13.3675 0 29.8572C0 46.3469 14.0779 59.7144 31.4439 59.7144Z"
                fill="black"
              />
              <path
                d="M34.1951 24.5455V42H30.5047V28.0483H30.4025L26.4053 30.554V27.2812L30.7263 24.5455H34.1951Z"
                fill="white"
              />
              <path
                d="M63 22.2507C87.203 10.9557 123.174 6.6091 161.12 57.3601C223.532 140.833 235.563 316.778 293.956 374.936C341.432 422.198 385.301 397.22 414.33 369.886C517.268 103.703 638.336 91.8267 701.415 291.647C707.944 312.339 715.131 337.929 722.046 370.957C729.716 407.627 734.718 442.247 738 469"
                stroke="black"
                strokeWidth="5"
                strokeMiterlimit="10"
                strokeDasharray="12 12"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M744.742 492.637C751.227 492.637 756.483 487.346 756.483 480.819C756.483 474.291 751.227 469 744.742 469C738.257 469 733 474.291 733 480.819C733 487.346 738.257 492.637 744.742 492.637Z"
                fill="white"
                stroke="black"
                strokeWidth="2.89"
                strokeMiterlimit="10"
                strokeDasharray="6.93 6.93"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>

        <div className="mt-20 md:mt-0 lg:-mt-16">
          {/* Step 2 */}
          <StepBlock
            title="Capture & Validate"
            desc="Every demonstrated skill is captured and validated through performance data, mentor reviews, and digital assessments. Rareminds' verification engine ensures each skill badge is authentic, traceable, and backed by evidence — no manual intervention or paper certificates needed."
            img={step2 as unknown as string}
            reverse
          />
        </div>

        {/* SVG 2: Between Step 2 & 3 */}
        <div className="hidden md:flex justify-center md:-mt-0 lg:-mt-20">
          <div className="relative w-full md:max-w-sm lg:max-w-xl">
            <div style={{ paddingTop: `${(491 / 756) * 100}%` }} />
            <svg
              viewBox="0 0 756 491"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
              className="absolute top-0 left-0 w-full h-full"
            >
              <path
                d="M13.7417 488.637C20.2265 488.637 25.4835 483.346 25.4835 476.819C25.4835 470.291 20.2265 465 13.7417 465C7.25696 465 2 470.291 2 476.819C2 483.346 7.25696 488.637 13.7417 488.637Z"
                fill="white"
                stroke="black"
                strokeWidth="2.89"
                strokeMiterlimit="10"
                strokeDasharray="6.93 6.93"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M693 18.2507C668.797 6.9557 632.826 2.6091 594.88 53.3601C532.468 136.833 520.437 312.778 462.044 370.936C414.568 418.198 370.699 393.22 341.67 365.886C238.732 99.7033 117.664 87.8267 54.5854 287.647C48.0564 308.339 40.8692 333.929 33.954 366.957C26.2841 403.627 21.2821 438.247 18 465"
                stroke="black"
                strokeWidth="5"
                strokeMiterlimit="10"
                strokeDasharray="12 12"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M724.444 59.7144C741.81 59.7144 755.888 46.3469 755.888 29.8572C755.888 13.3675 741.81 0 724.444 0C707.078 0 693 13.3675 693 29.8572C693 46.3469 707.078 59.7144 724.444 59.7144Z"
                fill="black"
              />
              <path
                d="M718.742 41.7168V39.0577L724.955 33.3049C725.483 32.7935 725.927 32.3333 726.285 31.9242C726.648 31.5151 726.924 31.1145 727.111 30.7225C727.299 30.3248 727.393 29.8958 727.393 29.4355C727.393 28.9242 727.276 28.4838 727.043 28.1145C726.81 27.7395 726.492 27.4526 726.089 27.2537C725.685 27.0492 725.228 26.9469 724.716 26.9469C724.182 26.9469 723.716 27.0549 723.319 27.2708C722.921 27.4867 722.614 27.7963 722.398 28.1998C722.182 28.6032 722.074 29.0833 722.074 29.6401H718.572C718.572 28.498 718.83 27.5066 719.347 26.6657C719.864 25.8248 720.589 25.1742 721.52 24.714C722.452 24.2537 723.526 24.0236 724.742 24.0236C725.992 24.0236 727.08 24.2452 728.006 24.6884C728.938 25.1259 729.662 25.7338 730.179 26.5123C730.697 27.2907 730.955 28.1827 730.955 29.1884C730.955 29.8475 730.824 30.498 730.563 31.1401C730.307 31.7821 729.85 32.4952 729.191 33.2793C728.532 34.0577 727.603 34.9924 726.404 36.0833L723.856 38.5804V38.6998H731.185V41.7168H718.742Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        <div className="mt-20 md:mt-0 lg:-mt-16 mb-8">
          {/* Step 3 */}
          <StepBlock
            title="Issue The Skill Passport"
            desc="Once validated, each learner receives a digital Skill Passport — a dynamic portfolio of verified skills, competencies, and projects. This Passport becomes proof of capability, accessible anytime, anywhere — for hiring, internship, or advancement."
            img={step3 as unknown as string}
          />
        </div>

        {/* SVG 3: Between Step 3 & 4 */}
        <div className="hidden md:flex justify-center md:-mt-4 lg:-mt-28">
          <div className="relative w-full md:max-w-sm lg:max-w-xl">
            <div style={{ paddingTop: `${(486 / 751) * 100}%` }} />
            <svg
              viewBox="0 0 751 486"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
              className="absolute top-0 left-0 w-full h-full"
            >
              <path
                d="M737.742 483.637C744.227 483.637 749.483 478.346 749.483 471.819C749.483 465.291 744.227 460 737.742 460C731.257 460 726 465.291 726 471.819C726 478.346 731.257 483.637 737.742 483.637Z"
                fill="white"
                stroke="black"
                strokeWidth="2.89"
                strokeMiterlimit="10"
                strokeDasharray="6.93 6.93"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M63 13.2507C87.203 1.9557 123.174 -2.3909 161.12 48.3601C223.532 131.833 235.563 307.778 293.956 365.936C341.432 413.198 385.301 388.22 414.33 360.886C517.268 94.7033 638.336 82.8267 701.415 282.647C707.944 303.339 715.131 328.929 722.046 361.957C729.716 398.627 734.718 433.247 738 460"
                stroke="black"
                strokeWidth="5"
                strokeMiterlimit="10"
                strokeDasharray="12 12"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M31.4439 59.7144C48.8099 59.7144 62.8879 46.3469 62.8879 29.8572C62.8879 13.3675 48.8099 0 31.4439 0C14.0779 0 0 13.3675 0 29.8572C0 46.3469 14.0779 59.7144 31.4439 59.7144Z"
                fill="black"
              />
              <path
                d="M31.8421 41.9554C30.5694 41.9554 29.4359 41.7367 28.4415 41.2992C27.4529 40.856 26.6716 40.248 26.0978 39.4753C25.5296 38.6969 25.237 37.7992 25.2199 36.7821H28.9359C28.9586 37.2083 29.0978 37.5833 29.3535 37.9071C29.6148 38.2253 29.9614 38.4725 30.3932 38.6486C30.8251 38.8248 31.3109 38.9128 31.8506 38.9128C32.4131 38.9128 32.9103 38.8134 33.3421 38.6145C33.7739 38.4157 34.112 38.1401 34.3563 37.7878C34.6006 37.4355 34.7228 37.0293 34.7228 36.5691C34.7228 36.1032 34.5921 35.6912 34.3307 35.3333C34.0751 34.9696 33.7057 34.6855 33.2228 34.481C32.7455 34.2765 32.1773 34.1742 31.5182 34.1742H29.8904V31.464H31.5182C32.0751 31.464 32.5665 31.3674 32.9927 31.1742C33.4245 30.981 33.7597 30.714 33.9984 30.373C34.237 30.0265 34.3563 29.623 34.3563 29.1628C34.3563 28.7253 34.2512 28.3418 34.041 28.0123C33.8364 27.677 33.5466 27.4157 33.1716 27.2282C32.8023 27.0407 32.3705 26.9469 31.8762 26.9469C31.3762 26.9469 30.9188 27.0378 30.504 27.2196C30.0893 27.3958 29.7569 27.6486 29.5069 27.9782C29.2569 28.3077 29.1234 28.6941 29.1063 29.1373H25.5694C25.5864 28.1316 25.8734 27.2452 26.4302 26.4782C26.987 25.7111 27.737 25.1117 28.6802 24.6799C29.629 24.2424 30.7001 24.0236 31.8932 24.0236C33.0978 24.0236 34.1518 24.2424 35.0552 24.6799C35.9586 25.1174 36.6603 25.7083 37.1603 26.4526C37.666 27.1912 37.916 28.0208 37.9103 28.9412C37.916 29.9185 37.612 30.7338 36.9984 31.3873C36.3904 32.0407 35.5978 32.4554 34.6205 32.6316V32.7679C35.9046 32.9327 36.8819 33.3787 37.5523 34.106C38.2285 34.8276 38.5637 35.731 38.558 36.8162C38.5637 37.8105 38.2768 38.6941 37.6972 39.4668C37.1234 40.2395 36.3307 40.8475 35.3194 41.2907C34.308 41.7338 33.1489 41.9554 31.8421 41.9554Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        <div className="mt-20 md:mt-0 lg:-mt-16">
          {/* Step 4 */}
          <StepBlock
            title="Analyze & Apply"
            desc="Organizations get access to real-time dashboards showing skill gaps, strengths, and team readiness. Use this intelligence to measure training ROI, optimize workforce planning, and align learning outcomes with business goals."
            img={step4 as unknown as string}
            reverse
          />
        </div>

        {/* SVG 4: After Step 4 */}
        <div className="justify-end hidden md:flex sm:-mt-0 md:-mt-0 lg:-mt-24">
          <div className="relative w-full max-w-[63px] md:max-w-[40px] lg:max-w-[50px] mr-56 md:mr-36 lg:mr-[12rem] xl:mr-56">
            <div style={{ paddingTop: `${(60 / 63) * 100}%` }} />
            <svg
              viewBox="0 0 63 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
              className="absolute top-0 left-0 w-full h-full"
            >
              <path
                d="M31.4439 59.7144C48.8099 59.7144 62.8879 46.3469 62.8879 29.8572C62.8879 13.3675 48.8099 0 31.4439 0C14.0779 0 0 13.3675 0 29.8572C0 46.3469 14.0779 59.7144 31.4439 59.7144Z"
                fill="black"
              />
              <path
                d="M24.9035 38.6486V35.7424L32.1905 24.2623H34.6961V28.285H33.2132L28.6194 35.5549V35.6912H38.9746V38.6486H24.9035ZM33.2814 41.7168V37.7623L33.3496 36.4753V24.2623H36.8098V41.7168H33.2814Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-black/80 italic tracking-tight mt-16 lg:mt-36 text-sm md:text-base">
          From training to transformation — Skill Passport makes every skill count.
        </p>
      </div>
    </section>
  );
}