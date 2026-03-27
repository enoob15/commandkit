import { NextRequest, NextResponse } from 'next/server'
import { CLIParser } from '@/lib/cli-parser'

export async function POST(request: NextRequest) {
  try {
    const { helpOutput, cliName, url } = await request.json()
    
    if (!helpOutput && !url) {
      return NextResponse.json(
        { error: 'Either helpOutput or url must be provided' },
        { status: 400 }
      )
    }
    
    let finalHelpOutput = helpOutput
    let finalCliName = cliName || 'cli'
    
    // If URL provided, fetch help output
    if (url) {
      try {
        // For security, only allow certain domains or patterns
        if (!url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
          return NextResponse.json(
            { error: 'Only GitHub URLs are currently supported for security reasons' },
            { status: 400 }
          )
        }
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }
        
        finalHelpOutput = await response.text()
        
        // Try to extract CLI name from URL
        const urlMatch = url.match(/github\.com\/[^/]+\/([^/]+)/)
        if (urlMatch && !cliName) {
          finalCliName = urlMatch[1]
        }
      } catch (fetchError) {
        return NextResponse.json(
          { error: `Failed to fetch help output from URL: ${fetchError}` },
          { status: 400 }
        )
      }
    }
    
    if (!finalHelpOutput) {
      return NextResponse.json(
        { error: 'No help output to parse' },
        { status: 400 }
      )
    }
    
    // Parse the help output
    const parsedCLI = CLIParser.parseHelpOutput(finalHelpOutput, finalCliName)
    
    // Enhance commands with better examples
    parsedCLI.commands = parsedCLI.commands.map(cmd => ({
      ...cmd,
      examples: CLIParser.generateExamples(cmd, parsedCLI.name)
    }))
    
    // Generate metadata for the docs
    const metadata = {
      generatedAt: new Date().toISOString(),
      sourceUrl: url || null,
      commandCount: parsedCLI.commands.length,
      totalOptions: parsedCLI.commands.reduce((sum, cmd) => sum + cmd.options.length, 0)
    }
    
    return NextResponse.json({
      success: true,
      cli: parsedCLI,
      metadata
    })
    
  } catch (error) {
    console.error('Error generating CLI docs:', error)
    return NextResponse.json(
      { error: 'Failed to parse CLI help output' },
      { status: 500 }
    )
  }
}

// For development/testing
export async function GET() {
  // Return sample parsed CLI for demo
  const sampleCLI = {
    name: "sample-cli",
    description: "A sample CLI tool for demonstration",
    commands: [
      {
        name: "build",
        description: "Build your project",
        usage: "sample-cli build [options]",
        options: [
          {
            flag: "--env",
            description: "Build environment (dev|prod)",
            type: "select" as const,
            values: ["dev", "prod"],
            default: "dev"
          },
          {
            flag: "--watch",
            description: "Watch for changes",
            type: "boolean" as const,
            default: false
          }
        ],
        examples: [
          "sample-cli build",
          "sample-cli build --env=prod",
          "sample-cli build --env=dev --watch"
        ]
      }
    ]
  }
  
  return NextResponse.json({
    success: true,
    cli: sampleCLI,
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceUrl: null,
      commandCount: 1,
      totalOptions: 2
    }
  })
}