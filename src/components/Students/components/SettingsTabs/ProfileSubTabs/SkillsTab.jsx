import React, { useState } from "react";
import { CheckCircle, Heart, Code } from "lucide-react";
import { Button } from "../../ui/button";

// Import the individual skill components
import SoftSkillsTab from "./SoftSkillsTab";
import TechnicalSkillsTab from "./TechnicalSkillsTab";

const SkillsTab = ({ 
  // Soft Skills props
  softSkillsData, 
  setShowSoftSkillsModal,
  // Technical Skills props
  technicalSkillsData, 
  setShowTechnicalSkillsModal 
}) => {
  const [activeSkillsTab, setActiveSkillsTab] = useState("soft");

  const skillsTabs = [
    { id: "soft", label: "Soft Skills", icon: Heart, count: softSkillsData?.length || 0 },
    { id: "technical", label: "Technical Skills", icon: Code, count: technicalSkillsData?.length || 0 },
  ];

  const renderActiveSkillsTab = () => {
    switch (activeSkillsTab) {
      case "soft":
        return (
          <SoftSkillsTab
            softSkillsData={softSkillsData}
            setShowSoftSkillsModal={setShowSoftSkillsModal}
          />
        );
      case "technical":
        return (
          <TechnicalSkillsTab
            technicalSkillsData={technicalSkillsData}
            setShowTechnicalSkillsModal={setShowTechnicalSkillsModal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          Skills Management
        </h3>
      </div>

      {/* Skills Sub-Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {skillsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSkillsTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSkillsTab(tab.id)}
                  className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon 
                    className={`w-4 h-4 ${
                      isActive 
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`} 
                  />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${
                      isActive
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Skills Content */}
      <div className="mt-6">
        {renderActiveSkillsTab()}
      </div>
    </div>
  );
};

export default SkillsTab;