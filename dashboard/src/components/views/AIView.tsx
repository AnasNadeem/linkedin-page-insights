'use client';

import { Sparkles } from 'lucide-react';

export function AIView() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">AI-Powered Insights</h2>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white mb-6">
        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Sparkles size={24} />
          Coming Soon
        </h3>
        <p className="opacity-90 mb-4">
          AI-powered analysis will help you understand your content performance, generate post suggestions,
          and provide personalized recommendations based on your audience behavior.
        </p>
        <button
          disabled
          className="px-4 py-2 bg-white text-indigo-600 rounded-full font-medium opacity-75 cursor-not-allowed"
        >
          Notify Me
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm opacity-60">
          <h3 className="text-base font-semibold mb-2">AI Content Suggestions</h3>
          <p className="text-sm text-gray-500">
            Get AI-generated post ideas based on your top performing content.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm opacity-60">
          <h3 className="text-base font-semibold mb-2">Sentiment Analysis</h3>
          <p className="text-sm text-gray-500">
            Understand the emotional tone of your posts and how it affects engagement.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm opacity-60">
          <h3 className="text-base font-semibold mb-2">Competitor Insights</h3>
          <p className="text-sm text-gray-500">
            Compare your performance with industry benchmarks.
          </p>
        </div>
      </div>
    </div>
  );
}
