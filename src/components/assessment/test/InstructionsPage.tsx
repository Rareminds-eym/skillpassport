import React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Camera,
  Mic,
  MonitorX,
  Clock,
  Home,
  Timer,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface InstructionsPageProps {
  onContinue: () => void;
}

const InstructionsPage: React.FC<InstructionsPageProps> = ({ onContinue }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-pattern-chemistry py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 sm:px-8 text-center">
            <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <BookOpen className="w-6 h-6" />
              Hackathon Instructions
            </h3>
            <p className="mt-2 text-blue-100">
              Please read all instructions carefully before proceeding
            </p>
          </div>

          {/* Instructions */}
          <div className="p-6 sm:p-8">
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-2 font-serif">
                  Welcome to the Hackathon!
                </h4>
                <p className="text-gray-600">
                  This hackathon will evaluate your understanding of the subject
                  matter.
                </p>
              </div>

              {/* Time Management */}
              <div className="border-l-4 border-blue-600 pl-4 py-2">
                <h4 className="font-semibold text-gray-900 mb-2 font-serif flex items-center gap-2">
                  <Timer className="w-5 h-5 text-blue-600" />
                  Time Management
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Total Duration: 15 minutes</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>First 10 minutes for answering questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Last 5 minutes reserved for review</span>
                  </li>
                  {/* <li className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>The test will automatically switch to review page after completion of 10 minutes</span>
                  </li> */}
                  {/* <ul className="ml-7 space-y-1 text-sm">
                    <li>• 30 minutes remaining (halfway point)</li>
                    <li>• 10 minutes remaining (start of review period)</li>
                  </ul> */}
                </ul>
              </div>

              {/* Quiz Format */}
              <div className="border-l-4 border-blue-600 pl-4 py-2">
                <h4 className="font-semibold text-gray-900 mb-2 font-serif">
                Hackathon Format
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Multiple choice questions with single correct answer
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      You can navigate between questions using the Next and
                      Previous buttons
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Your progress will be tracked and shown at the top
                    </span>
                  </li>
                </ul>
              </div>

              {/* Proctoring Information */}
              <div className="border-l-4 border-blue-600 pl-4 py-2">
                <h4 className="font-semibold text-gray-900 mb-2 font-serif">
                  Proctoring Information
                </h4>
                <ul className="space-y-2 text-gray-600">
                  {/* <li className="flex items-start gap-2">
                    <Camera className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Camera access is required for proctoring purposes
                      throughout the hackathon
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Mic className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Microphone access is required to monitor the hackathon
                      environment
                    </span>
                  </li> */}
                  <li className="flex items-start gap-2">
                    <MonitorX className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Switching tabs or opening other applications during the
                      hackathon is strictly prohibited
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Three violations of these rules will result in automatic
                      hackathon submission
                    </span>
                  </li>
                </ul>
              </div>

              {/* Important Notes */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-700 mb-1 font-serif">
                      Important Notes
                    </h4>
                    <ul className="space-y-1 text-yellow-700">
                      <li>
                        • The hackathon will automatically switch to review mode
                        in the last 5 minutes
                      </li>
                      <li>
                        • The hackathon will be automatically submitted when
                        time expires
                      </li>
                      <li>
                        • Complete the hackathon in one session - your progress
                        will be lost if you close the browser
                      </li>
                      <li>
                        • Switching tabs will trigger a warning and count
                        towards violations
                      </li>
                      <li>
                        • You can review and change answers before final
                        submission
                      </li>
                      <li>
                        • Use the help button if you face any technical issues
                      </li>
                      <li>
                        • Ensure stable internet connection throughout the
                        hackathon
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/dashboard")}
                className="px-8 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onContinue}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Attempt
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InstructionsPage;
