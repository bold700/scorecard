import { Box, Typography, Card, CardContent } from '@mui/material'
import { Match, Scorecard, TournamentPhase } from '../types'
import { FighterAvatar } from './FighterAvatar'
import { useNavigate } from 'react-router-dom'
import { createAggregatedScorecard } from '../lib/scorecardAggregation'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@mui/material/styles'

interface BracketVisualizationProps {
  matches: Match[]
  matchScorecards: Record<string, Scorecard[]>
  tournamentId: string
}

export function BracketVisualization({ matches, matchScorecards, tournamentId }: BracketVisualizationProps) {
  const navigate = useNavigate()
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement | null>(null)

  type RoundKey = 'kwartfinale' | 'halve_finale' | 'finale'
  type Round = { key: RoundKey; label: string; nodes: BracketNode[] }
  type BracketNode = {
    key: string
    phase: TournamentPhase
    index: number
    match?: Match
    redLabel: string
    blueLabel: string
    winnerName?: string
    score?: { red: number; blue: number }
    isPlaceholder: boolean
  }

  const getPhaseLabel = (phase: TournamentPhase): string => {
    const labels: Record<TournamentPhase, string> = {
      poule: 'Poule',
      kwartfinale: 'Kwartfinales',
      halve_finale: 'Halve Finales',
      finale: 'Finale',
      bronzen_finale: 'Bronzen Finale',
    }
    return labels[phase]
  }

  const shortPhase = (phase: TournamentPhase): string => {
    if (phase === 'kwartfinale') return 'QF'
    if (phase === 'halve_finale') return 'HF'
    if (phase === 'finale') return 'F'
    if (phase === 'bronzen_finale') return 'B'
    return 'P'
  }

  const sortedMatchesForPhase = (phase: TournamentPhase) => {
    const ms = matches.filter((m) => m.phase === phase)
    return [...ms].sort((a, b) => {
      const ap = (a as any).bracketPosition ?? 0
      const bp = (b as any).bracketPosition ?? 0
      if (ap !== bp) return ap - bp
      const ac = a.createdAt ?? 0
      const bc = b.createdAt ?? 0
      if (ac !== bc) return ac - bc
      return a.id.localeCompare(b.id)
    })
  }

  const getAggregated = (match: Match): Scorecard | undefined => {
    const scorecards = matchScorecards[match.id] || []
    return (createAggregatedScorecard(match.id, scorecards) || scorecards[0]) as any
  }

  const getWinnerName = (match: Match): string | undefined => {
    const sc = getAggregated(match)
    if (sc?.winner === 'red') return match.redFighter
    if (sc?.winner === 'blue') return match.blueFighter
    return undefined
  }

  const startRound = useMemo<RoundKey | null>(() => {
    if (matches.some((m) => m.phase === 'kwartfinale')) return 'kwartfinale'
    if (matches.some((m) => m.phase === 'halve_finale')) return 'halve_finale'
    if (matches.some((m) => m.phase === 'finale')) return 'finale'
    return null
  }, [matches])

  const rounds: Round[] = useMemo(() => {
    if (!startRound) return []

    const makeNodeFromMatch = (phase: TournamentPhase, idx: number, match: Match): BracketNode => {
      const sc = getAggregated(match)
      const winnerName = getWinnerName(match)
      return {
        key: match.id,
        phase,
        index: idx,
        match,
        redLabel: match.redFighter,
        blueLabel: match.blueFighter,
        winnerName,
        score: sc ? { red: sc.totalRed || 0, blue: sc.totalBlue || 0 } : undefined,
        isPlaceholder: false,
      }
    }

    const makePlaceholderNode = (phase: TournamentPhase, idx: number, redLabel: string, blueLabel: string): BracketNode => {
      return {
        key: `placeholder_${phase}_${idx}`,
        phase,
        index: idx,
        redLabel,
        blueLabel,
        isPlaceholder: true,
      }
    }

    const qfMatches = sortedMatchesForPhase('kwartfinale')
    const hfMatches = sortedMatchesForPhase('halve_finale')
    const fMatches = sortedMatchesForPhase('finale')

    const result: Round[] = []

    // Round: start phase
    if (startRound === 'kwartfinale') {
      const nodes = qfMatches.map((m, i) => makeNodeFromMatch('kwartfinale', i, m))
      result.push({ key: 'kwartfinale', label: getPhaseLabel('kwartfinale'), nodes })

      // Halve finales: real of placeholders op basis van kwartfinales
      const expectedHf = Math.max(hfMatches.length, Math.ceil(nodes.length / 2))
      const hfNodes: BracketNode[] = []
      for (let i = 0; i < expectedHf; i++) {
        const real = hfMatches[i]
        if (real) {
          hfNodes.push(makeNodeFromMatch('halve_finale', i, real))
        } else {
          const a = i * 2
          const b = i * 2 + 1
          const red = nodes[a] ? `Winnaar ${shortPhase('kwartfinale')}${a + 1}` : 'TBD'
          const blue = nodes[b] ? `Winnaar ${shortPhase('kwartfinale')}${b + 1}` : 'TBD'
          hfNodes.push(makePlaceholderNode('halve_finale', i, red, blue))
        }
      }
      result.push({ key: 'halve_finale', label: getPhaseLabel('halve_finale'), nodes: hfNodes })

      // Finale: real of placeholder op basis van halve finales
      const expectedF = Math.max(fMatches.length, Math.ceil(hfNodes.length / 2))
      const fNodes: BracketNode[] = []
      for (let i = 0; i < expectedF; i++) {
        const real = fMatches[i]
        if (real) {
          fNodes.push(makeNodeFromMatch('finale', i, real))
        } else {
          const a = i * 2
          const b = i * 2 + 1
          const red = hfNodes[a] ? `Winnaar ${shortPhase('halve_finale')}${a + 1}` : 'TBD'
          const blue = hfNodes[b] ? `Winnaar ${shortPhase('halve_finale')}${b + 1}` : 'TBD'
          fNodes.push(makePlaceholderNode('finale', i, red, blue))
        }
      }
      result.push({ key: 'finale', label: getPhaseLabel('finale'), nodes: fNodes })
      return result
    }

    if (startRound === 'halve_finale') {
      const nodes = hfMatches.map((m, i) => makeNodeFromMatch('halve_finale', i, m))
      result.push({ key: 'halve_finale', label: getPhaseLabel('halve_finale'), nodes })

      const expectedF = Math.max(fMatches.length, Math.ceil(nodes.length / 2))
      const fNodes: BracketNode[] = []
      for (let i = 0; i < expectedF; i++) {
        const real = fMatches[i]
        if (real) {
          fNodes.push(makeNodeFromMatch('finale', i, real))
        } else {
          const a = i * 2
          const b = i * 2 + 1
          const red = nodes[a] ? `Winnaar ${shortPhase('halve_finale')}${a + 1}` : 'TBD'
          const blue = nodes[b] ? `Winnaar ${shortPhase('halve_finale')}${b + 1}` : 'TBD'
          fNodes.push(makePlaceholderNode('finale', i, red, blue))
        }
      }
      result.push({ key: 'finale', label: getPhaseLabel('finale'), nodes: fNodes })
      return result
    }

    // startRound === 'finale'
    const nodes = fMatches.map((m, i) => makeNodeFromMatch('finale', i, m))
    if (nodes.length > 0) {
      result.push({ key: 'finale', label: getPhaseLabel('finale'), nodes })
    }
    return result
  }, [matchScorecards, matches, startRound])

  const bronzeMatch = useMemo(() => {
    const bronze = sortedMatchesForPhase('bronzen_finale')[0]
    return bronze
  }, [matches])

  const hasKnockoutMatches = useMemo(() => rounds.some((r) => r.nodes.length > 0) || !!bronzeMatch, [rounds, bronzeMatch])

  const handleMatchClick = (matchId: string) => {
    const savedUser = localStorage.getItem('auth_user')
    const user = savedUser ? JSON.parse(savedUser) : null
    if (user && user.id) {
      navigate(`/tournament/${tournamentId}/match/${matchId}/scorecard/${user.id}`)
    } else {
      navigate(`/tournament/${tournamentId}/match/${matchId}`)
    }
  }

  // Refs for line drawing
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })
  const [paths, setPaths] = useState<Array<{ d: string; key: string; dashed?: boolean }>>([])

  const computePaths = () => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    setSvgSize({ width: w, height: h })

    const getPoint = (key: string, side: 'left' | 'right') => {
      const el = nodeRefs.current[key]
      if (!el) return null
      const r = el.getBoundingClientRect()
      const x = (side === 'right' ? r.right : r.left) - rect.left
      const y = r.top - rect.top + r.height / 2
      return { x, y }
    }

    const nextRoundFor = (rk: RoundKey): RoundKey | null => {
      if (rk === 'kwartfinale') return 'halve_finale'
      if (rk === 'halve_finale') return 'finale'
      return null
    }

    const newPaths: Array<{ d: string; key: string; dashed?: boolean }> = []
    for (const round of rounds) {
      const nextKey = nextRoundFor(round.key)
      if (!nextKey) continue
      const next = rounds.find((r) => r.key === nextKey)
      if (!next) continue

      for (const node of round.nodes) {
        const targetIndex = Math.floor(node.index / 2)
        const target = next.nodes[targetIndex]
        if (!target) continue

        const p1 = getPoint(node.key, 'right')
        const p2 = getPoint(target.key, 'left')
        if (!p1 || !p2) continue

        const midX = (p1.x + p2.x) / 2
        const d = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`
        newPaths.push({ d, key: `${node.key}__to__${target.key}` })
      }
    }

    // Bronze: connect from semis (losers) as dashed lines when semis exist
    if (bronzeMatch) {
      const semi = rounds.find((r) => r.key === 'halve_finale')
      if (semi && semi.nodes.length > 0) {
        const bronzeKey = bronzeMatch.id
        const bronzePoint = getPoint(bronzeKey, 'left')
        if (bronzePoint) {
          semi.nodes.forEach((n) => {
            const p1 = getPoint(n.key, 'right')
            if (!p1) return
            const midX = (p1.x + bronzePoint.x) / 2
            const d = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${bronzePoint.y} L ${bronzePoint.x} ${bronzePoint.y}`
            newPaths.push({ d, key: `${n.key}__to__bronze`, dashed: true })
          })
        }
      }
    }

    setPaths(newPaths)
  }

  useLayoutEffect(() => {
    computePaths()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds, bronzeMatch])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver(() => computePaths())
    ro.observe(container)
    window.addEventListener('resize', computePaths)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', computePaths)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds, bronzeMatch])

  if (!hasKnockoutMatches) {
    return null
  }

  const figmaCardBg = theme.palette.mode === 'dark' ? '#1A1D18' : theme.palette.background.paper
  const figmaCardBorder = theme.palette.mode === 'dark' ? '#353A32' : theme.palette.divider
  const figmaLine = theme.palette.mode === 'dark' ? 'rgba(53,58,50,1)' : theme.palette.divider
  const figmaRed = theme.palette.mode === 'dark' ? '#8B1817' : theme.palette.error.main
  const figmaBlue = theme.palette.mode === 'dark' ? '#1C5C8A' : theme.palette.info.main

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Knockout boom
      </Typography>

      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          overflowX: 'auto',
          overflowY: 'hidden',
          pb: 1,
          borderRadius: 2,
        }}
      >
        {/* Lines */}
        <Box
          component="svg"
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
          }}
          width={svgSize.width}
          height={svgSize.height}
          viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
        >
          {paths.map((p) => (
            <path
              key={p.key}
              d={p.d}
              fill="none"
              stroke={figmaLine}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={p.dashed ? '6 6' : undefined}
            />
          ))}
        </Box>

        {/* Columns */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'stretch',
            gap: 4,
            px: 2,
            py: 2,
            minWidth: 760,
          }}
        >
          {rounds.map((round) => (
            <Box key={round.key} sx={{ minWidth: 240 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, opacity: 0.85 }}>
                {round.label}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {round.nodes.map((node) => {
                  const isClickable = !!node.match && !node.isPlaceholder

                  const isPlaceholder = node.isPlaceholder
                  const redInitials = isPlaceholder ? '?' : undefined
                  const blueInitials = isPlaceholder ? '?' : undefined

                  const winner = node.winnerName
                  const hasWinner = Boolean(winner) && !isPlaceholder
                  const redIsWinner = hasWinner && winner === node.redLabel
                  const blueIsWinner = hasWinner && winner === node.blueLabel

                  return (
                    <Box
                      key={node.key}
                      ref={(el: HTMLDivElement | null) => {
                        nodeRefs.current[node.key] = el
                      }}
                    >
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: isClickable ? 'pointer' : 'default',
                          bgcolor: figmaCardBg,
                          borderRadius: 2,
                          border: `1px solid ${figmaCardBorder}`,
                          opacity: isPlaceholder ? 0.8 : 1,
                          '&:hover': isClickable ? { filter: 'brightness(1.05)' } : undefined,
                        }}
                        onClick={() => {
                          if (!node.match) return
                          handleMatchClick(node.match.id)
                        }}
                      >
                        <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 2.25,
                              minHeight: 132,
                            }}
                          >
                            {hasWinner && (
                              <Typography
                                variant="caption"
                                sx={{
                                  position: 'absolute',
                                  top: 10,
                                  right: 12,
                                  opacity: 0.85,
                                  fontWeight: 700,
                                  color: 'text.secondary',
                                }}
                              >
                                Winnaar
                              </Typography>
                            )}

                            {/* Red (centered like Figma) */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, width: '100%' }}>
                              <Box sx={{ opacity: hasWinner && !redIsWinner ? 0.55 : 1 }}>
                                <FighterAvatar
                                  name={node.redLabel}
                                  size={28}
                                  initialsOverride={redInitials}
                                  bgColorOverride={figmaRed}
                                />
                              </Box>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: redIsWinner ? 800 : 500,
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: 160,
                                  fontStyle: isPlaceholder ? 'italic' : 'normal',
                                  opacity: hasWinner && !redIsWinner ? 0.55 : 1,
                                }}
                              >
                                {node.redLabel}
                              </Typography>
                            </Box>

                            <Typography variant="body1" sx={{ letterSpacing: 2, opacity: 0.9 }}>
                              vs
                            </Typography>

                            {/* Blue (centered like Figma) */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, width: '100%' }}>
                              <Box sx={{ opacity: hasWinner && !blueIsWinner ? 0.55 : 1 }}>
                                <FighterAvatar
                                  name={node.blueLabel}
                                  size={28}
                                  initialsOverride={blueInitials}
                                  bgColorOverride={figmaBlue}
                                />
                              </Box>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: blueIsWinner ? 800 : 500,
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: 160,
                                  fontStyle: isPlaceholder ? 'italic' : 'normal',
                                  opacity: hasWinner && !blueIsWinner ? 0.55 : 1,
                                }}
                              >
                                {node.blueLabel}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          ))}

          {/* Bronze */}
          {bronzeMatch && (
            <Box sx={{ minWidth: 240 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, opacity: 0.85 }}>
                {getPhaseLabel('bronzen_finale')}
              </Typography>
              <Box
                ref={(el: HTMLDivElement | null) => {
                  nodeRefs.current[bronzeMatch.id] = el
                }}
              >
                {(() => {
                  const sc = getAggregated(bronzeMatch)
                  const winner = getWinnerName(bronzeMatch)
                  const hasWinner = Boolean(winner)
                  const redIsWinner = hasWinner && winner === bronzeMatch.redFighter
                  const blueIsWinner = hasWinner && winner === bronzeMatch.blueFighter
                  return (
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        bgcolor: figmaCardBg,
                        borderRadius: 2,
                        border: `1px solid ${figmaCardBorder}`,
                        '&:hover': { filter: 'brightness(1.05)' },
                      }}
                      onClick={() => handleMatchClick(bronzeMatch.id)}
                    >
                      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2.25,
                            minHeight: 132,
                          }}
                        >
                          {hasWinner && (
                            <Typography
                              variant="caption"
                              sx={{
                                position: 'absolute',
                                top: 10,
                                right: 12,
                                opacity: 0.85,
                                fontWeight: 700,
                                color: 'text.secondary',
                              }}
                            >
                              Winnaar
                            </Typography>
                          )}

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, width: '100%' }}>
                            <Box sx={{ opacity: hasWinner && !redIsWinner ? 0.55 : 1 }}>
                              <FighterAvatar name={bronzeMatch.redFighter} size={28} bgColorOverride={figmaRed} />
                            </Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: redIsWinner ? 800 : 500,
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 160,
                                opacity: hasWinner && !redIsWinner ? 0.55 : 1,
                              }}
                            >
                              {bronzeMatch.redFighter}
                            </Typography>
                          </Box>

                          <Typography variant="body1" sx={{ letterSpacing: 2, opacity: 0.9 }}>
                            vs
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, width: '100%' }}>
                            <Box sx={{ opacity: hasWinner && !blueIsWinner ? 0.55 : 1 }}>
                              <FighterAvatar name={bronzeMatch.blueFighter} size={28} bgColorOverride={figmaBlue} />
                            </Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: blueIsWinner ? 800 : 500,
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 160,
                                opacity: hasWinner && !blueIsWinner ? 0.55 : 1,
                              }}
                            >
                              {bronzeMatch.blueFighter}
                            </Typography>
                          </Box>

                          {sc && hasWinner && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                              {sc.totalRed ?? 0} - {sc.totalBlue ?? 0}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  )
                })()}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Tip: je kunt horizontaal scrollen. De volgende rondes tonen alvast placeholders (bijv. “Winnaar QF1”) zodat je het verloop ziet.
      </Typography>
    </Box>
  )
}
