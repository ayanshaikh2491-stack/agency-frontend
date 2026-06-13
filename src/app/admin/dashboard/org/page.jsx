'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useCompany } from '@/lib/client-context'
import { Network, Maximize2, Minus, Plus, RotateCcw, Users, Hash } from 'lucide-react'

/* ═══════════════════════════════════════════════
   Org Chart — SVG Bezier Hierarchy
   Source: github.com/paperclipai/paperclip/ui/src/pages/Org.tsx
   ═══════════════════════════════════════════════ */

/* ─── Layout constants ─── */
const CARD_W = 210
const CARD_H = 94
const GAP_X = 40
const GAP_Y = 80
const PADDING = 80
const MIN_ZOOM = 0.15
const MAX_ZOOM = 3

const STATUS_COLORS = {
  running: '#22d3ee',
  active: '#4ade80',
  paused: '#facc15',
  idle: 'var(--muted-foreground)',
  error: '#f87171',
  terminated: '#525252',
}

/* ─── Tree layout algorithm ─── */
function subtreeWidth(node) {
  if (!node.reports || node.reports.length === 0) return CARD_W
  const childrenW = node.reports.reduce((sum, c) => sum + subtreeWidth(c), 0)
  const gaps = (node.reports.length - 1) * GAP_X
  return Math.max(CARD_W, childrenW + gaps)
}

function layoutTree(node, x, y) {
  const totalW = subtreeWidth(node)
  const children = []
  if (node.reports && node.reports.length > 0) {
    const childrenW = node.reports.reduce((sum, c) => sum + subtreeWidth(c), 0)
    const gaps = (node.reports.length - 1) * GAP_X
    let cx = x + (totalW - childrenW - gaps) / 2
    for (const child of node.reports) {
      const cw = subtreeWidth(child)
      children.push(layoutTree(child, cx, y + CARD_H + GAP_Y))
      cx += cw + GAP_X
    }
  }
  return {
    id: node.id,
    name: node.name,
    role: node.role,
    status: node.status,
    tokens: node.tokens || 0,
    taskCount: node.taskCount || 0,
    emoji: node.emoji,
    x: x + (totalW - CARD_W) / 2,
    y,
    children,
  }
}

function flattenLayout(nodes) {
  const result = []
  function walk(n) { result.push(n); n.children.forEach(walk) }
  nodes.forEach(walk)
  return result
}

function collectEdges(nodes) {
  const edges = []
  function walk(n) {
    for (const c of n.children) {
      edges.push({ parent: n, child: c })
      walk(c)
    }
  }
  nodes.forEach(walk)
  return edges
}

/* ─── Bezier path between two nodes ─── */
function bezierEdge(px, py, cx, cy) {
  const midY = py + (cy - py) / 2
  return `M ${px} ${py} C ${px} ${midY}, ${cx} ${midY}, ${cx} ${cy}`
}

/* ─── Status dot component ─── */
function StatusDot({ x, y, color, isPulse }) {
  return (
    <g>
      {isPulse && (
        <circle cx={x} cy={y} r={7} fill={color} opacity={0.15}>
          <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={x} cy={y} r={4.5} fill={color} opacity={isPulse ? 1 : 0.5}>
        {isPulse && (
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.6s" repeatCount="indefinite" />
        )}
      </circle>
    </g>
  )
}

/* ─── Node Card ─── */
function NodeCard({ node, rank }) {
  const dotColor = STATUS_COLORS[node.status] || 'var(--muted-foreground)'
  const isPulse = node.status === 'running' || node.status === 'active'

  return (
    <g>
      {/* Shadow */}
      <rect
        x={node.x + 2}
        y={node.y + 2}
        width={CARD_W}
        height={CARD_H}
        rx={8}
        fill="rgba(0,0,0,0.35)"
        filter="url(#blur-shadow)"
      />
      {/* Card body */}
      <rect
        x={node.x}
        y={node.y}
        width={CARD_W}
        height={CARD_H}
        rx={8}
        fill={rank === 'ceo' ? '#1a1f2e' : '#141820'}
        stroke={rank === 'ceo' ? '#6366f1' : rank === 'lead' ? '#374151' : '#1f2433'}
        strokeWidth={rank === 'ceo' ? 1.5 : 1}
      />
      {/* Gradient accent line on top */}
      <rect
        x={node.x + 1}
        y={node.y}
        width={CARD_W - 2}
        height={3}
        rx={1.5}
        fill={rank === 'ceo' ? '#6366f1' : rank === 'lead' ? '#3b82f6' : '#8b5cf6'}
      />

      {/* Emoji */}
      <text x={node.x + 14} y={node.y + 30} fontSize="17">{node.emoji || '🤖'}</text>

      {/* Name */}
      <text
        x={node.x + 44}
        y={node.y + 26}
        fill={rank === 'ceo' ? '#f3f4f6' : '#d1d5db'}
        fontSize="12.5"
        fontWeight="600"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {node.name.length > 19 ? node.name.slice(0, 18) + '…' : node.name}
      </text>

      {/* Role chip */}
      <rect
        x={node.x + 14}
        y={node.y + 40}
        width={node.role.length * 7 + 14}
        height={18}
        rx={9}
        fill={rank === 'ceo' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)'}
      />
      <text
        x={node.x + 21}
        y={node.y + 53}
        fill={rank === 'ceo' ? '#818cf8' : 'var(--muted-foreground)'}
        fontSize="9.5"
        fontWeight="500"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {node.role || 'Worker'}
      </text>

      {/* Status indicator bottom-left */}
      <text
        x={node.x + 14}
        y={node.y + 76}
        fill={dotColor}
        fontSize="10"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {node.status === 'running' ? '● Running' : node.status === 'active' ? '● Active' : `● ${node.status.charAt(0).toUpperCase() + node.status.slice(1)}`}
      </text>

      {/* Tokens bottom-right */}
      <text
        x={node.x + CARD_W - 14}
        y={node.y + 68}
        fill="var(--muted-foreground)"
        fontSize="9.5"
        textAnchor="end"
        fontFamily="ui-monospace, monospace"
      >
        ⚡ {(node.tokens || 0).toLocaleString()}
      </text>

      {/* Task count */}
      {node.taskCount > 0 && (
        <text
          x={node.x + CARD_W - 14}
          y={node.y + 82}
          fill="var(--muted-foreground)"
          fontSize="9"
          textAnchor="end"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {node.taskCount} tasks
        </text>
      )}

      {/* Child count */}
      {node.children.length > 0 && (
        <text
          x={node.x + CARD_W - 14}
          y={node.y + 82}
          fill="var(--muted-foreground)"
          fontSize="9"
          textAnchor="end"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {node.children.length} reports
        </text>
      )}

      {/* Status dot */}
      <StatusDot
        x={node.x + CARD_W - 14}
        y={node.y + 14}
        color={dotColor}
        isPulse={isPulse}
      />
    </g>
  )
}

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */
export default function OrgChartPage() {
  const { orgTree } = useCompany()
  const containerRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [hoveredNode, setHoveredNode] = useState(null)
  const panStart = useRef({ x: 0, y: 0 })
  const panOrigin = useRef({ x: 0, y: 0 })

  /* ─── Build tree from org data ─── */
  const layoutRoots = useMemo(() => {
    if (!orgTree) return []

    const workers = (orgTree.workers || []).map(w => ({
      id: w.id || w.name?.toLowerCase().replace(/\s+/g, '-'),
      name: w.name || 'Worker',
      role: w.role || 'Worker',
      status: w.status || 'idle',
      tokens: w.tokens || 0,
      taskCount: w.taskCount || w.tickets || 0,
      emoji: w.emoji || '🤖',
      reports: [],
    }))

    const ctoReports = orgTree.cto?.children || orgTree.cto?.reports || workers
    const cmoReports = orgTree.cmo?.children || orgTree.cmo?.reports || []

    const reports = [
      ...(orgTree.cto ? [{
        id: orgTree.cto.id || 'cto',
        name: orgTree.cto.name || 'CTO Router',
        role: 'CTO',
        status: orgTree.cto.status || 'running',
        tokens: orgTree.cto.tokens || 0,
        taskCount: orgTree.cto.taskCount || orgTree.cto.tickets || 0,
        emoji: '⚙️',
        reports: ctoReports,
      }] : []),
      ...(orgTree.cmo ? [{
        id: orgTree.cmo.id || 'cmo',
        name: orgTree.cmo.name || 'CMO Strategy',
        role: 'CMO',
        status: orgTree.cmo.status || 'running',
        tokens: orgTree.cmo.tokens || 0,
        taskCount: orgTree.cmo.taskCount || orgTree.cmo.tickets || 0,
        emoji: '📊',
        reports: cmoReports,
      }] : []),
    ]

    // If no CTO/CMO but workers exist, workers go directly under CEO
    if (reports.length === 0 && workers.length > 0) {
      reports.push({
        id: 'workers-group',
        name: 'Workers',
        role: 'Group',
        status: 'running',
        tokens: workers.reduce((s, w) => s + (w.tokens || 0), 0),
        taskCount: workers.reduce((s, w) => s + (w.taskCount || 0), 0),
        emoji: '👥',
        reports: workers,
      })
    }

    const roots = orgTree.ceo ? [{
      id: orgTree.ceo.id || 'ceo',
      name: orgTree.ceo.name || 'CEO Console',
      role: 'CEO',
      status: orgTree.ceo.status || 'running',
      tokens: orgTree.ceo.tokens || 0,
      taskCount: orgTree.ceo.taskCount || orgTree.ceo.tickets || 0,
      emoji: '🧠',
      reports,
    }] : []

    return roots.map(r => layoutTree(r, PADDING, PADDING))
  }, [orgTree])

  const layoutNodes = useMemo(() => flattenLayout(layoutRoots), [layoutRoots])
  const edges = useMemo(() => collectEdges(layoutRoots), [layoutRoots])

  /* ─── SVG dimensions ─── */
  const dims = useMemo(() => {
    if (layoutNodes.length === 0) return { width: 600, height: 400 }
    const xs = layoutNodes.map(n => n.x)
    const ys = layoutNodes.map(n => n.y)
    return {
      width: Math.max(...xs) - Math.min(...xs) + CARD_W + PADDING * 2,
      height: Math.max(...ys) - Math.min(...ys) + CARD_H + PADDING * 2,
    }
  }, [layoutNodes])

  /* ─── Auto-fit chart to viewport on mount ─── */
  useEffect(() => {
    if (containerRef.current && layoutNodes.length > 0) {
      const rect = containerRef.current.getBoundingClientRect()
      const ccw = rect.width - 40   // container content width with padding
      const cch = rect.height - 40  // container content height with padding
      const scaleX = ccw / dims.width
      const scaleY = cch / dims.height
      const fitZoom = Math.min(scaleX, scaleY, 1)  // never zoom beyond 1
      const offsetX = Math.max(0, (ccw - dims.width * fitZoom) / 2)
      const offsetY = Math.max(0, (cch - dims.height * fitZoom) / 2)
      setZoom(fitZoom)
      setPan({ x: offsetX, y: offsetY })
    }
  }, [layoutNodes.length]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Zoom controls ─── */
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.25, MAX_ZOOM))
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.25, MIN_ZOOM))
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  /* ─── Pan handlers ─── */
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * delta)))
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
    }
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || e.shiftKey) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY }
      panOrigin.current = { ...pan }
    }
  }, [pan])

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy })
  }, [isPanning])

  const handleMouseUp = useCallback(() => setIsPanning(false), [])

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  const totalAgents = layoutNodes.length
  const totalTokens = layoutNodes.reduce((s, n) => s + (n.tokens || 0), 0)
  const runningCount = layoutNodes.filter(n => n.status === 'running' || n.status === 'active').length

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ─── Header ─── */}
      <div className="shrink-0 flex items-center justify-between px-4 h-12 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Network className="h-4 w-4 text-indigo-400" />
          <h1 className="text-sm font-semibold text-foreground">Org Chart</h1>
          <div className="flex items-center gap-2 ml-3">
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5">
              <Users className="h-3 w-3" /> {totalAgents} agents
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> {runningCount} running
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5">
              ⚡ {totalTokens.toLocaleString()} tokens
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleZoomOut} className="flex items-center justify-center size-7 hover:bg-accent/50 transition-colors" title="Zoom out">
            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <span className="text-[11px] font-mono text-muted-foreground min-w-[40px] text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={handleZoomIn} className="flex items-center justify-center size-7 hover:bg-accent/50 transition-colors" title="Zoom in">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button onClick={handleReset} className="flex items-center justify-center size-7 hover:bg-accent/50 transition-colors" title="Reset view">
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* ─── Canvas ─── */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing ${isPanning ? 'cursor-grabbing' : ''}`}
        style={{
          background: 'radial-gradient(circle at 1px 1px, rgba(30,37,51,0.6) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onContextMenu={e => e.preventDefault()}
      >
        {layoutNodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl opacity-30 mb-2">◈</div>
              <p className="text-sm font-medium text-foreground">No org data</p>
              <p className="text-xs text-muted-foreground mt-1">Configure CEO/CTO agents to see the hierarchy</p>
            </div>
          </div>
        ) : (
          <svg
            width={dims.width}
            height={dims.height}
            className="transition-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
          >
            <defs>
              <filter id="blur-shadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="2" />
                <feComponentTransfer><feFuncA type="linear" slope="0.35" /></feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="edge-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* ─── Bezier Edges ─── */}
            {edges.map(({ parent, child }, i) => {
              const px = parent.x + CARD_W / 2
              const py = parent.y + CARD_H
              const cx = child.x + CARD_W / 2
              const cy = child.y
              const path = bezierEdge(px, py, cx, cy)
              return (
                <g key={`edge-${i}`}>
                  {/* Glow */}
                  <path
                    d={path}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeOpacity={0.08}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Main line */}
                  <path
                    d={path}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="1.5"
                    strokeOpacity={0.8}
                    style={{ pointerEvents: 'none' }}
                  />
                </g>
              )
            })}

            {/* ─── Nodes ─── */}
            {layoutNodes.map((node) => {
              const rank = node.role === 'CEO' ? 'ceo'
                : node.role === 'CTO' || node.role === 'CMO' || node.role === 'Group' ? 'lead'
                : 'worker'
              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                  className="transition-opacity"
                >
                  <NodeCard node={node} rank={rank} />
                </g>
              )
            })}
          </svg>
        )}
      </div>

      {/* ─── Bottom stats bar ─── */}
      <div className="shrink-0 h-7 flex items-center justify-between px-4 border-t border-border bg-background/80">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Running: {runningCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Idle: {layoutNodes.filter(n => n.status === 'idle' || n.status === 'paused').length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Error: {layoutNodes.filter(n => n.status === 'error').length}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {layoutRoots.length > 0 && layoutRoots[0].children.length > 0
            ? `${layoutRoots[0].name} → ${layoutRoots[0].children.map(c => c.name).join(' · ')}`
            : 'No hierarchy configured'}
        </span>
      </div>
    </div>
  )
}
