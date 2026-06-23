import {
  ChartNetworkIcon,
  ImageIcon,
  MapIcon,
  PenToolIcon,
  ScanTextIcon,
  SparklesIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function AiAssistantCard({ onSend, suggestions }) {
  var chipSuggestions = suggestions || [
    { icon: ImageIcon, label: 'Create image', color: 'text-blue-500' },
    { icon: ChartNetworkIcon, label: 'Analyze data', color: 'text-orange-500' },
    { icon: MapIcon, label: 'Make a plan', color: 'text-green-500' },
    { icon: ScanTextIcon, label: 'Summarize text', color: 'text-pink-500' },
    { icon: PenToolIcon, label: 'Help me write', color: 'text-yellow-500' },
    { icon: SparklesIcon, label: 'More', color: 'text-purple-500' },
  ]

  return (
    <Card className="flex h-full min-h-[400px] w-full max-w-[480px] flex-col gap-6 p-4 shadow-none border-2 border-red-500 mx-auto">
      <CardContent className="flex flex-1 flex-col p-0">
        <div className="flex flex-col items-center justify-center space-y-8 p-6">
          {/* Logo */}
          <div className="grid size-12 shrink-0 place-content-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <span className="text-white font-bold text-xl">N</span>
          </div>

          <div className="flex flex-col space-y-2.5 text-center">
            <div className="flex flex-col">
              <h2 className="text-xl font-medium tracking-tight text-muted-foreground">Hi Ayan,</h2>
              <h3 className="text-lg font-medium tracking-[-0.006em]">Welcome back! How can I help?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              I'm the CEO Agent — I oversee all operations. Choose a prompt below or just tell me what you need!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {chipSuggestions.map(function(s, i) {
              var Icon = s.icon
              return (
                <Badge key={i} variant="secondary" onClick={function() { if (onSend) onSend(s.label) }}
                  className="h-7 min-w-7 cursor-pointer gap-1.5 text-xs rounded-md hover:bg-secondary/80 transition-colors">
                  <Icon aria-hidden="true" className={s.color + ' h-3.5 w-3.5'} />
                  {s.label}
                </Badge>
              )
            })}
          </div>
        </div>

        <div className="relative mt-auto flex-col rounded-md ring-1 ring-border">
          <div className="relative">
            <Textarea placeholder="Ask me anything..." className="peer bg-transparent min-h-[100px] resize-none rounded-b-none border-none py-3 ps-9 pe-9 shadow-none" />
            <div className="pointer-events-none absolute start-0 top-[14px] flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="size-4">
                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11.5" cy="11.5" r="9.5" />
                  <path strokeLinecap="round" d="M18.5 18.5L22 22" />
                </g>
              </svg>
            </div>
            <button aria-label="Record audio" type="button"
              className="absolute end-0 bottom-7 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-colors outline-none hover:text-foreground focus:z-10 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="size-4">
                <path fill="currentColor" fillRule="evenodd" d="M5.25 8a6.75 6.75 0 0 1 13.5 0v5a6.75 6.75 0 0 1-13.5 0zM12 2.75A5.25 5.25 0 0 0 6.75 8v5a5.25 5.25 0 1 0 10.5 0V8c0-2.9-2.35-5.25-5.25-5.25m-1.485 4.295a.75.75 0 0 1-1.06-1.06l.534.504a37 37 0 0 1-.533-.505v-.001l.002-.002l.004-.003l.008-.008l.064-.06q.054-.047.139-.106c.113-.078.268-.167.473-.25c.41-.165 1.008-.304 1.854-.304s1.444.139 1.854.305c.205.083.36.17.473.249a2 2 0 0 1 .203.166l.008.008l.004.003l.001.002h.001c0 .001.001.002-.533.506l.534-.504a.75.75 0 0 1-1.068 1.055a1 1 0 0 0-.186-.095c-.207-.084-.61-.195-1.291-.195s-1.084.111-1.291.195a1 1 0 0 0-.194.1m0 3.001a.75.75 0 0 1-1.06-1.061L10 9.5a46 46 0 0 1-.544-.516v-.001l.002-.002l.004-.003l.008-.008l.064-.06q.054-.047.139-.106c.113-.078.268-.167.473-.25c.41-.165 1.008-.304 1.854-.304s1.444.139 1.854.305c.205.082.36.17.473.249a2 2 0 0 1 .203.166l.008.008l.004.003l.001.002h.001c0 .001.001.002-.544.517l.545-.515a.75.75 0 0 1-1.06 1.06l-.008-.005a1 1 0 0 0-.186-.095c-.207-.084-.61-.195-1.291-.195s-1.084.111-1.291.195a1 1 0 0 0-.186.095z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between rounded-b-md border-t bg-muted/50 px-3 py-2 dark:bg-muted">
            <Select defaultValue="gpt-4">
              <SelectTrigger size="sm" className="h-7 bg-background text-xs w-[90px]">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs" value="gpt-4">GPT-4</SelectItem>
                <SelectItem className="text-xs" value="gpt-3.5">GPT-3.5</SelectItem>
                <SelectItem className="text-xs" value="claude-3">Claude 3</SelectItem>
                <SelectItem className="text-xs" value="groq">Groq</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button className="h-7 px-2 gap-2 text-xs" variant="ghost">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="size-3.5 text-muted-foreground">
                  <path fill="currentColor" d="M6.17 6.309a5.317 5.317 0 0 1 7.522 0a5.326 5.326 0 0 1 0 7.529l-1.43 1.43a.75.75 0 0 0 1.06 1.061l1.43-1.431a6.826 6.826 0 0 0 0-9.65a6.817 6.817 0 0 0-9.644 0l-2.86 2.864A6.826 6.826 0 0 0 6.69 19.749a.75.75 0 1 0 .083-1.498a5.326 5.326 0 0 1-3.465-9.08z" />
                  <path fill="currentColor" d="M17.31 4.251a.75.75 0 0 0-.083 1.498a5.326 5.326 0 0 1 3.465 9.08L17.83 17.69a5.317 5.317 0 0 1-7.523 0a5.326 5.326 0 0 1 0-7.528l1.43-1.432a.75.75 0 0 0-1.06-1.06l-1.43 1.431a6.826 6.826 0 0 0 0 9.65a6.817 6.817 0 0 0 9.644 0l2.86-2.864A6.826 6.826 0 0 0 17.31 4.251" />
                </svg>
                Attach
              </Button>
              <Button className="h-7 px-2 gap-2 text-xs" variant="ghost">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="size-3.5 text-muted-foreground">
                  <g fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" d="M13.294 7.17L12 12l-1.294 4.83" />
                    <path d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z" />
                  </g>
                </svg>
                Shortcuts
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
