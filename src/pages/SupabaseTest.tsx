// src/components/SupabaseTest.tsx
// A test component to verify your Supabase backend is working

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message?: string
  data?: any
}

export function SupabaseTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)

  const updateTest = (name: string, update: Partial<TestResult>) => {
    setTestResults(prev => 
      prev.map(test => 
        test.name === name ? { ...test, ...update } : test
      )
    )
  }

  const runTests = async () => {
    setTesting(true)
    
    // Initialize tests
    const tests: TestResult[] = [
      { name: 'Database Connection', status: 'pending' },
      { name: 'Edge Function Health', status: 'pending' },
      { name: 'Authentication', status: 'pending' },
      { name: 'Create Test Campaign', status: 'pending' },
      { name: 'Real-time Subscription', status: 'pending' }
    ]
    setTestResults(tests)

    // Test 1: Database Connection
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('count')
        .limit(1)
      
      if (error) throw error
      
      updateTest('Database Connection', {
        status: 'success',
        message: 'Connected to Supabase database'
      })
    } catch (error) {
      updateTest('Database Connection', {
        status: 'error',
        message: error.message
      })
    }

    // Test 2: Edge Function Health
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-inclufy/health`
      )
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Function call failed')
      
      updateTest('Edge Function Health', {
        status: 'success',
        message: 'Edge Functions are working',
        data
      })
    } catch (error) {
      updateTest('Edge Function Health', {
        status: 'error',
        message: 'Edge Functions not deployed or not working'
      })
    }

    // Test 3: Authentication
    try {
      // Try to sign in with test account or create one
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: 'test@inclufy.com',
        password: 'test123456',
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })

      if (signUpError && signUpError.message !== 'User already registered') {
        throw signUpError
      }

      // If user exists, sign in
      if (signUpError?.message === 'User already registered') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: 'test@inclufy.com',
          password: 'test123456'
        })
        if (signInError) throw signInError
      }

      updateTest('Authentication', {
        status: 'success',
        message: 'Authentication working'
      })

      // Test 4: Create Test Campaign
      try {
        const { data: campaign, error } = await supabase
          .from('campaigns')
          .insert({
            name: `Test Campaign ${Date.now()}`,
            type: 'email',
            status: 'draft',
            content: {
              subject: 'Test Subject',
              body: 'Test email body'
            }
          })
          .select()
          .single()

        if (error) throw error

        updateTest('Create Test Campaign', {
          status: 'success',
          message: 'Successfully created campaign',
          data: campaign
        })

        // Clean up - delete test campaign
        await supabase
          .from('campaigns')
          .delete()
          .eq('id', campaign.id)

      } catch (error) {
        updateTest('Create Test Campaign', {
          status: 'error',
          message: error.message
        })
      }

      // Test 5: Real-time Subscription
      try {
        const channel = supabase
          .channel('test-channel')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'campaigns'
            },
            () => {
              updateTest('Real-time Subscription', {
                status: 'success',
                message: 'Real-time subscriptions working'
              })
            }
          )
          .subscribe()

        // Wait 2 seconds to check subscription
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        if (channel.state === 'joined') {
          updateTest('Real-time Subscription', {
            status: 'success',
            message: 'Real-time subscriptions working'
          })
        } else {
          throw new Error('Could not establish real-time connection')
        }

        // Cleanup
        supabase.removeChannel(channel)

      } catch (error) {
        updateTest('Real-time Subscription', {
          status: 'error',
          message: error.message
        })
      }

      // Sign out test user
      await supabase.auth.signOut()

    } catch (error) {
      updateTest('Authentication', {
        status: 'error',
        message: error.message
      })
    }

    setTesting(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Passed</Badge>
      case 'error':
        return <Badge variant="destructive">Failed</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const allTestsPassed = testResults.length > 0 && 
    testResults.every(test => test.status === 'success')

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Backend Test</CardTitle>
        <CardDescription>
          Verify that your Inclufy backend is properly configured
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run All Tests'
          )}
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((test) => (
              <div
                key={test.name}
                className="flex items-start justify-between p-3 border rounded-lg"
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h4 className="font-medium">{test.name}</h4>
                    {test.message && (
                      <p className="text-sm text-muted-foreground">
                        {test.message}
                      </p>
                    )}
                    {test.data && (
                      <pre className="text-xs mt-1 p-2 bg-gray-100 rounded">
                        {JSON.stringify(test.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>
            ))}
          </div>
        )}

        {allTestsPassed && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">
              🎉 All Tests Passed!
            </h3>
            <p className="text-sm text-green-800">
              Your Inclufy backend is properly configured and ready to use.
              You can now start building your marketing automation features.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Usage in your app:
// 1. Create the required folders and files:
//    - src/lib/supabase/client.ts
//    - Set up your .env.local with Supabase credentials
// 2. Add this component to a page to test
// 3. Deploy the test-inclufy edge function first