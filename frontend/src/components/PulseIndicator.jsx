export default function PulseIndicator({ active = true, color = '#22C55E' }) {
  return (
    <span className="relative inline-flex">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {active && (
        <span
          className="absolute top-0 left-0 w-2 h-2 rounded-full animate-ping"
          style={{ backgroundColor: color, opacity: 0.5 }}
        />
      )}
    </span>
  )
}
