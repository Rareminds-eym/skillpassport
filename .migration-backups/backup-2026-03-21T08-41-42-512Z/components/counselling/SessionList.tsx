// Session List Component - View Past Counselling Sessions

import React from 'react';
import { CounsellingSession, CounsellingTopicType } from '../../types/counselling';
import { 
  GraduationCap, 
  Briefcase, 
  TrendingUp, 
  Heart, 
  MessageSquare,
  ChevronRight 
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SessionListProps {
  sessions: CounsellingSession[];
  onSelectSession: (session: CounsellingSession) => void;
  selectedSessionId?: string;
}

const TOPIC_CONFIG: Record<CounsellingTopicType, { icon: React.ElementType; color: string; label: string }> = {
  academic: {
    icon: GraduationCap,
    color: 'bg-blue-100 text-blue-700',
    label: 'Academic'
  },
  career: {
    icon: Briefcase,
    color: 'bg-green-100 text-green-700',
    label: 'Career'
  },
  performance: {
    icon: TrendingUp,
    color: 'bg-purple-100 text-purple-700',
    label: 'Performance'
  },
  'mental-health': {
    icon: Heart,
    color: 'bg-pink-100 text-pink-700',
    label: 'Wellbeing'
  },
  general: {
    icon: MessageSquare,
    color: 'bg-gray-100 text-gray-700',
    label: 'General'
  }
};

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  onSelectSession,
  selectedSessionId,
}) => {
  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No counselling sessions yet</p>
          <p className="text-xs mt-1">Start a new conversation to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          isSelected={session.id === selectedSessionId}
          onClick={() => onSelectSession(session)}
        />
      ))}
    </div>
  );
};

// Individual Session Card
interface SessionCardProps {
  session: CounsellingSession;
  isSelected: boolean;
  onClick: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, isSelected, onClick }) => {
  const config = TOPIC_CONFIG[session.topic];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Icon */}
            <div className={cn('p-2 rounded-lg', config.color)}>
              <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
                {session.status === 'active' && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>

              {session.student_name && (
                <p className="font-medium text-sm text-gray-900 truncate">
                  {session.student_name}
                </p>
              )}

              {session.metadata?.summary && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {session.metadata.summary}
                </p>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className={cn(
            'w-4 h-4 flex-shrink-0 ml-2',
            isSelected ? 'text-blue-500' : 'text-gray-400'
          )} />
        </div>
      </CardContent>
    </Card>
  );
};