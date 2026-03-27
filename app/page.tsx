'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CommandLineIcon, 
  DocumentTextIcon, 
  ClipboardDocumentIcon,
  PlayIcon,
  CheckIcon,
  ChevronDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow, prism } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Mock CLI data for demo
const mockCliData = {
  name: "myapp",
  description: "A powerful CLI tool for developers",
  commands: [
    {
      name: "deploy",
      description: "Deploy your application",
      usage: "myapp deploy [options]",
      options: [
        { flag: "--env", description: "Environment (dev|staging|prod)", type: "select" as const, values: ["dev", "staging", "prod"], default: "dev" },
        { flag: "--force", description: "Force deployment", type: "boolean" as const, default: false },
        { flag: "--region", description: "Deployment region", type: "select" as const, values: ["us-east-1", "us-west-2", "eu-west-1"], default: "us-east-1" }
      ],
      examples: [
        "myapp deploy --env=prod",
        "myapp deploy --env=staging --force",
        "myapp deploy --env=prod --region=eu-west-1"
      ]
    },
    {
      name: "logs",
      description: "View application logs",
      usage: "myapp logs [options]",
      options: [
        { flag: "--tail", description: "Number of lines to show", type: "number" as const, default: 100 },
        { flag: "--follow", description: "Follow log output", type: "boolean" as const, default: false },
        { flag: "--level", description: "Log level filter", type: "select" as const, values: ["error", "warn", "info", "debug"], default: "info" }
      ],
      examples: [
        "myapp logs --tail=50",
        "myapp logs --follow --level=error",
        "myapp logs --tail=1000 --level=debug"
      ]
    }
  ]
}

interface CommandOption {
  flag: string
  description: string
  type: 'boolean' | 'select' | 'number' | 'string'
  values?: string[]
  default: any
}

interface Command {
  name: string
  description: string
  usage: string
  options: CommandOption[]
  examples: string[]
}

const CommandPlayground = ({ command }: { command: Command }) => {
  const [options, setOptions] = useState<Record<string, any>>({})
  const [copied, setCopied] = useState(false)

  // Initialize with defaults
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    command.options.forEach(opt => {
      defaultOptions[opt.flag] = opt.default
    })
    setOptions(defaultOptions)
  }, [command])

  const generateCommand = () => {
    let cmd = `${mockCliData.name} ${command.name}`
    
    Object.entries(options).forEach(([flag, value]) => {
      const option = command.options.find(opt => opt.flag === flag)
      if (!option) return
      
      if (option.type === 'boolean' && value) {
        cmd += ` ${flag}`
      } else if (option.type !== 'boolean' && value !== option.default) {
        cmd += ` ${flag}=${value}`
      }
    })
    
    return cmd
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generateCommand())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const updateOption = (flag: string, value: any) => {
    setOptions(prev => ({ ...prev, [flag]: value }))
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <PlayIcon className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">{command.name}</h3>
        <span className="text-sm text-gray-500">{command.description}</span>
      </div>

      {/* Options */}
      <div className="space-y-4 mb-6">
        {command.options.map((option) => (
          <div key={option.flag} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {option.flag}
              </code>
              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
            </div>
            
            <div>
              {option.type === 'boolean' ? (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options[option.flag] || false}
                    onChange={(e) => updateOption(option.flag, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm">Enabled</span>
                </label>
              ) : option.type === 'select' ? (
                <select
                  value={options[option.flag] || option.default}
                  onChange={(e) => updateOption(option.flag, e.target.value)}
                  className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm"
                >
                  {option.values?.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={option.type}
                  value={options[option.flag] || option.default}
                  onChange={(e) => updateOption(option.flag, option.type === 'number' ? parseInt(e.target.value) || option.default : e.target.value)}
                  className="w-full rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Generated Command */}
      <div className="relative group">
        <div className="bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-sm">
          <div className="text-green-400">
            $ {generateCommand()}
          </div>
        </div>
        
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1"
        >
          {copied ? (
            <>
              <CheckIcon className="w-3 h-3" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  )
}

const FeatureCard = ({ icon: Icon, title, description }: { 
  icon: React.ComponentType<{ className?: string }>, 
  title: string, 
  description: string 
}) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow"
  >
    <Icon className="w-8 h-8 text-blue-500 mb-4" />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </motion.div>
)

export default function HomePage() {
  const [activeCommand, setActiveCommand] = useState(0)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <CommandLineIcon className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold">CommandKit</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Pricing</a>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Stop writing docs.<br />
            <span className="text-blue-600">Start showing commands.</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Turn any CLI tool into beautiful, interactive documentation that users actually want to use. 
            Generate docs automatically, embed anywhere, track usage.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors">
              Try the Demo
            </button>
            <button className="border border-gray-300 hover:border-gray-400 text-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:border-gray-500 px-8 py-4 rounded-lg font-medium text-lg transition-colors">
              View on GitHub
            </button>
          </div>
        </motion.div>

        {/* Interactive Demo */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-20"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Interactive CLI Playground
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Try modifying the options below and watch the command update in real-time
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-xl">
            {/* Command Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              {mockCliData.commands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCommand(idx)}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    activeCommand === idx 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  {cmd.name}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeCommand}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CommandPlayground command={mockCliData.commands[activeCommand]} />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          id="features"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need for CLI documentation
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From automatic generation to embeddable widgets, CommandKit has all the tools 
              you need to create documentation that developers love.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={SparklesIcon}
              title="Auto-Generated"
              description="Parse your CLI's help output automatically. No manual documentation needed."
            />
            <FeatureCard 
              icon={PlayIcon}
              title="Interactive Playground"
              description="Users can modify parameters and see commands update in real-time."
            />
            <FeatureCard 
              icon={ClipboardDocumentIcon}
              title="Copy-Paste Ready"
              description="Every command is one-click copyable with syntax highlighting."
            />
            <FeatureCard 
              icon={DocumentTextIcon}
              title="Embeddable Widget"
              description="Drop beautiful CLI docs into any website or README file."
            />
            <FeatureCard 
              icon={ChevronDownIcon}
              title="Usage Analytics"
              description="Track which commands are popular and where users get stuck."
            />
            <FeatureCard 
              icon={CheckIcon}
              title="Zero Maintenance"
              description="Docs update automatically when your CLI changes."
            />
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div 
          id="pricing"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Free",
                price: "$0",
                description: "Perfect for getting started",
                features: ["1 CLI tool", "Basic docs", "CommandKit branding", "Community support"]
              },
              {
                name: "Pro",
                price: "$19",
                description: "For serious developers",
                features: ["Unlimited CLI tools", "Custom domain", "Usage analytics", "API access", "Email support"],
                popular: true
              },
              {
                name: "Team",
                price: "$49",
                description: "For teams and organizations",
                features: ["Everything in Pro", "Multiple users", "Private docs", "White-label embed", "Priority support"]
              }
            ].map((plan) => (
              <div key={plan.name} className={`relative rounded-xl border p-6 ${plan.popular ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.price !== "$0" && <span className="text-gray-500">/month</span>}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  plan.popular 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'border border-gray-300 hover:border-gray-400 text-gray-700 dark:text-gray-300 dark:border-gray-600'
                }`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center bg-blue-600 rounded-2xl p-12 text-white"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to transform your CLI documentation?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of developers who've made their CLIs more accessible
          </p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-100 transition-colors">
            Start Building Today
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CommandLineIcon className="w-6 h-6" />
              <span className="font-bold">CommandKit</span>
            </div>
            <div className="text-sm text-gray-400">
              Built during Alice's 4AM Creation Shift on 2026-03-27
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}