import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', session.user.id)
      .single()

    if (error) throw error
    if (!agent) {
      return new NextResponse('Agent not found', { status: 404 })
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Error fetching agent:', error)
    return NextResponse.json(
      { error: 'Error fetching agent' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await request.json()
    const {
      name,
      description,
      model_type,
      prompt_template,
      tools,
      agent_type,
      config
    } = json

    const { data, error } = await supabase
      .from('agents')
      .update({
        name,
        description,
        model_type,
        prompt_template,
        tools,
        agent_type,
        config,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('owner_id', session.user.id)
      .select()
      .single()

    if (error) throw error
    if (!data) {
      return new NextResponse('Agent not found', { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating agent:', error)
    return NextResponse.json(
      { error: 'Error updating agent' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', session.user.id)

    if (error) throw error

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'Error deleting agent' },
      { status: 500 }
    )
  }
}