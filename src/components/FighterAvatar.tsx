import { Avatar } from '@mui/material'

interface FighterAvatarProps {
  name: string
  size?: number
  color?: 'red' | 'blue'
  initialsOverride?: string
  bgColorOverride?: string
  textColorOverride?: string
}

export function FighterAvatar({
  name,
  size = 64,
  color,
  initialsOverride,
  bgColorOverride,
  textColorOverride,
}: FighterAvatarProps) {
  const initials =
    initialsOverride ??
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const avatarColor = bgColorOverride ?? (color === 'red' ? 'error.main' : color === 'blue' ? 'info.main' : 'grey.500')

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: avatarColor,
        color: textColorOverride ?? 'common.white',
        fontSize: size * 0.4,
        fontWeight: 700,
      }}
    >
      {initials}
    </Avatar>
  )
}
