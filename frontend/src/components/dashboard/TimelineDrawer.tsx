import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from "@/components/ui/drawer"
import { format } from "date-fns"
import { CalendarDays, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
      <DrawerContent className="right-0 top-0 bottom-0 w-[400px] fixed border-l shadow-lg flex flex-col h-full">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="text-2xl font-semibold text-gray-800">Timeline</DrawerTitle>
          <DrawerDescription className="text-muted-foreground">View your timeline history</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-4">
            {data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No timeline items found</p>
              </div>
            ) : (
              data.map((item, idx) => (
                <Card 
                  key={idx} 
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-white"
                  onClick={() => window.location.href = `/posts/${item.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h4 className="font-medium text-gray-900">{item.label}</h4>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5 mr-1" />
                          <span>{format(new Date(item.date), "MMM dd, yyyy")}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        <ChevronRight className="h-4 w-4" />
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <DrawerFooter className="border-t p-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}