import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'v11-cyberpunk'

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'dark',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'dark'
    }
    return 'dark'
  })

  useEffect(() => {
    // Remove all theme classes and attributes
    document.documentElement.classList.remove('dark', 'light')
    document.body.removeAttribute('data-theme')

    // Apply the new theme
    if (theme === 'v11-cyberpunk') {
      document.body.setAttribute('data-theme', 'v11-cyberpunk')
      document.documentElement.classList.add('dark') // Keep dark class for base styles
    } else {
      document.documentElement.classList.add(theme)
      document.body.setAttribute('data-theme', theme)
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
