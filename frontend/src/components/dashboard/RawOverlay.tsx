import { motion } from "framer-motion"

interface RowOverlayProps {
  onClose: () => void
  renderRightContent?: () => React.ReactNode
}

export default function RowOverlay({ onClose, renderRightContent }: RowOverlayProps) {
  return (
    <>
      {/* 左侧短条 */}
      <motion.div
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute left-0 top-0 bottom-0 w-1/10 bg-gray-800 z-20 cursor-pointer rounded-r"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.2 }}
      />

      {/* 右侧长条 */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-9/10 bg-gray-200 z-10 rounded-l px-4 py-2"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.2 }}
      >
        {renderRightContent?.()}
      </motion.div>
    </>
  )
}
