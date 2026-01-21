import React from 'react';
import TopSkillsInDemand from './TopSkillsInDemand';
import { TrendingUp, Briefcase, Target } from 'lucide-react';

/**
 * Skills Dashboard Component
 * Showcases the dynamic Top Skills in Demand feature
 */
const SkillsDashboard = () => {
  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <TrendingUp className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Market Intelligence</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover the most in-demand skills in the job market. Our dynamic analysis tracks
          real-time opportunities to help you focus on the skills that matter most.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Top Skills - Main Feature */}
        <div className="lg:col-span-2">
          <TopSkillsInDemand limit={5} showHeader={true} />
        </div>

        {/* Side Panel with Info */}
        <div className="space-y-6">
          {/* How it Works */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">How It Works</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  1
                </div>
                <p>We analyze all active job opportunities in real-time</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  2
                </div>
                <p>Extract and count required skills from job postings</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  3
                </div>
                <p>Rank skills by demand frequency and percentage</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Market Insights</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Data Source</span>
                <span className="text-sm font-medium text-gray-900">Live Job Postings</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Update Frequency</span>
                <span className="text-sm font-medium text-gray-900">Real-time</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Skills Tracked</span>
                <span className="text-sm font-medium text-gray-900">All Categories</span>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Ready to Skill Up?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Use these insights to guide your learning journey and stay competitive in the job
              market.
            </p>
            <button className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200">
              Explore Learning Opportunities
            </button>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600 mb-1">Real-time</div>
            <div className="text-sm text-gray-600">Data Analysis</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600 mb-1">100%</div>
            <div className="text-sm text-gray-600">Dynamic Content</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-purple-600 mb-1">Top 5</div>
            <div className="text-sm text-gray-600">Most Demanded</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-orange-600 mb-1">Smart</div>
            <div className="text-sm text-gray-600">Recommendations</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsDashboard;
