import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { format } from "date-fns"

export interface TimelineItem {
  label: string
  date: string
  id: number
}

export default function TimelineDrawer({
  open,
  onClose,
  data,
}: {
  open: boolean
  onClose: () => void
  data: TimelineItem[]
}) {
  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="right-0 top-0 bottom-0 w-[400px] fixed bg-white border-l shadow-xl flex flex-col px-6 py-8 space-y-6">
        <DrawerHeader>
          <DrawerTitle>Timeline</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-4">
          {data.map((item, idx) => (
            <button
              key={idx}
              className="w-full text-left p-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              onClick={() => window.location.href = `/posts/${item.id}`}
            >
              {item.label} — {format(new Date(item.date), "MM/dd/yyyy")}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
