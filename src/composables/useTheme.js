import { ref, watch } from 'vue'
import { useAuth } from './useAuth'

// 支持三种主题模式：light, dark, system
const themeMode = ref(localStorage.getItem('themeMode') || 'system')
// 支持主题风格：default, ios26
const themeStyle = ref(localStorage.getItem('themeStyle') || 'default')
const isDark = ref(false)

// 检测系统主题
const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 应用主题
const applyTheme = () => {
  const currentTheme = themeMode.value === 'system' ? getSystemTheme() : themeMode.value
  isDark.value = currentTheme === 'dark'

  // 应用明暗模式
  if (currentTheme === 'dark') {
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
  }

  // 应用风格模式
  document.documentElement.classList.remove('style-default', 'style-ios26')
  document.documentElement.classList.add(`style-${themeStyle.value}`)
}

export function useTheme() {
  const { isAuthenticated, getAuthHeaders, apiRequest } = useAuth()

  // 保存主题到数据库
  const saveThemeToDB = async () => {
    if (!isAuthenticated.value) return

    try {
      await apiRequest('/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          settings: {
            themeMode: themeMode.value,
            themeStyle: themeStyle.value
          }
        })
      })
    } catch (error) {
      if (error.message === 'Token expired') {
        console.warn('Token expired, theme not saved to database')
      } else {
        console.error('Failed to save theme to database:', error)
      }
    }
  }

  // 从数据库加载主题
  const loadThemeFromDB = async () => {
    try {
      const response = await fetch('/api/settings', {
        headers: isAuthenticated.value ? getAuthHeaders() : {}
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          if (data.data.themeMode) {
            themeMode.value = data.data.themeMode
            localStorage.setItem('themeMode', themeMode.value)
          }
          if (data.data.themeStyle) {
            themeStyle.value = data.data.themeStyle
            localStorage.setItem('themeStyle', themeStyle.value)
          }
          applyTheme()
        }
      }
    } catch (error) {
      console.error('Failed to load theme from database:', error)
    }
  }

  // 设置主题模式
  const setThemeMode = async (mode) => {
    themeMode.value = mode
    localStorage.setItem('themeMode', mode)
    applyTheme()

    // 保存到数据库
    await saveThemeToDB()
  }

  // 设置主题风格
  const setThemeStyle = async (style) => {
    themeStyle.value = style
    localStorage.setItem('themeStyle', style)
    applyTheme()

    // 保存到数据库
    await saveThemeToDB()
  }

  // 循环切换主题：light -> dark -> system -> light
  const toggleTheme = async () => {
    const modes = ['light', 'dark', 'system']
    const currentIndex = modes.indexOf(themeMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    await setThemeMode(modes[nextIndex])
  }

  // 监听主题模式变化
  watch([themeMode, themeStyle], applyTheme, { immediate: true })

  // 监听系统主题变化（当模式为 system 时）
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (themeMode.value === 'system') {
        applyTheme()
      }
    }
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  }

  return {
    themeMode,
    themeStyle,
    isDark,
    setThemeMode,
    setThemeStyle,
    toggleTheme,
    loadThemeFromDB
  }
}

