'use client'
import { useRouter } from 'next/navigation'
import { Inbox, Mail, MessageSquare, Check, X, Clock, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const iconMap = {
  mail: Mail,
  message: MessageSquare,
  inbox: Inbox,
}

export default function InboxPage() {
  const router = useRouter()
  const items = []

  const itemCount = items.length

  return (
    <>
      <div className="topbar">
        <h2 className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          Inbox
        </h2>
        <div className="topbar-actions">
          <Badge variant="secondary">{itemCount} {itemCount === 1 ? 'item' : 'items'}</Badge>
        </div>
      </div>

      <div className="page-content">
        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 rounded-full bg-muted p-6">
              <Inbox className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-foreground">No messages yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              When you receive inquiries or messages from customers, they&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map(item => {
              const IconComponent = iconMap[item.icon] || Mail
              return (
                <Card key={item.id} className="flex items-start gap-3.5 p-4 transition-colors hover:border-accent">
                  <div className="mt-0.5 rounded-lg bg-muted p-2">
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                    {item.cost && (
                      <span className="mt-1.5 inline-block rounded-md bg-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-yellow-600 dark:text-yellow-400">
                        {item.cost}
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
