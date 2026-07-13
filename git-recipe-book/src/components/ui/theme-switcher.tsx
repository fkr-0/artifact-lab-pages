import React from 'react'
import { Monitor, Cpu, Sparkles, ChevronDown } from 'lucide-react'
import { Button } from './button'

interface Theme {
  id: string
  name: string
  icon: React.ReactNode
  description: string
}

const themes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    icon: <Monitor className="w-4 h-4" />,
    description: 'Clean light theme',
  },
  {
    id: 'dark',
    name: 'Dark',
    icon: <Monitor className="w-4 h-4" />,
    description: 'Professional dark theme',
  },
  {
    id: 'v11-cyberpunk',
    name: 'V11 Cyberpunk',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'NEXUS v11 cyberpunk aesthetic',
  },
]

interface ThemeSwitcherProps {
  currentTheme?: string
  onThemeChange?: (theme: string) => void
  variant?: 'dropdown' | 'buttons'
}

export function ThemeSwitcher({
  currentTheme = 'dark',
  onThemeChange,
  variant = 'buttons',
}: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const handleThemeChange = (theme: string) => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark')
    if (theme !== 'v11-cyberpunk') {
      document.documentElement.classList.add(theme)
    }
    document.body.setAttribute('data-theme', theme)

    // Store preference
    localStorage.setItem('git-recipe-book-theme', theme)

    onThemeChange?.(theme)
    setIsOpen(false)
  }

  React.useEffect(() => {
    // Load saved theme on mount
    const savedTheme = localStorage.getItem('git-recipe-book-theme') || 'dark'
    handleThemeChange(savedTheme)

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentThemeData = themes.find((t) => t.id === currentTheme)

  if (variant === 'dropdown') {
    return (
      <div ref={dropdownRef} className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2 w-[180px] justify-start"
        >
          {currentThemeData?.icon}
          <span className="flex-1 text-left">{currentThemeData?.name}</span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-[280px] bg-popover border border-border rounded-lg shadow-lg z-50 p-1">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left"
              >
                {theme.icon}
                <div className="flex-1">
                  <div className="font-medium text-sm">{theme.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {theme.description}
                  </div>
                </div>
                {currentTheme === theme.id && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
      {themes.map((theme) => (
        <Button
          key={theme.id}
          variant={currentTheme === theme.id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleThemeChange(theme.id)}
          className="gap-2"
          title={theme.description}
        >
          {theme.icon}
          <span className="hidden sm:inline">{theme.name}</span>
        </Button>
      ))}
    </div>
  )
}

export default ThemeSwitcher