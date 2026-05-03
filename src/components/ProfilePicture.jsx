import { getInitials } from '../lib/format'

const sizes = {
  sm: { px: 32, font: 12 },
  md: { px: 48, font: 18 },
  lg: { px: 80, font: 28 },
  xl: { px: 112, font: 38 },
}

export default function ProfilePicture({ account, size = 'md', className = '' }) {
  const { px, font } = sizes[size] || sizes.md

  if (account?.profile_picture_url) {
    return (
      <img
        src={account.profile_picture_url}
        alt={account.name || 'Profile'}
        className={`rounded-full object-cover ring-2 ring-white shadow-sm ${className}`}
        width={px}
        height={px}
        style={{ width: px, height: px }}
      />
    )
  }

  const initials = getInitials(account?.name)

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white shadow-sm bg-gradient-to-br from-vcf-500 to-vcf-700 ${className}`}
      style={{ width: px, height: px, fontSize: font }}
    >
      {initials}
    </div>
  )
}
