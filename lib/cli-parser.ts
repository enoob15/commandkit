// CLI Help Output Parser
// Parses CLI help text and converts to CommandKit format

export interface ParsedOption {
  flag: string
  description: string
  type: 'boolean' | 'select' | 'number' | 'string'
  values?: string[]
  default: any
  required?: boolean
}

export interface ParsedCommand {
  name: string
  description: string
  usage: string
  options: ParsedOption[]
  examples: string[]
  subcommands?: ParsedCommand[]
}

export interface ParsedCLI {
  name: string
  description: string
  version?: string
  commands: ParsedCommand[]
  globalOptions?: ParsedOption[]
}

export class CLIParser {
  static parseHelpOutput(helpText: string, cliName: string = 'cli'): ParsedCLI {
    const lines = helpText.split('\n').map(line => line.trim()).filter(Boolean)
    
    // Extract CLI description (usually first few lines)
    const description = this.extractDescription(lines)
    
    // Parse commands section
    const commands = this.parseCommands(lines, cliName)
    
    // Parse global options if present
    const globalOptions = this.parseGlobalOptions(lines)
    
    return {
      name: cliName,
      description,
      commands,
      globalOptions
    }
  }
  
  private static extractDescription(lines: string[]): string {
    // Look for common description patterns
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i]
      
      // Skip usage lines, command headers, etc.
      if (
        line.toLowerCase().includes('usage:') ||
        line.toLowerCase().includes('commands:') ||
        line.toLowerCase().includes('options:') ||
        line.startsWith('-') ||
        line.match(/^\w+\s+\w+/)  // Looks like "command description"
      ) {
        continue
      }
      
      // If it's a substantial line, likely a description
      if (line.length > 20) {
        return line
      }
    }
    
    return "A powerful command line tool"
  }
  
  private static parseCommands(lines: string[], cliName: string): ParsedCommand[] {
    const commands: ParsedCommand[] = []
    let inCommandsSection = false
    let currentCommand: Partial<ParsedCommand> | null = null
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Detect commands section
      if (line.toLowerCase().includes('commands:')) {
        inCommandsSection = true
        continue
      }
      
      // End of commands section
      if (inCommandsSection && (
        line.toLowerCase().includes('options:') ||
        line.toLowerCase().includes('flags:') ||
        line.toLowerCase().includes('examples:')
      )) {
        inCommandsSection = false
      }
      
      if (inCommandsSection) {
        // Parse command line: "  deploy    Deploy your application"
        const commandMatch = line.match(/^\s*([a-zA-Z0-9-_]+)\s+(.+)$/)
        if (commandMatch) {
          // Save previous command
          if (currentCommand && currentCommand.name) {
            commands.push(this.finalizeCommand(currentCommand, cliName))
          }
          
          // Start new command
          currentCommand = {
            name: commandMatch[1],
            description: commandMatch[2],
            usage: `${cliName} ${commandMatch[1]}`,
            options: [],
            examples: [`${cliName} ${commandMatch[1]}`]
          }
        }
      }
    }
    
    // Don't forget the last command
    if (currentCommand && currentCommand.name) {
      commands.push(this.finalizeCommand(currentCommand, cliName))
    }
    
    // If no commands found, create a default based on CLI name
    if (commands.length === 0) {
      commands.push({
        name: 'run',
        description: 'Run the main command',
        usage: `${cliName} [options]`,
        options: this.parseOptionsFromHelp(lines),
        examples: [cliName]
      })
    }
    
    return commands
  }
  
  private static parseGlobalOptions(lines: string[]): ParsedOption[] {
    return this.parseOptionsFromHelp(lines)
  }
  
  private static parseOptionsFromHelp(lines: string[]): ParsedOption[] {
    const options: ParsedOption[] = []
    let inOptionsSection = false
    
    for (const line of lines) {
      // Detect options section
      if (line.toLowerCase().includes('options:') || line.toLowerCase().includes('flags:')) {
        inOptionsSection = true
        continue
      }
      
      // End of options section
      if (inOptionsSection && line.match(/^[A-Z][A-Z\s]+:$/)) {
        inOptionsSection = false
      }
      
      if (inOptionsSection) {
        // Parse option lines like: "  -e, --env <env>    Environment to deploy to"
        const optionMatch = line.match(/^\s*(?:(-\w),?\s*)?(?:(--[\w-]+)(?:\s*(?:<(\w+)>|=?(\w+)))?)\s+(.+)$/)
        if (optionMatch) {
          const [, shortFlag, longFlag, argName, defaultValue, description] = optionMatch
          
          const flag = longFlag || shortFlag
          if (!flag) continue
          
          // Infer type from description and argument name
          let type: ParsedOption['type'] = 'string'
          let values: string[] | undefined
          let defaultVal: any = false
          
          const descLower = description.toLowerCase()
          
          if (!argName || descLower.includes('flag') || descLower.includes('enable') || descLower.includes('disable')) {
            type = 'boolean'
            defaultVal = false
          } else if (argName === 'number' || descLower.includes('number') || descLower.includes('count')) {
            type = 'number'
            defaultVal = 0
          } else if (descLower.includes('(') && descLower.includes('|')) {
            // Extract options like "(dev|staging|prod)"
            const optionsMatch = description.match(/\(([^)]+)\)/)
            if (optionsMatch) {
              values = optionsMatch[1].split('|').map(v => v.trim())
              type = 'select'
              defaultVal = values[0]
            }
          }
          
          // Override with explicit default value if found
          if (defaultValue) {
            defaultVal = type === 'number' ? parseInt(defaultValue) : defaultValue
          }
          
          options.push({
            flag,
            description,
            type,
            values,
            default: defaultVal
          })
        }
      }
    }
    
    return options
  }
  
  private static finalizeCommand(cmd: Partial<ParsedCommand>, cliName: string): ParsedCommand {
    return {
      name: cmd.name || 'command',
      description: cmd.description || 'Run a command',
      usage: cmd.usage || `${cliName} ${cmd.name}`,
      options: cmd.options || [],
      examples: cmd.examples || [`${cliName} ${cmd.name}`]
    }
  }
  
  // Generate additional examples based on options
  static generateExamples(command: ParsedCommand, cliName: string): string[] {
    const examples: string[] = [command.examples?.[0] || `${cliName} ${command.name}`]
    
    // Generate examples with common option combinations
    if (command.options.length > 0) {
      // Example with all defaults
      const withDefaults = this.buildExampleCommand(cliName, command.name, command.options, 'defaults')
      if (withDefaults !== examples[0]) {
        examples.push(withDefaults)
      }
      
      // Example with some realistic values
      const withValues = this.buildExampleCommand(cliName, command.name, command.options, 'realistic')
      if (withValues !== examples[0] && withValues !== examples[1]) {
        examples.push(withValues)
      }
    }
    
    return examples.slice(0, 3) // Limit to 3 examples
  }
  
  private static buildExampleCommand(cliName: string, commandName: string, options: ParsedOption[], mode: 'defaults' | 'realistic'): string {
    let cmd = `${cliName} ${commandName}`
    
    for (const option of options.slice(0, 3)) { // Limit options in examples
      if (option.type === 'boolean' && mode === 'realistic') {
        cmd += ` ${option.flag}`
      } else if (option.type === 'select' && option.values) {
        const value = mode === 'realistic' ? (option.values[1] || option.values[0]) : option.values[0]
        cmd += ` ${option.flag}=${value}`
      } else if (option.type === 'number') {
        const value = mode === 'realistic' ? '100' : option.default
        cmd += ` ${option.flag}=${value}`
      } else if (option.type === 'string' && mode === 'realistic') {
        cmd += ` ${option.flag}=value`
      }
    }
    
    return cmd
  }
}