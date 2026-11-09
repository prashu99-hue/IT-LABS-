import React from 'react';
import { UserCheck, UserPlus, Sparkles, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { User, SubjectCategory } from '../types';

interface RightSidebarProps {
  creators: User[];
  currentUserId: string;
  onFollowToggle: (userId: string) => void;
  onSelectUser: (user: User) => void;
  onSelectSubject: (subj: SubjectCategory) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  creators,
  currentUserId,
  onFollowToggle,
  onSelectUser,
  onSelectSubject,
}) => {
  const followRecommendations = creators.filter((u) => u.id !== currentUserId).slice(0, 4);

  const trendingTopics: { tag: string; count: string; subject: SubjectCategory }[] = [
    { tag: '#GenerationalZGC', count: '1.2k notes', subject: 'Java' },
    { tag: '#SelfAttentionPyTorch', count: '3.4k notes', subject: 'AI/ML' },
    { tag: '#KubernetesPDB', count: '890 notes', subject: 'Cloud Computing' },
    { tag: '#StackCanaryBufferOverflow', count: '650 notes', subject: 'Cybersecurity' },
    { tag: '#PostgreSQLIndexing', count: '1.8k notes', subject: 'DBMS' },
  ];

  return (
    <aside className="w-80 shrink-0 hidden xl:block space-y-6">
      
      {/* Featured Creators to Follow */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-slate-900 tracking-wide uppercase">
              Featured Educators
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Verified</span>
        </div>

        <div className="space-y-3">
          {followRecommendations.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No creators found yet. Be the first to share your knowledge!
            </p>
          ) : (
            followRecommendations.map((creator) => (
              <div key={creator.id} className="flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectUser(creator)}
                  className="flex items-center gap-2.5 min-w-0 text-left group"
                >
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200 group-hover:ring-blue-500 transition-all"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {creator.name}
                    </div>
                    {creator.institution && (
                      <div className="text-[11px] text-slate-500 truncate">
                        {creator.institution}
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => onFollowToggle(creator.id)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors shrink-0 flex items-center gap-1 ${
                    creator.isFollowing
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {creator.isFollowing ? (
                    <>
                      <UserCheck className="w-3 h-3" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-semibold text-slate-900 tracking-wide uppercase">
            Trending Discussion Topics
          </h3>
        </div>

        <div className="space-y-2.5">
          {trendingTopics.map((topic) => (
            <button
              key={topic.tag}
              onClick={() => onSelectSubject(topic.subject)}
              className="w-full flex items-center justify-between text-left group hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
            >
              <div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {topic.tag}
                </div>
                <div className="text-[10px] text-slate-400">
                  {topic.subject}
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {topic.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Virtual Study Labs / Community banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">
          <Calendar className="w-3.5 h-3.5" />
          Live Educator AMA
        </div>
        <h4 className="text-sm font-bold text-white mt-1">
          System Design & Distributed Consensus in Practice
        </h4>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Interactive peer review on Raft & Paxos led by Dr. Elena Vance this Thursday at 6 PM EST.
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">328 Learners Attending</span>
          <span className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer">
            Reserve Spot →
          </span>
        </div>
      </div>

    </aside>
  );
};
