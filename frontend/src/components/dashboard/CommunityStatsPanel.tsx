import { Eye, ThumbsUp, Star, MessageSquare } from "lucide-react"

// CommunityStatsPanel.tsx

interface CommunityStatsPanelProps {
  posts_count: number
  total_likes: number
  exp?: number
}

export default function CommunityStatsPanel({ posts_count, total_likes, exp = 0 }: CommunityStatsPanelProps) {
  return (
    <div className="text-black rounded-xl p-4 w-full">
      <h2 className="text-lg font-bold mb-4">Community Status</h2>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-black">EXP</span>
        <div className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border-gray-300">
          <span className="text-black">L{Math.floor(exp / 100) + 1}</span>
        </div>
      </div>

      <div className="h-1 bg-gray-700 rounded-full mb-2">
        <div
          className="h-1 bg-blue-400 rounded-full"
          style={{ width: `${Math.min((exp % 100) + 1, 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-400 mb-4">{exp % 100} / 100</div>

      <div className="space-y-3 text-sm">
        <div>
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-green-400" />
            <span>Likes</span>
            <span className="ml-auto">{total_likes}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-yellow-400" />
            <span>Posts</span>
            <span className="ml-auto">{posts_count}</span>
          </div>
        </div>
      </div>
    </div>
  )
}