'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatThread {
  id: string
  name: string
  created_at: string
  last_message?: string
}

interface ChatThreadsProps {
  agentId: string
  currentThreadId?: string
  onThreadSelect: (threadId: string) => void
  onNewThread: () => void
}

export function ChatThreads({ 
  agentId, 
  currentThreadId,
  onThreadSelect,
  onNewThread
}: ChatThreadsProps) {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadThreads() {
      try {
        const response = await fetch(`/api/agents/${agentId}/threads`)
        if (!response.ok) throw new Error('Failed to load chat threads')
        const data = await response.json()
        setThreads(data.threads)
      } catch (error) {
        console.error('Error loading threads:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadThreads()
  }, [agentId])

  return (
    <div className="w-64 border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <Button 
          variant="secondary" 
          className="w-full justify-start" 
          onClick={onNewThread}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {threads.map((thread) => (
            <Button
              key={thread.id}
              variant="ghost"
              className={cn(
                'w-full justify-start text-left h-auto py-3',
                currentThreadId === thread.id && 'bg-secondary'
              )}
              onClick={() => onThreadSelect(thread.id)}
            >
              <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
              <div className="truncate">
                <div className="font-medium truncate">{thread.name}</div>
                {thread.last_message && (
                  <div className="text-xs text-muted-foreground truncate">
                    {thread.last_message}
                  </div>
                )}
              </div>
            </Button>
          ))}
          {isLoading && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading conversations...
            </div>
          )}
          {!isLoading && threads.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No conversations yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 