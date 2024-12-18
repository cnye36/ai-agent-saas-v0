import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useChat } from 'ai/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusCircle, MessageSquare, Settings2, Hammer } from 'lucide-react'

interface AgentChatDialogProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  agentName: string
}

interface ChatSession {
  id: string
  name: string
  threadId: string
  messages: any[]
  createdAt: Date
}

export function AgentChatDialog({ isOpen, onClose, agentId, agentName }: AgentChatDialogProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/agents/${agentId}/chat`,
    id: currentSession?.threadId,
    body: {
      chatId: currentSession?.id,
      agentId,
      name: currentSession?.name || `Chat ${chatSessions.length + 1}`,
    },
    onError: (error) => {
      console.error('Chat error:', error)
      setError(error.message || 'Failed to get response from agent')
    }
  })

  const createNewSession = async () => {
    try {
      const chatName = `Chat ${chatSessions.length + 1}`
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: chatName,
          threadId: crypto.randomUUID(), // Generate a unique thread ID
        }),
      })
      
      if (!response.ok) throw new Error('Failed to create chat')
      
      const newSession = await response.json()
      setChatSessions(prev => [...prev, newSession])
      setCurrentSession(newSession)
    } catch (error) {
      console.error('Error creating chat:', error)
      setError('Failed to create new chat session')
    }
  }

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await fetch(`/api/agents/${agentId}/chat`)
        if (!response.ok) throw new Error('Failed to load chat sessions')
        const data = await response.json()
        setChatSessions(data)
        if (data.length > 0) {
          setCurrentSession(data[0]) // Set the most recent chat as current
        } else {
          // Create initial chat session if none exists
          createNewSession()
        }
      } catch (error) {
        console.error('Error loading sessions:', error)
        setError('Failed to load chat sessions')
      }
    }
    loadSessions()
  }, [agentId])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Chat with {agentName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-full">
          {/* Chat Sessions Sidebar */}
          <div className="w-64 border-r pr-4">
            <Button 
              onClick={createNewSession}
              className="w-full mb-4"
              variant="outline"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New Chat
            </Button>
            
            <ScrollArea className="h-[calc(100%-60px)]">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-2 rounded cursor-pointer hover:bg-accent ${
                    currentSession?.id === session.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setCurrentSession(session)}
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  {session.name}
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 pl-4">
            <Tabs defaultValue="chat">
              <TabsList>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="h-[calc(100%-40px)]">
                <div className="flex flex-col h-full">
                  <ScrollArea className="flex-1 mb-4">
                    {messages.map((message) => (
                      <div key={message.id} className="mb-4">
                        <p className="text-sm text-gray-500">
                          {message.role === 'user' ? 'You:' : 'Agent:'}
                        </p>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ))}
                  </ScrollArea>

                  {error && (
                    <div className="mb-4 p-4 border border-destructive rounded-lg bg-destructive text-destructive-foreground">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-auto">
                    <Textarea
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Type your message..."
                      className="mb-2"
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send'}
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="tools">
                <div className="grid grid-cols-2 gap-4">
                  {/* Tool cards will go here */}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 