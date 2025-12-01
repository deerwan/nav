import { ref, watch } from 'vue'
import { useAuth } from './useAuth'

const showSearch = ref(localStorage.getItem('showSearch') !== 'false')
const hideEmptyCategories = ref(localStorage.getItem('hideEmptyCategories') === 'true')
const customTitle = ref(localStorage.getItem('customTitle') || '📚 书签管理')
const footerContent = ref(localStorage.getItem('footerContent') || '<p>Made with ❤️ using <a href="https://github.com/deerwan/nav" target="_blank">Vue 3 and Cloudflare</a></p>')
const activeSettingsTab = ref(localStorage.getItem('activeSettingsTab') || 'appearance')
const publicMode = ref(localStorage.getItem('publicMode') !== 'false')
const randomWallpaper = ref(localStorage.getItem('randomWallpaper') === 'true')
const wallpaperApi = ref(localStorage.getItem('wallpaperApi') || '')
const displayMode = ref(localStorage.getItem('displayMode') || 'standard')
const avatarUrl = ref(localStorage.getItem('avatarUrl') || '')

// 加载标志位，避免循环触发
const isLoadingFromDB = ref(false)

export function useSettings() {
  const { isAuthenticated, getAuthHeaders, apiRequest } = useAuth()
  
  // 从数据库加载设置（未登录用户也可以访问）
  const loadSettingsFromDB = async () => {
    isLoadingFromDB.value = true
    try {
      const response = await fetch('/api/settings', {
        headers: isAuthenticated.value ? getAuthHeaders() : {}
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // 更新设置值，不触发 watch
          if (data.data.customTitle) {
            customTitle.value = data.data.customTitle
            localStorage.setItem('customTitle', data.data.customTitle)
          }
          if (data.data.footerContent) {
            footerContent.value = data.data.footerContent
            localStorage.setItem('footerContent', data.data.footerContent)
          }
          if (data.data.showSearch !== undefined) {
            showSearch.value = data.data.showSearch === 'true'
            localStorage.setItem('showSearch', data.data.showSearch)
          }
          if (data.data.hideEmptyCategories !== undefined) {
            hideEmptyCategories.value = data.data.hideEmptyCategories === 'true'
            localStorage.setItem('hideEmptyCategories', data.data.hideEmptyCategories)
          }
          if (data.data.activeSettingsTab) {
            activeSettingsTab.value = data.data.activeSettingsTab
            localStorage.setItem('activeSettingsTab', data.data.activeSettingsTab)
          }
          if (data.data.publicMode !== undefined) {
            publicMode.value = data.data.publicMode === 'true'
            localStorage.setItem('publicMode', data.data.publicMode)
          }
          if (data.data.randomWallpaper !== undefined) {
            randomWallpaper.value = data.data.randomWallpaper === 'true'
            localStorage.setItem('randomWallpaper', data.data.randomWallpaper)
          }
          if (data.data.wallpaperApi) {
            wallpaperApi.value = data.data.wallpaperApi
            localStorage.setItem('wallpaperApi', data.data.wallpaperApi)
          }
          if (data.data.displayMode) {
            displayMode.value = data.data.displayMode
            localStorage.setItem('displayMode', data.data.displayMode)
          }
          if (data.data.avatarUrl !== undefined) {
            avatarUrl.value = data.data.avatarUrl || ''
            localStorage.setItem('avatarUrl', data.data.avatarUrl || '')
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings from database:', error)
    } finally {
      isLoadingFromDB.value = false
    }
  }
  
  // 保存设置到数据库
  const saveSettingsToDB = async (settings) => {
    if (!isAuthenticated.value) return
    
    try {
      await apiRequest('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ settings })
      })
    } catch (error) {
      if (error.message === 'Token expired') {
        console.warn('Token expired, settings not saved to database')
        // apiRequest 已经自动调用了 logout()，这里不需要额外处理
      } else {
        console.error('Failed to save settings to database:', error)
      }
    }
  }
  
  const toggleSearch = async () => {
    showSearch.value = !showSearch.value
    localStorage.setItem('showSearch', showSearch.value.toString())
    
    // 保存到数据库
    await saveSettingsToDB({ showSearch: showSearch.value.toString() })
  }
  
  const toggleHideEmptyCategories = async () => {
    hideEmptyCategories.value = !hideEmptyCategories.value
    localStorage.setItem('hideEmptyCategories', hideEmptyCategories.value.toString())
    
    // 保存到数据库
    await saveSettingsToDB({ hideEmptyCategories: hideEmptyCategories.value.toString() })
  }
  
  const updateCustomTitle = async (title) => {
    const newTitle = title || '📚 书签管理'
    customTitle.value = newTitle
    localStorage.setItem('customTitle', newTitle)
    
    // 保存到数据库
    await saveSettingsToDB({ customTitle: newTitle })
  }
  
  const updateFooterContent = async (content) => {
    const newContent = content || '<p>Made with ❤️ using <a href="https://github.com/deerwan/nav" target="_blank">Vue 3 and Cloudflare</a></p>'
    footerContent.value = newContent
    localStorage.setItem('footerContent', newContent)
    
    // 保存到数据库
    await saveSettingsToDB({ footerContent: newContent })
  }
  
  const setActiveSettingsTab = async (tab) => {
    activeSettingsTab.value = tab
    localStorage.setItem('activeSettingsTab', tab)
    
    // 保存到数据库
    await saveSettingsToDB({ activeSettingsTab: tab })
  }
  
  const togglePublicMode = async () => {
    publicMode.value = !publicMode.value
    localStorage.setItem('publicMode', publicMode.value.toString())
    
    await saveSettingsToDB({ publicMode: publicMode.value.toString() })
  }
  
  const toggleRandomWallpaper = async () => {
    randomWallpaper.value = !randomWallpaper.value
    localStorage.setItem('randomWallpaper', randomWallpaper.value.toString())
    
    await saveSettingsToDB({ randomWallpaper: randomWallpaper.value.toString() })
    
    // 如果启用壁纸，立即应用
    if (randomWallpaper.value) {
      applyWallpaper()
    } else {
      removeWallpaper()
    }
  }
  
  const updateWallpaperApi = async (apiUrl) => {
    wallpaperApi.value = apiUrl || ''
    localStorage.setItem('wallpaperApi', wallpaperApi.value)
    
    await saveSettingsToDB({ wallpaperApi: wallpaperApi.value })
    
    // 如果壁纸已启用，重新应用
    if (randomWallpaper.value && wallpaperApi.value) {
      applyWallpaper()
    } else if (randomWallpaper.value && !wallpaperApi.value) {
      removeWallpaper()
    }
  }
  
  const setDisplayMode = async (mode) => {
    displayMode.value = mode
    localStorage.setItem('displayMode', mode)
    
    await saveSettingsToDB({ displayMode: mode })
  }
  
  const updateAvatarUrl = async (url) => {
    avatarUrl.value = url || ''
    localStorage.setItem('avatarUrl', avatarUrl.value)
    
    await saveSettingsToDB({ avatarUrl: avatarUrl.value })
  }
  
  // 应用随机壁纸
  const applyWallpaper = () => {
    if (!randomWallpaper.value || !wallpaperApi.value) {
      removeWallpaper()
      return
    }
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    // 添加时间戳防止缓存
    const apiUrl = `${wallpaperApi.value}${wallpaperApi.value.includes('?') ? '&' : '?'}_t=${Date.now()}`
    
    img.onload = () => {
      document.body.style.backgroundImage = `url(${img.src})`
      document.body.style.backgroundSize = 'cover'
      document.body.style.backgroundPosition = 'center'
      document.body.style.backgroundRepeat = 'no-repeat'
      document.body.style.backgroundAttachment = 'fixed'
      // 添加遮罩层类
      document.body.classList.add('has-wallpaper')
    }
    
    img.onerror = () => {
      console.warn('Failed to load wallpaper from API:', wallpaperApi.value)
      // 如果加载失败，使用默认背景
      removeWallpaper()
    }
    
    img.src = apiUrl
  }
  
  // 移除壁纸
  const removeWallpaper = () => {
    document.body.style.backgroundImage = ''
    document.body.style.backgroundSize = ''
    document.body.style.backgroundPosition = ''
    document.body.style.backgroundRepeat = ''
    document.body.style.backgroundAttachment = ''
    // 移除遮罩层类
    document.body.classList.remove('has-wallpaper')
  }
  
  watch(showSearch, async (newValue) => {
    if (!isLoadingFromDB.value) {
      localStorage.setItem('showSearch', newValue.toString())
      if (isAuthenticated.value) {
        try {
          await apiRequest('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ settings: { showSearch: newValue.toString() } })
          })
        } catch (error) {
          if (error.message === 'Token expired') {
            console.warn('Token expired, showSearch not saved to database')
          }
        }
      }
    }
  })
  
  watch(hideEmptyCategories, async (newValue) => {
    if (!isLoadingFromDB.value) {
      localStorage.setItem('hideEmptyCategories', newValue.toString())
      if (isAuthenticated.value) {
        try {
          await apiRequest('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ settings: { hideEmptyCategories: newValue.toString() } })
          })
        } catch (error) {
          if (error.message === 'Token expired') {
            console.warn('Token expired, hideEmptyCategories not saved to database')
          }
        }
      }
    }
  })
  
  watch(customTitle, async (newValue) => {
    if (!isLoadingFromDB.value) {
      localStorage.setItem('customTitle', newValue)
      // 如果已登录，保存到数据库
      if (isAuthenticated.value) {
        try {
          await apiRequest('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ settings: { customTitle: newValue } })
          })
        } catch (error) {
          if (error.message === 'Token expired') {
            console.warn('Token expired, customTitle not saved to database')
          }
        }
      }
    }
  })
  
  watch(footerContent, async (newValue) => {
    if (!isLoadingFromDB.value) {
      localStorage.setItem('footerContent', newValue)
      if (isAuthenticated.value) {
        try {
          await apiRequest('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ settings: { footerContent: newValue } })
          })
        } catch (error) {
          if (error.message === 'Token expired') {
            console.warn('Token expired, footerContent not saved to database')
          }
        }
      }
    }
  })
  
  watch(activeSettingsTab, async (newValue) => {
    if (!isLoadingFromDB.value) {
      localStorage.setItem('activeSettingsTab', newValue)
      if (isAuthenticated.value) {
        try {
          await apiRequest('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ settings: { activeSettingsTab: newValue } })
          })
        } catch (error) {
          if (error.message === 'Token expired') {
            console.warn('Token expired, activeSettingsTab not saved to database')
          }
        }
      }
    }
  })
  
  watch(publicMode, async (newValue) => {
    if (!isLoadingFromDB.value) {
      localStorage.setItem('publicMode', newValue.toString())
      if (isAuthenticated.value) {
        try {
          await apiRequest('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ settings: { publicMode: newValue.toString() } })
          })
        } catch (error) {
          if (error.message === 'Token expired') {
            console.warn('Token expired, publicMode not saved to database')
          }
        }
      }
    }
  })
  
  watch(randomWallpaper, async (newValue) => {
    if (!isLoadingFromDB.value) {
      localStorage.setItem('randomWallpaper', newValue.toString())
      if (isAuthenticated.value) {
        try {
          await apiRequest('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ settings: { randomWallpaper: newValue.toString() } })
          })
        } catch (error) {
          if (error.message === 'Token expired') {
            console.warn('Token expired, randomWallpaper not saved to database')
          }
        }
      }
    }
  })
  
  watch(wallpaperApi, async (newValue) => {
    if (!isLoadingFromDB.value) {
      localStorage.setItem('wallpaperApi', newValue)
      if (isAuthenticated.value) {
        try {
          await apiRequest('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ settings: { wallpaperApi: newValue } })
          })
        } catch (error) {
          if (error.message === 'Token expired') {
            console.warn('Token expired, wallpaperApi not saved to database')
          }
        }
      }
    }
  })
  
  watch(displayMode, async (newValue) => {
    if (!isLoadingFromDB.value) {
      localStorage.setItem('displayMode', newValue)
      if (isAuthenticated.value) {
        try {
          await apiRequest('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ settings: { displayMode: newValue } })
          })
        } catch (error) {
          if (error.message === 'Token expired') {
            console.warn('Token expired, displayMode not saved to database')
          }
        }
      }
    }
  })
  
  watch(avatarUrl, async (newValue) => {
    if (!isLoadingFromDB.value) {
      localStorage.setItem('avatarUrl', newValue)
      if (isAuthenticated.value) {
        try {
          await apiRequest('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ settings: { avatarUrl: newValue } })
          })
        } catch (error) {
          if (error.message === 'Token expired') {
            console.warn('Token expired, avatarUrl not saved to database')
          }
        }
      }
    }
  })
  
  return {
    showSearch,
    hideEmptyCategories,
    customTitle,
    footerContent,
    activeSettingsTab,
    publicMode,
    randomWallpaper,
    wallpaperApi,
    displayMode,
    avatarUrl,
    toggleSearch,
    toggleHideEmptyCategories,
    updateCustomTitle,
    updateFooterContent,
    setActiveSettingsTab,
    togglePublicMode,
    toggleRandomWallpaper,
    updateWallpaperApi,
    setDisplayMode,
    updateAvatarUrl,
    applyWallpaper,
    removeWallpaper,
    loadSettingsFromDB
  }
}

