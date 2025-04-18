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
import { useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from 'react-toastify';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export default function UserProfile() {
  // const [jobRecords, setJobRecords] = useState<any[]>([])
  const [groupedRecords, setGroupedRecords] = useState<any[]>([])
  const [selectedTimeline, setSelectedTimeline] = useState<any[] | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState("")
  const [userInfo, setUserInfo] = useState<any>(null)
  const [jobRecords, setJobRecords] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"followers" | "following" | null>(null);
  const [followList, setFollowList] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);



  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const token = sessionStorage.getItem("token");
    const formData = new FormData();
    formData.append("avatar", selectedFile);

    try {
      const res = await fetch(`${backendUrl}/users/upload_avatar/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      toast("Upload success");
      setIsDialogOpen(false);
    } catch (err) {
      toast("Upload failed");
      console.error(err);
    }
  };


  type PieData = {
    name: string;
    value: number;
    isPlaceholder?: boolean;
  };
  
  function preprocessPieData(data: PieData[]): PieData[] {
    const total = data.reduce((sum, item) => sum + item.value, 0);
  
    if (total === 0) {
      return [{ name: "No Data", value: 1, isPlaceholder: true }];
    }
  
    return data;
  }
  
  
  const { id } = useParams();
  const isSelf = useMemo(() => {
    if (!currentUser || !userInfo?.user) return false;
    return !id || String(currentUser.id) === String(userInfo.user.id);
  }, [id, currentUser, userInfo]);  
  const jobData = preprocessPieData(userInfo?.job_status || []);
  const codeData = preprocessPieData(userInfo?.coding_status || []);


  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${backendUrl}/users/me/`, {
        headers: { Authorization: `Token ${token}` },
      });

      const data = await res.json();
      setCurrentUser(data.user);
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser || !id) return;
  
    const fetchFollowStatus = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;
  
      const res = await fetch(`${backendUrl}/users/${id}/followers/`, {
        headers: { Authorization: `Token ${token}` },
      });
  
      const followers: { user: { id: number } }[] = await res.json();
      const currentUserId = currentUser.id;

      setIsFollowing(followers.some((f) => f.user.id === currentUserId));

    };
  
    if (!isSelf) {
      fetchFollowStatus();
    }
  }, [id, currentUser, isSelf]);
  

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;
  
      const url = id
        ? `${backendUrl}/users/${id}/`
        : `${backendUrl}/users/me/`;
  
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
  
        const text = await response.text();

        if (!response.ok) {
          console.error(`❌ Fetch failed: ${response.status}`, text);
          throw new Error(`Server error ${response.status}`);
        }

        const data = JSON.parse(text);
        setUserInfo(data);
        setJobRecords(data?.job_records || []);

        console.log("✅ userInfo:", data);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
  
    fetchUserInfo();
  }, [id]);

  useEffect(() => {
    const groupPosts = () => {
      const map = new Map()
      jobRecords.forEach((post:any) => {
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

  const fetchFollowList = async (type: "followers" | "following") => {
    if (!userInfo?.user?.id) return;
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${backendUrl}/users/${userInfo.user.id}/${type}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    const data = await res.json();
    setFollowList(data);
    setDialogType(type);
  };
  
  const handleFollowToggle = async () => {
    if (!userInfo) return;
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return;
  
      const response = await fetch(
        `${backendUrl}/users/${id}/follow/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        }
      );
      if (response.ok) {
        const newFollowStatus = !isFollowing;
        setIsFollowing(newFollowStatus);
        setUserInfo((prev:any) => prev ? {
          ...prev,
          followers_count: prev.followers_count + (newFollowStatus ? 1 : -1)
        } : prev);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };
  

  // const handleRowClick = async (record: any) => {
  //   try {
  //     const response = await fetch(`${backendUrl}/api/posts/my_posts/?post_type=interview&company=${record.company}&position=${record.position}`, {
  //       headers: {
  //         Authorization: `Token ${sessionStorage.getItem("token")}`,
  //       },
  //     })
  //     const data = await response.json()
  //     const timeline = data.results
  //       .sort((a: any, b: any) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime())
  //       .map((item: any) => ({
  //         label: item.title,
  //         date: item.interview_date,
  //         id: item.id,
  //       }))
  //     setSelectedTimeline(timeline)
  //   } catch (error) {
  //     console.error("Error fetching timeline data:", error)
  //   }
  // }

  const handleRowClick = async (record: any) => {
    try {
      const token = sessionStorage.getItem("token");
       if (!token) return;
 
       const userId = userInfo?.user?.id; // 💡 当前主页对应的用户 ID
 
       const response = await fetch(
         `${backendUrl}/users/user_timeline/?company=${record.company}&position=${record.position}&user_id=${userId}`,
         {
           headers: {
             Authorization: `Token ${token}`,
           },
         }
       );
 
       const data = await response.json();
       console.log("Get data: ", data)
 
       const timeline = data
         .sort((a: any, b: any) =>
           new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime()
         )
         .map((item: any) => ({
           label: item.title,
           date: item.interview_date,
           id: item.id,
          }));
 
          setSelectedTimeline(timeline);
        } catch (error) {
          console.error("Error fetching timeline data:", error);
        }
      };
      

  // Dummy data for other charts
  const heatmapData = useMemo(() => {
    return userInfo?.commit_records ?? []
  }, [userInfo])
  
  
  type CustomLabelProps = {
    percent: number;
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    payload: PieData;
  };
  
  const customLabel = ({
    percent,
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    payload,
  }: CustomLabelProps) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    if (payload?.isPlaceholder) return null;
  
    return (
      <text
        x={x}
        y={y}
        fill="#444"
        fontSize={12}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  

  const jobColors = ["#8884d8", "#ffc658", "#82ca9d"]
  const codeColors = ["#7BB662", "#FFD301", "#E03C32"]
  const colorMap: Record<string, string> = {
    "Application": "#8884d8",           
    "Online Assessment": "#ffc658",
    "Technical Interview": "#82ca9d",
    "Behavioral Interview": "#FF8042",
    "System Design": "#00C49F",
    "HR Interview": "#FFBB28",
    "Team Match": "#FF6666",
  };
  
    const roundTypeMap: Record<number, string> = {
    0: "Application",
    1: "Online Assessment",
    2: "Technical Interview",
    3: "Behavioral Interview",
    4: "System Design",
    5: "HR Interview",
    6: "Team Match",
  };
  

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="h-52 flex flex-col items-center justify-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Avatar className="w-16 h-16 cursor-pointer hover:opacity-80 transition">
                    <AvatarImage src={userInfo?.avatar || ""} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Avatar</DialogTitle>
                  </DialogHeader>

                  <div className="flex flex-col items-center gap-4">
                    {selectedFile ? (
                      <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}

                    <Input type="file" accept="image/*" onChange={handleFileChange} />
                    <Button onClick={handleUpload}>Upload</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="mt-2 font-semibold">
                {userInfo?.user?.username || "Unknown"}
              </div>
              {isSelf ? (
                <div className="flex justify-center items-center gap-6 text-center text-white py-4 rounded-md">
                  <div onClick={() => fetchFollowList("following")} className="cursor-pointer">
                    <div className="text-sm text-gray-400">Following</div>
                    <div className="text-lg font-semibold text-gray-400">{userInfo?.following_count ?? 0}</div>
                  </div>
                  <div className="h-6 w-px bg-gray-600" />
                  <div onClick={() => fetchFollowList("followers")} className="cursor-pointer">
                    <div className="text-sm text-gray-400">Followers</div>
                    <div className="text-lg font-semibold text-gray-400">{userInfo?.followers_count ?? 0}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <Button
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
            <CommunityStatsPanel
              posts_count={userInfo?.posts_count ?? 0}
              total_likes={userInfo?.likes_count ?? 0}
              exp={userInfo?.exp ?? 0}
            />

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
                    // label={({ name, value }) => (name && value > 0 ? `${name}: ${value}` : "")}
                    label={customLabel}
                    labelLine={false}
                  >
                    {jobData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isPlaceholder
                            ? "#eee" 
                            : colorMap[entry.name] || jobColors[index % jobColors.length]
                        }
                      />
                    ))}
                  </Pie>
                  {jobData.length === 1 && jobData[0].isPlaceholder && (
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#999"
                      fontSize={14}
                    >
                      No Data
                    </text>
                  )}

                  <Tooltip/>

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
                    // label={({ name, value }) => (name != "No Data" && value > 0 ? `${name}: ${value}` : "")}
                    label={customLabel}
                    labelLine={false}
                  >
                    {codeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isPlaceholder ? "#eee" : codeColors[index % jobColors.length]}
                      />
                    ))}
                  </Pie>

                  {codeData.length === 1 && codeData[0].isPlaceholder && (
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#999"
                      fontSize={14}
                    >
                      No Data
                    </text>
                  )}

                  <Tooltip/>
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
                    <td className="px-4 py-2 text-left">
                      {roundTypeMap[record.interview_details?.round_number] || "N/A"}
                    </td>
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
      <Dialog open={dialogType !== null} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogType === "followers" ? "Followers" : "Following"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {followList.map(user => (
              <div key={user.user.id} className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar || "/default-avatar.png"} alt={user.user.username} />
                  <AvatarFallback>{user.user.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button
                  variant="link"
                  className="text-sm px-0"
                  onClick={() => {
                    setDialogType(null);
                    window.location.href = `/users/${user.user.id}`;
                  }}
                >
                  {user.user.username}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}