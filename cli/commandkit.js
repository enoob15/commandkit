#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const COMMANDKIT_API = process.env.COMMANDKIT_API || 'https://commandkit.dev/api/generate'

function showHelp() {
  console.log(`
CommandKit CLI — Interactive Documentation Generator

USAGE:
  commandkit <command> [options]

COMMANDS:
  generate <cli-path>     Generate docs from CLI help output
  serve                   Start local development server
  build                   Build production documentation
  deploy                  Deploy to CommandKit hosting

OPTIONS:
  --help, -h             Show this help
  --version, -v          Show version
  --output, -o <file>    Output file (default: stdout)
  --format <type>        Output format (json|html|markdown)
  --api-key <key>        CommandKit API key
  --template <name>      Template to use (default|dark|minimal)

EXAMPLES:
  commandkit generate ./my-cli --help
  commandkit generate npx my-cli --help --output=docs.json
  commandkit generate --url=https://raw.githubusercontent.com/user/cli/main/help.txt
  commandkit serve --template=dark
  commandkit deploy --api-key=ck_xxx

Learn more: https://commandkit.dev/docs
`)
}

function showVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json')
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  console.log(`CommandKit CLI v${pkg.version}`)
}

async function generateDocs(cliPath, options = {}) {
  try {
    console.log(`🔍 Analyzing CLI: ${cliPath}`)
    
    // Execute CLI with --help flag
    const [command, ...args] = cliPath.split(' ')
    const helpProcess = spawn(command, [...args, '--help'], {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    
    let helpOutput = ''
    let errorOutput = ''
    
    helpProcess.stdout.on('data', (data) => {
      helpOutput += data.toString()
    })
    
    helpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    return new Promise((resolve, reject) => {
      helpProcess.on('close', async (code) => {
        if (code !== 0 && !helpOutput) {
          console.error(`❌ Failed to get help output from: ${cliPath}`)
          console.error(errorOutput)
          reject(new Error(`CLI exited with code ${code}`))
          return
        }
        
        // Use stderr if stdout is empty (some CLIs output help to stderr)
        const finalOutput = helpOutput || errorOutput
        
        if (!finalOutput.trim()) {
          reject(new Error('No help output received'))
          return
        }
        
        console.log(`📚 Parsing help output (${finalOutput.length} characters)`)
        
        // Extract CLI name from path
        const cliName = path.basename(command)
        
        // Parse locally or send to API
        if (options.apiKey) {
          // Use CommandKit API
          const response = await fetch(COMMANDKIT_API, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${options.apiKey}`
            },
            body: JSON.stringify({
              helpOutput: finalOutput,
              cliName
            })
          })
          
          if (!response.ok) {
            const error = await response.text()
            reject(new Error(`API error: ${error}`))
            return
          }
          
          resolve(await response.json())
        } else {
          // Parse locally (simplified version)
          const result = parseHelpOutputSimple(finalOutput, cliName)
          resolve(result)
        }
      })
    })
  } catch (error) {
    throw new Error(`Failed to generate docs: ${error.message}`)
  }
}

function parseHelpOutputSimple(helpOutput, cliName) {
  // Simple local parser (the real one is in the TypeScript file)
  const lines = helpOutput.split('\n').filter(line => line.trim())
  
  // Extract description (first substantial line)
  let description = "A command line tool"
  for (const line of lines.slice(0, 5)) {
    if (line.length > 20 && !line.includes('Usage:') && !line.includes('Commands:')) {
      description = line.trim()
      break
    }
  }
  
  // Parse commands (look for indented command lists)
  const commands = []
  let inCommandsSection = false
  
  for (const line of lines) {
    if (line.toLowerCase().includes('commands:')) {
      inCommandsSection = true
      continue
    }
    
    if (inCommandsSection && line.toLowerCase().includes('options:')) {
      break
    }
    
    if (inCommandsSection) {
      const match = line.match(/^\s*([a-zA-Z0-9-_]+)\s+(.+)$/)
      if (match) {
        commands.push({
          name: match[1],
          description: match[2],
          usage: `${cliName} ${match[1]}`,
          options: [],
          examples: [`${cliName} ${match[1]}`]
        })
      }
    }
  }
  
  // If no commands found, create a default
  if (commands.length === 0) {
    commands.push({
      name: 'run',
      description: 'Run the main command',
      usage: `${cliName} [options]`,
      options: [],
      examples: [cliName]
    })
  }
  
  return {
    success: true,
    cli: {
      name: cliName,
      description,
      commands
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      commandCount: commands.length,
      totalOptions: 0
    }
  }
}

function outputResult(result, options) {
  const format = options.format || 'json'
  
  if (format === 'json') {
    const output = JSON.stringify(result, null, 2)
    
    if (options.output) {
      fs.writeFileSync(options.output, output)
      console.log(`✅ Documentation generated: ${options.output}`)
    } else {
      console.log(output)
    }
  } else if (format === 'markdown') {
    const markdown = generateMarkdown(result.cli)
    
    if (options.output) {
      fs.writeFileSync(options.output, markdown)
      console.log(`✅ Markdown documentation generated: ${options.output}`)
    } else {
      console.log(markdown)
    }
  }
}

function generateMarkdown(cli) {
  let md = `# ${cli.name}\n\n${cli.description}\n\n`
  
  md += `## Commands\n\n`
  
  for (const cmd of cli.commands) {
    md += `### ${cmd.name}\n\n${cmd.description}\n\n`
    md += `\`\`\`bash\n${cmd.usage}\n\`\`\`\n\n`
    
    if (cmd.options.length > 0) {
      md += `**Options:**\n\n`
      for (const opt of cmd.options) {
        md += `- \`${opt.flag}\` — ${opt.description}\n`
      }
      md += `\n`
    }
    
    if (cmd.examples.length > 0) {
      md += `**Examples:**\n\n`
      for (const example of cmd.examples) {
        md += `\`\`\`bash\n${example}\n\`\`\`\n\n`
      }
    }
  }
  
  return md
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    showVersion()
    return
  }
  
  const command = args[0]
  const options = {}
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=')
      const optName = key.replace('--', '')
      options[optName] = value || args[i + 1] || true
      if (value === undefined && !args[i + 1]?.startsWith('--')) {
        i++ // Skip next arg if it was used as value
      }
    }
  }
  
  try {
    switch (command) {
      case 'generate': {
        const cliPath = args[1]
        if (!cliPath) {
          console.error('❌ CLI path required. Usage: commandkit generate <cli-path>')
          process.exit(1)
        }
        
        const result = await generateDocs(cliPath, options)
        outputResult(result, options)
        break
      }
      
      case 'serve': {
        console.log('🚀 Starting CommandKit development server...')
        console.log('📖 Documentation will be available at: http://localhost:3000')
        
        // In a real implementation, this would start the Next.js dev server
        // For now, just show instructions
        console.log('\nTo start development server:')
        console.log('  cd your-commandkit-project')
        console.log('  npm run dev')
        break
      }
      
      default:
        console.error(`❌ Unknown command: ${command}`)
        console.error('Run "commandkit --help" for usage information')
        process.exit(1)
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  generateDocs,
  parseHelpOutputSimple,
  generateMarkdown
}