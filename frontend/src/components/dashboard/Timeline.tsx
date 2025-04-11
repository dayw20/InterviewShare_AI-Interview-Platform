import { useEffect, useRef, useState } from "react"

const timelineData = [
  { company: "TikTok", date: "2025-03-01", phases: ["Applied", "OA"] },
  { company: "Amazon", date: "2025-03-05", phases: ["Applied"] },
  { company: "Meta", date: "2025-03-10", phases: ["Applied", "Interview"] },
  { company: "Google", date: "2025-03-15", phases: ["Applied", "HR", "Offer"] },
]

export default function CurveTimeline() {
  const pathRef = useRef<SVGPathElement | null>(null)
  const [points, setPoints] = useState<{ x: number; y: number }[]>([])
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    const totalLength = path.getTotalLength()
    const spacing = totalLength / (timelineData.length - 1)

    const newPoints = timelineData.map((_, i) => {
      const pt = path.getPointAtLength(i * spacing)
      return { x: pt.x, y: pt.y }
    })

    setPoints(newPoints)
  }, [])

  const svgHeight = 900

  return (
    <div className="w-full max-h-[500px] overflow-y-auto border rounded-md p-4">
      <svg
        viewBox={`0 0 400 ${svgHeight}`}
        height={svgHeight}
        className="w-full"
        preserveAspectRatio="xMidYMin meet"
      >
        {/* S 曲线 */}
        <path
          ref={pathRef}
          d="M 50 50 C 150 100, 150 200, 50 250
             C -50 300, -50 400, 50 450
             C 150 500, 150 600, 50 650
             C -50 700, -50 800, 50 850"
          stroke="#8b5cf6"
          strokeWidth="4"
          fill="none"
        />

        {/* 节点 + 标签 */}
        {points.map((point, index) => {
          const isLeft = point.x < 200 // 判断节点位于左侧还是右侧

          return (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="8"
                fill="#8b5cf6"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
              />

              {/* 公司名称 */}
              <text
                x={isLeft ? point.x + 12 : point.x - 12}
                y={point.y - 6}
                textAnchor={isLeft ? "start" : "end"}
                className="text-base fill-gray-900 font-bold"
              >
                {timelineData[index].company}
              </text>

              {/* 日期 */}
              <text
                x={isLeft ? point.x + 12 : point.x - 12}
                y={point.y + 12}
                textAnchor={isLeft ? "start" : "end"}
                className="text-sm fill-gray-500"
              >
                {timelineData[index].date}
              </text>

              {/* Hover 展开阶段 */}
              {hoverIndex === index && (
                <foreignObject
                  x={isLeft ? point.x + 20 : point.x - 140}
                  y={point.y - 20}
                  width={120}
                  height={100}
                >
                  <div className="bg-white border rounded-md shadow-md p-2 text-sm text-gray-700 space-y-1">
                    {timelineData[index].phases.map((phase, i) => (
                      <div key={i}>• {phase}</div>
                    ))}
                  </div>
                </foreignObject>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
