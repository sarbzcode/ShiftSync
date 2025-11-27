import Svg, { Circle, Path } from 'react-native-svg'
import { colors } from '../theme/colors'

type Slice = {
  value: number
  color: string
  label?: string
}

type Props = {
  size?: number
  strokeWidth?: number
  slices: Slice[]
  variant?: 'donut' | 'pie'
}

export default function DonutChart({ size = 140, strokeWidth = 18, slices, variant = 'donut' }: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  if (total <= 0) {
    return (
      <Svg width={size} height={size}>
        <Circle
          stroke={colors.border}
          fill={variant === 'pie' ? colors.surfaceLight : 'none'}
          cx={size / 2}
          cy={size / 2}
          r={variant === 'pie' ? size / 2 : radius}
          strokeWidth={variant === 'pie' ? 0 : strokeWidth}
        />
      </Svg>
    )
  }

  if (variant === 'pie') {
    const center = size / 2
    let startAngle = -Math.PI / 2 // start at top
    const paths = slices.map((slice, idx) => {
      const angle = (slice.value / total) * Math.PI * 2
      const endAngle = startAngle + angle

      const x1 = center + center * Math.cos(startAngle)
      const y1 = center + center * Math.sin(startAngle)
      const x2 = center + center * Math.cos(endAngle)
      const y2 = center + center * Math.sin(endAngle)
      const largeArc = angle > Math.PI ? 1 : 0

      const d = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${center} ${center} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ')

      startAngle = endAngle
      return <Path key={idx} d={d} fill={slice.color} />
    })

    return <Svg width={size} height={size}>{paths}</Svg>
  }

  let offset = 0

  return (
    <Svg width={size} height={size}>
      <Circle
        stroke={colors.border}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      {slices.map((slice, index) => {
        const percentage = total === 0 ? 0 : slice.value / total
        const strokeDasharray = `${circumference * percentage} ${circumference}`
        const strokeDashoffset = circumference * (1 - offset - percentage)
        offset += percentage

        return (
          <Circle
            key={index}
            stroke={slice.color}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        )
      })}
    </Svg>
  )
}
