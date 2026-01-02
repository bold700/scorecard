import { Avatar } from '@mui/material'

interface FighterAvatarProps {
  name: string
  size?: number
  color?: 'red' | 'blue'
}

export function FighterAvatar({ name, size = 64, color }: FighterAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const avatarColor = color === 'red' ? 'error.main' : color === 'blue' ? 'info.main' : 'grey.500'

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: avatarColor,
        fontSize: size * 0.4,
        fontWeight: 700,
      }}
    >
      {initials}
    </Avatar>
  )
}
