import { Question } from '../types';

export const testQuestions: Question[] = [
  {
    id: 1,
    section: "Section A: Multiple Choice Questions (MCQs) [30 Marks]",
    marks: 3,
    text: "Which of the following chemicals is commonly found in lithium-ion battery cathodes?",
    options: [
      "Sodium chloride",
      "Lithium cobalt oxide",
      "Potassium permanganate",
      "Magnesium sulfate"
    ]
  },
  {
    id: 2,
    marks: 3,
    text: "What is the primary hazard associated with lithium-ion battery electrolyte?",
    options: [
      "Corrosivity",
      "Flammability",
      "Radioactivity",
      "Toxicity"
    ]
  },
  {
    id: 3,
    marks: 3,
    text: "Which regulatory body oversees workplace chemical safety compliance in the U.S.?",
    options: [
      "EPA",
      "OSHA",
      "BIS",
      "NIOSH"
    ]
  },
  {
    id: 4,
    marks: 3,
    text: "Which of the following is an effective risk mitigation strategy in chemical handling?",
    options: [
      "Storing all chemicals together",
      "Wearing PPE and following SDS guidelines",
      "Keeping chemicals near open flames",
      "Disposing of chemical waste in open drains"
    ]
  },
  {
    id: 5,
    marks: 3,
    text: "What is the purpose of a Safety Data Sheet (SDS)?",
    options: [
      "To promote a chemical product",
      "To provide safety guidelines for handling chemicals",
      "To list the pricing of chemicals",
      "To describe customer reviews"
    ]
  },
  {
    id: 6,
    marks: 3,
    text: "Which PPE is most suitable when handling corrosive battery chemicals?",
    options: [
      "Cotton gloves",
      "Nitrile gloves",
      "Woolen gloves",
      "Leather gloves"
    ]
  },
  {
    id: 7,
    marks: 3,
    text: "What should be done in case of a chemical spill in a battery production facility?",
    options: [
      "Evacuate and neutralize the spill using recommended methods",
      "Use water to dilute the spill",
      "Cover the spill with plastic sheets",
      "Leave it to evaporate naturally"
    ]
  },
  {
    id: 8,
    marks: 3,
    text: "Which of the following is an AI application in chemical safety?",
    options: [
      "Predicting hazardous chemical reactions",
      "Automating chemical mixing processes",
      "Enhancing battery charging speed",
      "Increasing chemical storage capacity"
    ]
  },
  {
    id: 9,
    marks: 3,
    text: "Which of the following is a common environmental hazard of battery disposal?",
    options: [
      "Air pollution",
      "Heavy metal contamination of soil and water",
      "Increased oxygen levels",
      "Increased plant growth"
    ]
  },
  {
    id: 10,
    marks: 3,
    text: "What is the main advantage of a closed-loop battery recycling system?",
    options: [
      "Eliminates the need for mining raw materials",
      "Reduces energy efficiency",
      "Increases waste generation",
      "Produces more toxic byproducts"
    ]
  },
  {
    id: 11,
    section: "Section B: Scenario-Based Questions (MCQs) [25 Marks]",
    marks: 5,
    text: "Chemical Spill Response Scenario: You are working in a battery manufacturing plant when a worker accidentally spills nickel sulfate on the floor. The worker is not wearing gloves and some of the liquid comes in contact with their skin. What immediate actions should be taken?",
    options: [
      "Ask the worker to continue working and wipe off the spill later",
      "Instruct the worker to wash the affected skin with water and remove contaminated clothing",
      "Use a dry cloth to wipe the spill and continue operations",
      "Wait for the chemical to dry and then sweep it off the floor"
    ]
  },
  {
    id: 12,
    marks: 5,
    text: "Chemical Spill Response Scenario (continued): How should the spill be cleaned up?",
    options: [
      "Use an appropriate chemical neutralizer and dispose of the spill as per hazardous waste guidelines",
      "Mop the area with plain water and leave it to air dry",
      "Allow the chemical to evaporate naturally",
      "Cover the spill with plastic sheets to prevent spreading"
    ]
  },
  {
    id: 13,
    marks: 5,
    text: "Storage Hazard Scenario: A new employee in your plant stores lithium metal powder near an open water source. What are the potential risks of this mistake?",
    options: [
      "Lithium reacts with water, producing hydrogen gas, which can ignite",
      "Lithium will dissolve in water, making it easier to store",
      "The presence of water will make lithium more stable",
      "There is no risk in storing lithium near water"
    ]
  },
  {
    id: 14,
    marks: 5,
    text: "Storage Hazard Scenario (continued): Suggest a safer method for storing lithium metal powder.",
    options: [
      "Store lithium in an inert environment, such as in sealed, dry, and airtight containers",
      "Keep lithium submerged in water to prevent air exposure",
      "Store lithium in open shelves away from chemicals",
      "Wrap lithium powder in plastic bags for easy handling"
    ]
  },
  {
    id: 15,
    marks: 5,
    text: "Battery Recycling Process Issue: A local battery collection center reports that many used batteries arrive with leaks. Workers complain about skin irritation after handling them. Identify two potential causes of this issue.",
    options: [
      "The batteries are being crushed during disposal, leading to leaks",
      "Workers are using protective gloves, but the gloves are chemically resistant",
      "The batteries are too old and have degraded over time, leading to leaks",
      "The batteries are stored in climate-controlled conditions to prevent leakage"
    ]
  },
  {
    id: 16,
    marks: 5,
    text: "Battery Recycling Process Issue (continued): Recommend two precautionary measures the center should implement.",
    options: [
      "Provide workers with acid-resistant gloves and proper PPE",
      "Dispose of batteries by burning them to eliminate leaks",
      "Store used batteries in a sealed, non-reactive container before handling",
      "Encourage employees to handle batteries with bare hands to test reactivity"
    ]
  },
  {
    id: 17,
    marks: 5,
    text: "Fire Incident in a Battery Warehouse: A fire breaks out in a storage unit containing used lithium-ion batteries. Firefighters initially try using water to extinguish it but realize it's ineffective. Why is water not suitable for extinguishing lithium-ion battery fires?",
    options: [
      "Water reacts with lithium, generating flammable hydrogen gas",
      "Water is the best way to put out a lithium fire, but it takes longer",
      "Lithium-ion fires can only be put out with dry sand",
      "Water cools the fire but does not suppress it completely"
    ]
  },
  {
    id: 18,
    marks: 5,
    text: "Fire Incident in a Battery Warehouse (continued): What alternative methods should be used?",
    options: [
      "Use a Class D fire extinguisher or dry sand to suffocate the fire",
      "Spray foam-based fire extinguishers directly on the batteries",
      "Let the fire burn out naturally",
      "Apply ice to the batteries to reduce temperature"
    ]
  },
  {
    id: 19,
    marks: 5,
    text: "AI in Chemical Safety Monitoring: Your battery plant is integrating AI-powered safety monitoring for chemical storage. List two benefits of using AI in monitoring hazardous chemicals.",
    options: [
      "AI can provide real-time monitoring and early detection of hazardous leaks",
      "AI increases the storage capacity of chemicals",
      "AI reduces human intervention and prevents exposure risks",
      "AI eliminates the need for any safety regulations"
    ]
  },
  {
    id: 20,
    marks: 5,
    text: "AI in Chemical Safety Monitoring (continued): Describe how AI can predict safety risks before incidents occur.",
    options: [
      "AI uses predictive analytics to assess temperature, pressure, and chemical exposure",
      "AI detects color changes in chemicals before they become hazardous",
      "AI directly controls all plant operations without human intervention",
      "AI replaces the need for human safety officers"
    ]
  },
  {
    id: 21,
    section: "Section C: Case Study Analysis (MCQs) [20 Marks]",
    marks: 10,
    text: "Case Study 1: Regulatory Compliance Audit - A recent audit at a battery recycling plant found multiple safety violations, including: lack of proper ventilation in chemical storage areas, workers not wearing PPE, and no emergency response drills conducted in the past year. Identify the three major risks from these violations.",
    options: [
      "Increased risk of chemical exposure to workers",
      "Improved efficiency in battery recycling due to fewer regulations",
      "Higher chances of fire and toxic fume buildup in storage areas",
      "Reduction in operational costs due to relaxed safety protocols"
    ]
  },
  {
    id: 22,
    marks: 10,
    text: "Case Study 1 (continued): Propose three corrective measures the plant should take to ensure compliance with OSHA regulations.",
    options: [
      "Improve ventilation systems to reduce toxic gas buildup",
      "Conduct regular PPE training sessions and enforce usage",
      "Eliminate all regulatory checks to increase efficiency",
      "Implement mandatory emergency response drills and audits"
    ]
  },
  {
    id: 23,
    marks: 10,
    text: "Case Study 2: Sustainable Chemical Waste Management - A company producing EV batteries faces a challenge in disposing of hazardous chemical waste. Government authorities have warned them about improper waste disposal leading to environmental contamination. What are two major environmental consequences of improper chemical waste disposal?",
    options: [
      "Soil and groundwater contamination due to heavy metal leaching",
      "Improved crop growth in surrounding agricultural lands",
      "Increased biodiversity in local rivers due to chemical presence",
      "Air pollution caused by improper incineration of chemical waste"
    ]
  },
  {
    id: 24,
    marks: 10,
    text: "Case Study 2 (continued): Suggest two sustainable waste management strategies the company should implement.",
    options: [
      "Implement a closed-loop recycling system to recover usable materials",
      "Dispose of chemicals in regular landfills without treatment",
      "Partner with certified hazardous waste disposal firms",
      "Reduce recycling costs by mixing hazardous and non-hazardous waste"
    ]
  }
];