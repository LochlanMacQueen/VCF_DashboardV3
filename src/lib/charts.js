// Centralized Chart.js registration so we only do it once.
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  BarElement
)

ChartJS.defaults.font.family =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
ChartJS.defaults.color = '#475569'
ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.92)'
ChartJS.defaults.plugins.tooltip.padding = 10
ChartJS.defaults.plugins.tooltip.cornerRadius = 8
ChartJS.defaults.plugins.legend.labels.usePointStyle = true
ChartJS.defaults.plugins.legend.labels.pointStyle = 'circle'

export const SECTOR_PALETTE = [
  '#002952',
  '#1f4e79',
  '#4a90e2',
  '#7fb3ff',
  '#cfe3ff',
  '#9bbad9',
  '#003d7a',
  '#2a5f8f',
  '#5c9ce6',
  '#8fc4ff',
]
