import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CalendarHeatmap from "react-calendar-heatmap"
import "react-calendar-heatmap/dist/styles.css"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { subDays } from "date-fns"
import CommunityStatsPanel from "./CommunityStatsPanel"
import TimelineDrawer from "./TimelineDrawer"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export default function UserProfile() {
  const [jobRecords, setJobRecords] = useState<any[]>([])
  const [groupedRecords, setGroupedRecords] = useState<any[]>([])
  const [selectedTimeline, setSelectedTimeline] = useState<any[] | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState("")

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/posts/?post_type=interview", {
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
          },
        })
        const data = await response.json()
        setJobRecords(data.results)
      } catch (error) {
        console.error("Error fetching user posts:", error)
      }
    }

    fetchUserPosts()
  }, [])

  useEffect(() => {
    const groupPosts = () => {
      const map = new Map()
      jobRecords.forEach((post) => {
        const key = `${post.company}-${post.position}`
        if (!map.has(key)) {
          map.set(key, post)
        } else {
          const existing = map.get(key)
          const existingDate = new Date(existing.interview_date)
          const currentDate = new Date(post.interview_date)
          if (currentDate > existingDate) {
            map.set(key, post)
          }
        }
      })
      setGroupedRecords(Array.from(map.values()))
    }

    groupPosts()
  }, [jobRecords])

  const filteredRecords = useMemo(() => {
    let data = [...groupedRecords]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      data = data.filter(
        (record) =>
          record.company?.toLowerCase().includes(term) ||
          record.position?.toLowerCase().includes(term) ||
          record.interview_details?.status?.toLowerCase().includes(term)
      )
    }

    return data
  }, [searchTerm, groupedRecords])

  const handleRowClick = async (record: any) => {
    try {
      const response = await fetch(`http://localhost:8000/api/posts/?post_type=interview&company=${record.company}&position=${record.position}`, {
        headers: {
          Authorization: `Token ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      const timeline = data.results
        .sort((a: any, b: any) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime())
        .map((item: any) => ({
          label: item.title,
          date: item.interview_date,
          id: item.id,
        }))
      setSelectedTimeline(timeline)
    } catch (error) {
      console.error("Error fetching timeline data:", error)
    }
  }

  // Dummy data for other charts
  const heatmapData = Array.from({ length: 100 }).map((_, i) => ({
    date: subDays(new Date(), i).toISOString().split("T")[0],
    count: Math.floor(Math.random() * 5),
  }))

  const jobData = [
    { name: "Applied", value: 40 },
    { name: "Interview", value: 20 },
    { name: "HR", value: 1 },
  ]

  const codeData = [
    { name: "Easy", value: 20 },
    { name: "Medium", value: 60 },
    { name: "Hard", value: 10 },
  ]

  const jobColors = ["#8884d8", "#ffc658", "#82ca9d"]
  const codeColors = ["#7BB662", "#FFD301", "#E03C32"]

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="h-52 flex flex-col items-center justify-center">
              <Avatar className="w-16 h-16">
                <AvatarImage src="" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="mt-2 font-semibold">user_name</div>
              <div className="flex justify-center items-center gap-6 text-center text-white py-4 rounded-md">
                <div>
                  <div className="text-sm text-gray-400">Following</div>
                  <div className="text-lg font-semibold text-gray-400">18</div>
                </div>
                <div className="h-6 w-px bg-gray-600"></div>
                <div>
                  <div className="text-sm text-gray-400">Followed</div>
                  <div className="text-lg font-semibold text-gray-400">0</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <CommunityStatsPanel />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-3 space-y-4">
          {/* Charts */}
          <div className="grid grid-cols-3 gap-4">
            {/* Job Pie */}
            <Card>
              <CardContent className="h-52 flex flex-col items-center justify-center">
                <h2 className="text-lg font-semibold mb-2">Job Status</h2>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={jobData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={50}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {jobData.map((_, index) => (
                        <Cell key={index} fill={jobColors[index % jobColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Coding Pie */}
            <Card>
              <CardContent className="h-52 flex flex-col items-center justify-center">
                <h2 className="text-lg font-semibold mb-2">Coding Status</h2>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={codeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={50}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {codeData.map((_, index) => (
                        <Cell key={index} fill={codeColors[index % codeColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Commit Heatmap */}
            <Card>
              <CardContent className="h-52 overflow-x-auto whitespace-nowrap flex flex-col items-center justify-center">
                <h2 className="text-lg font-semibold mb-2">Commit Record</h2>
                <div className="w-full overflow-x-auto">
                  <CalendarHeatmap
                    startDate={subDays(new Date(), 100)}
                    endDate={new Date()}
                    values={heatmapData}
                    classForValue={(value) => {
                      const count = Number(value?.count || 0)
                      if (count >= 4) return "color-scale-max"
                      if (count > 0) return `color-scale-${count}`
                      return "color-empty"
                    }}
                    titleForValue={(value) => {
                      if (!value || !value.date) return ""
                      return `${value.date} - ${value.count || 0} commits`
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Records Table */}
          <Card>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Job application record</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Search by company or base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button>Search</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Filter</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterBy("interview_date")}>Interview Date</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("phase")}>Phase</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("company")}>Company</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left">Company</th>
                  <th className="px-4 py-2 text-left">Position</th>
                  <th className="px-4 py-2 text-left">Phase</th>
                  <th className="px-4 py-2 text-left">Interview Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleRowClick(record)}
                  >
                    <td className="px-4 py-2 text-left">{record.company || "N/A"}</td>
                    <td className="px-4 py-2 text-left">{record.position || "N/A"}</td>
                    <td className="px-4 py-2 text-left">{record.interview_details?.status || "N/A"}</td>
                    <td className="px-4 py-2 text-left">{record.interview_date || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>

      <TimelineDrawer open={!!selectedTimeline} onClose={() => setSelectedTimeline(null)} data={selectedTimeline ?? []} />
    </div>
  )
}
