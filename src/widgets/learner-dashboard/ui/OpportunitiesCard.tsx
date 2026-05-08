import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Calendar, Sparkles, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/shared/ui';

interface OpportunitiesCardProps {
  opportunities: any[];
  aiRecommendations?: any[];
  loading?: boolean;
}

export const OpportunitiesCard: React.FC<OpportunitiesCardProps> = ({
  opportunities,
  loading
}) => {
  const navigate = useNavigate();

  if (loading) {
    return <Card><CardContent>Loading opportunities...</CardContent></Card>;
  }

  const renderOpportunityCard = (opp: any) => {
    const isFactoryVisit = opp.employment_type === 'factory_visit';
    const isInternship = opp.employment_type === 'internship';
    const matchScore = opp.matchScore || opp.match_percentage;

    return (
      <div
        key={opp.id}
        className="p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-base font-bold text-gray-900 flex-1">{opp.company_name}</h4>
          <div className="flex items-center gap-2">
            {matchScore && (
              <Badge className="text-xs !bg-purple-100 !text-purple-700 font-semibold">
                {Math.round(matchScore)}% Match
              </Badge>
            )}
            <Badge className={`text-xs ${
              isFactoryVisit ? '!bg-blue-100 !text-blue-600' :
              isInternship ? '!bg-green-100 !text-green-600' :
              '!bg-purple-100 !text-purple-600'
            }`}>
              {isFactoryVisit ? 'Visit' : isInternship ? 'Internship' : 'Job'}
            </Badge>
          </div>
        </div>

        {matchScore && (
          <div className="flex items-center gap-1 mb-2">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span className="text-xs text-purple-600 font-medium">AI Recommended</span>
          </div>
        )}

        <div className="space-y-2 text-sm text-gray-600 mb-3">
          {!isFactoryVisit && opp.title && (
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="font-medium">{opp.title}</span>
            </div>
          )}
          {opp.sector && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>{opp.sector}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{opp.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {opp.posted_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{new Date(opp.posted_date).toLocaleDateString()}</span>
            </div>
          )}
          <span className="text-sm text-blue-600 font-medium">View Details</span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {opportunities.slice(0, 5).map(renderOpportunityCard)}
          
          <div className="text-center pt-2">
            <Button
              onClick={() => navigate('/learner/opportunities')}
              variant="outline"
              size="sm"
            >
              View All Opportunities
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
