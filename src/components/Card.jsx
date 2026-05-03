import { motion } from 'framer-motion'

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function Card({
  children,
  className = '',
  interactive = false,
  delay = 0,
  ...rest
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`${interactive ? 'vcf-card-interactive' : 'vcf-card'} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
