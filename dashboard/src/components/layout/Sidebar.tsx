'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Star,
  TrendingUp,
  Clock,
  Hash,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  section: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} />, section: 'Analytics' },
  { id: 'posts', label: 'All Posts', icon: <FileText size={20} />, section: 'Analytics' },
  { id: 'top-posts', label: 'Top Performers', icon: <Star size={20} />, section: 'Analytics' },
  { id: 'engagement', label: 'Engagement', icon: <TrendingUp size={20} />, section: 'Analytics' },
  { id: 'timing', label: 'Best Time to Post', icon: <Clock size={20} />, section: 'Insights' },
  { id: 'hashtags', label: 'Hashtag Analysis', icon: <Hash size={20} />, section: 'Insights' },
  { id: 'content', label: 'Content Analysis', icon: <MessageSquare size={20} />, section: 'Insights' },
  { id: 'ai', label: 'AI Insights', icon: <Sparkles size={20} />, section: 'Coming Soon', disabled: true },
];

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const sections = [...new Set(navItems.map(item => item.section))];

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-200 overflow-y-auto z-50">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
          LinkedIn Insights
        </h1>
        <span className="text-xs text-gray-500">Page Analytics Dashboard</span>
      </div>

      <nav className="py-4">
        {sections.map(section => (
          <div key={section} className="mb-4 px-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              {section}
            </h3>
            {navItems
              .filter(item => item.section === section)
              .map(item => (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && onViewChange(item.id)}
                  disabled={item.disabled}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    activeView === item.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
