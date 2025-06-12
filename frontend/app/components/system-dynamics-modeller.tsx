"use client"

import type React from "react"
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import { useState, useCallback, useRef, useEffect, type DragEvent } from "react"
import ReactFlow, {
  type Node,
  type Edge,
  addEdge,
  Background, BackgroundVariant,
  type Connection,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Controls,
  MarkerType,
  ConnectionMode,
  Handle,
  Position,
  useReactFlow,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RotateCcw, Play, Link, ArrowRight, Trash2, Settings, ArrowLeft } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { type ChartConfig } from "@/components/ui/chart"

const API_URL = "http://127.0.0.1:2000"

interface Project {
  id: string
  name: string
  createdAt?: string
  lastModified?: string
}

interface SystemDynamicsModellerProps {
  project: Project
  onBack: () => void
}

// Custom Stock Node Component
const StockNode = ({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={`px-4 py-3 border-2 bg-blue-50 rounded-md min-w-[100px] text-center relative ${selected ? "border-blue-500 shadow-lg" : "border-blue-300"
        }`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-blue-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-blue-500 !border-2 !border-white" />
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-500 !border-2 !border-white" />
      <div className="font-medium text-blue-900">{data.name || data.label}</div>
      {data.init_value !== undefined && <div className="text-xs text-blue-600 mt-1">({data.init_value})</div>}
    </div>
  )
}

// Custom Variable Node Component
const VariableNode = ({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={`w-16 h-16 border-2 bg-green-50 rounded-full flex items-center justify-center relative ${selected ? "border-green-500 shadow-lg" : "border-green-300"
        }`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-green-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-green-500 !border-2 !border-white" />
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-green-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-green-500 !border-2 !border-white" />
      <div className="font-medium text-green-900 text-sm text-center">{data.name || data.label}</div>
    </div>
  )
}

// Flow Rate Node Component (appears on flows)
const FlowRateNode = ({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={`w-8 h-8 border-2 bg-red-100 transform rotate-45 flex items-center justify-center relative ${selected ? "border-red-500 shadow-lg" : "border-red-300"
        }`}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-red-500 !border-1 !border-white" />
      <Handle type="target" position={Position.Right} className="w-2 h-2 !bg-red-500 !border-1 !border-white" />
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-red-500 !border-1 !border-white" />
      <Handle type="target" position={Position.Bottom} className="w-2 h-2 !bg-red-500 !border-1 !border-white" />
      <div className="w-2 h-2 bg-red-400 rounded-full transform -rotate-45"></div>
    </div>
  )
}

// Node types
const nodeTypes = {
  stock: StockNode,
  variable: VariableNode,
  flowRate: FlowRateNode,
}

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

function SystemDynamicsFlow({ project, onBack }: SystemDynamicsModellerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [connectionMode, setConnectionMode] = useState<"flow" | "link">("flow")
  const [nodeIdCounter] = useState(1)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const { getNodes, getEdges } = useReactFlow()
  const [showSimulationModal, setShowSimulationModal] = useState(false)
  const [simulationData, setSimulationData] = useState<any[]>([])
  const [chartConfig, setChartConfig] = useState<ChartConfig>({})
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const chartInstance = useRef<any>(null)

  // Fetch project data from backend
  useEffect(() => {
    const load = async () => {
      try {
        const stockRes = await fetch(`${API_URL}/stocks?project_id=${project.id}`)
        const stockJson = await stockRes.json()
        const variableRes = await fetch(`${API_URL}/variables?project_id=${project.id}`)
        const variableJson = await variableRes.json()
        const stocks: Node[] = (stockJson.data || []).map((s: any) => ({
          id: `stock-${s.id}`,
          type: 'stock',
          position: { x: 0, y: 0 },
          data: { name: s.name, init_value: s.initial_value, label: s.name },
        }))
        const variables: Node[] = (variableJson.data || []).map((v: any) => ({
          id: `variable-${v.id}`,
          type: 'variable',
          position: { x: 0, y: 0 },
          data: { name: v.name, value: v.value, label: v.name },
        }))
        const flowsRes = await fetch(`${API_URL}/flows`)
        const flowsJson = await flowsRes.json()
        const stockIds = new Set(stocks.map((s) => parseInt(s.id.split('-')[1])))
        const flowEdges: Edge[] = (flowsJson.data || [])
          .filter((f: any) => stockIds.has(f.from_stock) || stockIds.has(f.to_stock))
          .map((f: any) => ({
            id: `flow-${f.id}`,
            source: `stock-${f.from_stock}`,
            target: `stock-${f.to_stock}`,
            type: 'flow',
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#ef4444' },
            style: { stroke: '#ef4444', strokeWidth: 3 },
            data: { flowRateNodeId: `flow-rate-${f.id}` },
          }))
        const flowRateNodes: Node[] = (flowsJson.data || [])
          .filter((f: any) => stockIds.has(f.from_stock) || stockIds.has(f.to_stock))
          .map((f: any) => ({
            id: `flow-rate-${f.id}`,
            type: 'flowRate',
            position: { x: 0, y: 0 },
            data: { name: `Flow Rate ${f.id}`, flow_value: f.name, label: `Rate ${f.id}` },
            draggable: true,
          }))

        setNodes([...stocks, ...variables, ...flowRateNodes])
        setEdges(flowEdges)
      } catch (err) {
        console.error('Failed to load project data', err)
      }
    }
    load()
  }, [project.id, setNodes, setEdges])

  // Calculate midpoint between two nodes
  const getMidpoint = (sourceNode: Node, targetNode: Node) => {
    return {
      x: (sourceNode.position.x + targetNode.position.x) / 2,
      y: (sourceNode.position.y + targetNode.position.y) / 2,
    }
  }


  const onConnect = useCallback(
    async (params: Edge | Connection) => {
      if (connectionMode === 'flow') {
        const sourceNode = nodes.find((node) => node.id === params.source)
        const targetNode = nodes.find((node) => node.id === params.target)

        if (sourceNode && targetNode) {
          const midpoint = getMidpoint(sourceNode, targetNode)

          const res = await fetch(`${API_URL}/flows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: '1',
              from_stock: Number(params.source?.split('-')[1]),
              to_stock: Number(params.target?.split('-')[1]),
            }),
          })
          const data = await res.json()
          const id = data.data?.id

          const flowRateNode: Node = {
            id: `flow-rate-${id}`,
            type: 'flowRate',
            position: midpoint,
            data: { name: `Flow Rate ${id}`, flow_value: '1', label: `Rate ${id}` },
            draggable: true,
          }

          const newEdge = {
            ...params,
            id: `flow-${id}`,
            type: 'flow',
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#ef4444' },
            style: { stroke: '#ef4444', strokeWidth: 3 },
            data: { flowRateNodeId: flowRateNode.id },
          }

          setNodes((nds) => [...nds, flowRateNode])
          setEdges((eds) => addEdge(newEdge, eds))
        }
      } else {
        const newEdge = {
          ...params,
          type: connectionMode,
          markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#6b7280' },
          style: { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5,5' },
        }
        setEdges((eds) => addEdge(newEdge, eds))
      }
    },
    [setEdges, setNodes, connectionMode, nodes],
  )

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData("application/reactflow")
      if (typeof type === "undefined" || !type) {
        return
      }

      if (!reactFlowInstance) return

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      let newNode: Node | null = null

      if (type === 'stock') {
        const res = await fetch(`${API_URL}/stocks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: Number(project.id) }),
        })
        const data = await res.json()
        const id = data.data?.id
        newNode = {
          id: `stock-${id}`,
          type,
          position,
          data: { name: data.data?.name || `Stock ${id}`, init_value: data.data?.initial_value || '0', label: data.data?.name || `Stock ${id}` },
        }
      } else {
        const res = await fetch(`${API_URL}/variables`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `Variable ${nodeIdCounter}`, value: '0', project_id: Number(project.id) }),
        })
        const data = await res.json()
        const id = data.data?.id
        newNode = {
          id: `variable-${id}`,
          type,
          position,
          data: { name: data.data?.name || `Variable ${id}`, value: data.data?.value || '0', label: data.data?.name || `Variable ${id}` },
        }
      }

      if (newNode) {
        setNodes((nds) => nds.concat(newNode!))
      }
    },
    [reactFlowInstance, setNodes, nodeIdCounter, project.id],
  )

  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  const handleReset = () => {
    setNodes([])
    setEdges([])
    setSelectedNode(null)
  }

  const handleSimulate = async () => {
    try {
      const res = await fetch(`${API_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: Number(project.id), sim_step: 30 }),
      })
      const json = await res.json()
      if (json.success) {
        const raw: any[] = json.data || []
        const processed = raw.map((step, idx) => ({ time: idx + 1, ...step }))
        setSimulationData(processed)
        const keys = Object.keys(processed[0] || {}).filter((k) => k !== 'time')
        const colors = [
          'hsl(var(--chart-1))',
          'hsl(var(--chart-2))',
          'hsl(var(--chart-3))',
          'hsl(var(--chart-4))',
          'hsl(var(--chart-5))',
        ]
        const cfg: ChartConfig = {}
        keys.forEach((key, i) => {
          cfg[key] = { label: key, color: colors[i % colors.length] }
        })
        setChartConfig(cfg)
        setShowSimulationModal(true)
      }
    } catch (err) {
      console.error('Simulation failed', err)
    }
  }

  useEffect(() => {
    if (!showSimulationModal || !chartRef.current) return

    const labels = simulationData.map((d) => d.time)
    const datasets = Object.keys(chartConfig).map((key) => {
      const cssKey = key.replace(/[^a-zA-Z0-9_-]/g, "-")
      return {
        label: chartConfig[key].label?.toString() || key,
        data: simulationData.map((d) => d[key]),
        borderColor: `var(--color-${cssKey})`,
        backgroundColor: `var(--color-${cssKey})`,
        fill: false,
        tension: 0.4,
      }
    })

    const create = () => {
      const ctx = chartRef.current!.getContext('2d')!
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
      chartInstance.current = new (window as any).Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { title: { display: true, text: 'Time (units)' } },
            y: { title: { display: true, text: 'Value' } },
          },
        },
      })
    }

    if (!(window as any).Chart) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js'
      script.onload = create
      document.body.appendChild(script)
      return () => {
        if (chartInstance.current) chartInstance.current.destroy()
        document.body.removeChild(script)
      }
    } else {
      create()
      return () => {
        if (chartInstance.current) chartInstance.current.destroy()
      }
    }
  }, [showSimulationModal, simulationData, chartConfig])

  // Delete selected nodes and edges
  const handleDelete = useCallback(async () => {
    const selectedNodes = getNodes().filter((node) => node.selected)
    const selectedEdges = getEdges().filter((edge) => edge.selected)

    // When deleting a flow edge, also delete its associated flow rate node
    const flowRateNodesToDelete: string[] = []
    selectedEdges.forEach((edge) => {
      if (edge.data?.flowRateNodeId) {
        flowRateNodesToDelete.push(edge.data.flowRateNodeId)
      }
    })

    // When deleting a flow rate node, also delete its associated flow edge
    const flowEdgesToDelete: string[] = []
    selectedNodes.forEach((node) => {
      if (node.type === "flowRate") {
        const associatedEdge = getEdges().find((edge) => edge.data?.flowRateNodeId === node.id)
        if (associatedEdge) {
          flowEdgesToDelete.push(associatedEdge.id)
        }
      }
    })

    if (selectedNodes.length > 0 || flowRateNodesToDelete.length > 0) {
      for (const node of selectedNodes) {
        const [type, idStr] = node.id.split('-')
        const id = Number(idStr)
        try {
          if (type === 'stock') {
            await fetch(`${API_URL}/stocks/${id}`, { method: 'DELETE' })
          } else if (type === 'variable') {
            await fetch(`${API_URL}/variables/${id}`, { method: 'DELETE' })
          } else if (type === 'flowRate') {
            const edge = getEdges().find((e) => e.data?.flowRateNodeId === node.id)
            if (edge) {
              const fid = Number(edge.id.split('-')[1])
              await fetch(`${API_URL}/flows/${fid}`, { method: 'DELETE' })
            }
          }
        } catch (err) {
          console.error('Failed to delete', err)
        }
      }
      setNodes((nds) => nds.filter((node) => !node.selected && !flowRateNodesToDelete.includes(node.id)))
    }

    if (selectedEdges.length > 0 || flowEdgesToDelete.length > 0) {
      for (const edge of selectedEdges) {
        if (edge.id.startsWith('flow-')) {
          const fid = Number(edge.id.split('-')[1])
          try {
            await fetch(`${API_URL}/flows/${fid}`, { method: 'DELETE' })
          } catch (err) {
            console.error('Failed to delete flow', err)
          }
        }
      }
      setEdges((eds) => eds.filter((edge) => !edge.selected && !flowEdgesToDelete.includes(edge.id)))
    }

    setSelectedNode(null)
  }, [getNodes, getEdges, setNodes, setEdges])

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  // Handle canvas click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // Update node properties
  const updateNodeProperty = useCallback(
    async (nodeId: string, property: string, value: any) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  [property]: value,
                },
              }
            : node,
        ),
      )

      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) =>
          prev
            ? { ...prev, data: { ...prev.data, [property]: value } }
            : null,
        )
      }

      const [type, idStr] = nodeId.split('-')
      const id = Number(idStr)
      try {
        if (type === 'stock') {
          const node = nodes.find((n) => n.id === nodeId)
          await fetch(`${API_URL}/stocks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: property === 'name' ? value : node?.data.name,
              initial_value: property === 'init_value' ? value : node?.data.init_value,
            }),
          })
        } else if (type === 'variable') {
          const node = nodes.find((n) => n.id === nodeId)
          await fetch(`${API_URL}/variables/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: property === 'name' ? value : node?.data.name,
              value: property === 'value' ? value : node?.data.value,
            }),
          })
        } else if (type === 'flow' || type === 'flowRate') {
          const edge = edges.find((e) => e.data?.flowRateNodeId === nodeId || e.id === nodeId)
          if (edge) {
            const fid = Number(edge.id.split('-')[1])
            await fetch(`${API_URL}/flows/${fid}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: value }),
            })
          }
        }
      } catch (err) {
        console.error('Failed to update', err)
      }
    },
    [setNodes, selectedNode, nodes, edges],
  )

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      // Check if user is currently editing an input field
      const activeElement = document.activeElement as HTMLElement;
      const isEditingInput =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.contentEditable === "true")

      // Only trigger delete if not editing an input field
      if ((event.key === "Delete" || event.key === "Backspace") && !isEditingInput) {
        handleDelete()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleDelete])

  const isValidConnection = useCallback(
    (connection: Connection) => {
      const { source, target } = connection

      // Prevent self-connections
      if (source === target) return false

      if (connectionMode === "flow") {
        // Flows should connect stocks to stocks only
        const sourceNode = nodes.find((node) => node.id === source)
        const targetNode = nodes.find((node) => node.id === target)
        return sourceNode?.type === "stock" && targetNode?.type === "stock"
      } else {
        // Links can connect variables to flow rate nodes, or any other combinations
        const sourceNode = nodes.find((node) => node.id === source)
        const targetNode = nodes.find((node) => node.id === target)

        // Allow connections to flow rate nodes
        if (targetNode?.type === "flowRate") return true

        // Allow other link connections
        return true
      }
    },
    [connectionMode, nodes],
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
            <div className="flex items-center space-x-2">
              <Badge variant={connectionMode === "flow" ? "destructive" : "secondary"}>
                {connectionMode === "flow" ? "Flow Mode" : "Link Mode"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button size="sm" onClick={handleSimulate}>
              <Play className="w-4 h-4 mr-2" />
              Simulate
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stock Component */}
              <div
                className="p-3 border-2 border-dashed border-blue-300 bg-blue-50 rounded-md cursor-grab active:cursor-grabbing hover:bg-blue-100 transition-colors"
                draggable
                onDragStart={(event) => onDragStart(event, "stock")}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-4 bg-blue-400 rounded-sm"></div>
                  <span className="font-medium text-blue-900">Stock</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">Rectangular containers</p>
              </div>

              {/* Variable Component */}
              <div
                className="p-3 border-2 border-dashed border-green-300 bg-green-50 rounded-md cursor-grab active:cursor-grabbing hover:bg-green-100 transition-colors"
                draggable
                onDragStart={(event) => onDragStart(event, "variable")}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-green-400 rounded-full"></div>
                  <span className="font-medium text-green-900">Variable</span>
                </div>
                <p className="text-xs text-green-700 mt-1">Circular elements</p>
              </div>

              {/* Connection Mode */}
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">Connection Mode</h3>
                <div className="space-y-2">
                  <Button
                    variant={connectionMode === "flow" ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setConnectionMode("flow")}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Flow
                  </Button>
                  <Button
                    variant={connectionMode === "link" ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setConnectionMode("link")}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative">
          <div ref={reactFlowWrapper} className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Loose}
              isValidConnection={isValidConnection}
              fitView
              snapToGrid={true}
              snapGrid={[15, 15]}
              multiSelectionKeyCode="Shift"
              deleteKeyCode="Delete"
            >
              <Controls />
              <Background variant={"dots" as BackgroundVariant} gap={12} size={1} />
            </ReactFlow>
          </div>
        </div>

        {/* Right Properties Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <Badge variant="outline" className="mb-3">
                      {selectedNode.type === "stock"
                        ? "Stock"
                        : selectedNode.type === "variable"
                          ? "Variable"
                          : "Flow Rate"}
                    </Badge>
                  </div>

                  {/* Name field for all types */}
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={selectedNode.data.name || ""}
                      onChange={(e) => updateNodeProperty(selectedNode.id, "name", e.target.value)}
                      placeholder="Enter name"
                    />
                  </div>

                  {/* Stock-specific fields */}
                  {selectedNode.type === "stock" && (
                    <div>
                      <Label htmlFor="init_value">Initial Value</Label>
                      <Input
                        id="init_value"
                        type="text"
                        value={selectedNode.data.init_value || ""}
                        onChange={(e) => updateNodeProperty(selectedNode.id, "init_value", e.target.value)}
                        placeholder="Enter initial value"
                      />
                    </div>
                  )}

                  {/* Variable-specific fields */}
                  {selectedNode.type === "variable" && (
                    <div>
                      <Label htmlFor="value">Value</Label>
                      <Input
                        id="value"
                        type="text"
                        value={selectedNode.data.value || ""}
                        onChange={(e) => updateNodeProperty(selectedNode.id, "value", e.target.value)}
                        placeholder="Enter value"
                      />
                    </div>
                  )}

                  {/* Flow Rate-specific fields */}
                  {selectedNode.type === "flowRate" && (
                    <div>
                      <Label htmlFor="flow_value">Flow Value</Label>
                      <Input
                        id="flow_value"
                        type="text"
                        value={selectedNode.data.flow_value || ""}
                        onChange={(e) => updateNodeProperty(selectedNode.id, "flow_value", e.target.value)}
                        placeholder="Enter flow value"
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      ID: <code className="text-xs bg-gray-100 px-1 rounded">{selectedNode.id}</code>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click on a component to view and edit its properties</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p>1. Drag stocks and variables from the left panel</p>
              <p>2. Select connection mode (Flow/Link)</p>
              <p>
                3. <strong>Flows:</strong> Connect stocks to stocks
              </p>
              <p>
                4. <strong>Links:</strong> Connect variables to flow rate nodes
              </p>
              <p>5. Click components to edit properties</p>
              <p>6. Use header buttons for Reset, Delete, Simulate</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Simulation Modal */}
      <Dialog open={showSimulationModal} onOpenChange={setShowSimulationModal}>
        <DialogContent className="w-[90vw] max-w-7xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Play className="w-5 h-5 mr-2" />
              Simulation Results - {project.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Chart Only */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stock Levels Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <canvas ref={chartRef} className="w-full h-[500px]" />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setShowSimulationModal(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  // Future: Export simulation data
                  console.log("Export simulation data")
                }}
              >
                Export Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SystemDynamicsModeller({ project, onBack }: SystemDynamicsModellerProps) {
  return (
    <div className="w-full h-screen bg-gray-50">
      <ReactFlowProvider>
        <SystemDynamicsFlow project={project} onBack={onBack} />
      </ReactFlowProvider>
    </div>
  )
}
