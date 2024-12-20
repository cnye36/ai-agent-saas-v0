import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle, Settings2, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { deleteAgent } from '@/app/api/agents/[id]/delete/action'
import { AgentChatDialog } from '@/components/agents/AgentChatDialog'

export default async function AgentsPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">My Agents</h1>
        <div className="text-red-500">Error fetching user: {userError?.message}</div>
      </div>
    )
  }

  // First get the agents
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (agentsError) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">My Agents</h1>
        <div className="text-red-500">Error fetching agents: {agentsError.message}</div>
      </div>
    )
  }

  // Then get the tools for each agent
  const agentsWithTools = await Promise.all(
    agents.map(async (agent) => {
      const { data: tools } = await supabase
        .from('workflow_agents')
        .select('*')
        .eq('agent_id', agent.id)
      
      return {
        ...agent,
        tools: tools || []
      }
    })
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Link href="/agents/new">
          <Button>
            <PlusCircle className="mr-2" />
            Create Agent
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentsWithTools.map((agent) => (
          <div
            key={agent.id}
            className="border rounded-lg p-6 hover:border-primary transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{agent.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {agent.description || 'No description provided'}
                </p>
              </div>
              <div className="flex space-x-2">
                <AgentChatDialog 
                  agentId={agent.id} 
                  agentName={agent.name}
                  description={agent.description}
                  modelType={agent.model_type}
                  tools={agent.tools}
                />
                <Link href={`/agents/${agent.id}/edit`}>
                  <Button variant="ghost" size="icon">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </Link>
                <form action={deleteAgent.bind(null, agent.id)}>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="flex items-center">
                Model: {agent.model_type}
              </span>
              <span className="mx-2">•</span>
              <span>
                {agent.tools?.length || 0} tools
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 