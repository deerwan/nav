<template>
  <div class="app efficient-mode">
    <!-- Header -->
    <header class="app-header efficient-mode">
      <div class="header-content">
         <!-- 左上角：汉堡菜单按钮 -->
         <div class="header-left">
           <button
             v-if="categories.length > 0"
             class="sidebar-toggle-btn"
             @click="sidebarOpen = !sidebarOpen"
             title="切换分类侧边栏"
           >
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
               <path d="M3 12h18M3 6h18M3 18h18"/>
             </svg>
           </button>
         </div>

         <!-- 右上角：操作按钮 -->
         <div class="header-right">

          <!-- 未登录状态：显示登录按钮 -->
          <button
            v-if="!isAuthenticated"
            class="btn btn-primary"
            @click="loginModal.open()"
          >
            登录
          </button>

          <!-- 已登录状态：显示头像菜单 -->
          <AvatarMenu
           v-else
           :avatar-url="avatarUrl"
           :username="authUsername"
           :is-edit-mode="isEditMode"
           @settings="navigateToSettings()"
           @edit="isEditMode = true"
           @logout="handleLogout()"
          />
         </div>
      </div>
      
      <div v-if="showSearch" class="header-search">
        <SearchBar @scrollToBookmark="handleScrollToBookmark" />
      </div>
      
      <!-- Edit Mode Toolbar -->
      <EditModeToolbar 
        :is-edit-mode="isEditMode"
        :is-batch-mode="isBatchMode"
        :selected-count="selectedCount"
        :selected-category-count="selectedCategoryCount"
        :has-bookmarks="bookmarks.length > 0"
        :ai-enabled="aiEnabled"
        @addBookmark="handleAddBookmark"
        @addCategory="handleAddCategory"
        @toggleBatchMode="handleToggleBatchMode"
        @selectAll="handleSelectAll"
        @deselectAll="handleDeselectAll"
        @invertSelection="handleInvertSelection"
        @batchMove="handleBatchMove"
        @batchEdit="handleBatchEdit"
        @batchAIGenerate="handleBatchAIGenerate"
        @batchAIClassify="handleBatchAIClassify"
        @batchDelete="handleBatchDelete"
        @batchDeleteCategories="handleBatchDeleteCategories"
        @finishEdit="() => { isEditMode = false }"
      />
    </header>
    
    <main class="page-main">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="!publicMode && !isAuthenticated" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <p>需要登录才能访问</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">
          此书签站点处于非公开模式，请先登录
        </p>
        <button class="btn btn-primary" @click="loginModal.open()" style="margin-top: 1rem;">
          立即登录
        </button>
      </div>
      
      <div v-else-if="categories.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p>还没有分类和书签</p>
        <p v-if="isAuthenticated" style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-secondary);">
          点击右上角 <strong style="color: var(--primary);">⚙️ 设置</strong> → <strong style="color: var(--primary);">📊 数据管理</strong> → <strong style="color: var(--primary);">导入书签</strong>
        </p>
        <p v-if="isAuthenticated" style="font-size: 0.875rem; margin-top: 0.75rem; color: var(--text-tertiary);">
          或点击 <strong style="color: var(--primary);">✏️ 编辑</strong> 按钮手动添加
        </p>
        <p v-else style="font-size: 0.9rem; margin-top: 0.5rem;">
          请先登录以管理书签
        </p>
        <button 
          v-if="isAuthenticated" 
          class="btn btn-primary" 
          @click="navigateToSettings('data')" 
          style="margin-top: 1.5rem;"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 18px; height: 18px;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          快速导入书签
        </button>
      </div>
      
      <div v-else class="main-layout efficient-mode">
        <!-- Sidebar Backdrop -->
        <div 
          v-if="sidebarOpen" 
          class="sidebar-backdrop" 
          @click="sidebarOpen = false"
        ></div>
        
        <!-- Category Sidebar -->
         <CategorySidebar
           :categories="categories"
           :bookmarkCountByCategory="bookmarkCountByCategory"
           :totalBookmarkCount="totalBookmarkCount"
           :selectedCategoryId="selectedCategoryId"
           :selectedCategoryIds="selectedCategoryIds"
           :is-open="sidebarOpen"
           :is-desktop="isDesktop"
           :is-edit-mode="isEditMode"
           :is-batch-mode="isBatchMode"
           :custom-title="customTitle"
           @toggle="sidebarOpen = !sidebarOpen"
           @select="handleSelectCategory"
           @toggle-category-selection="handleToggleCategorySelection"
           @add-subcategory="handleAddSubcategory"
           @add-bookmark="handleAddBookmarkToCategory"
           @edit-category="handleEditCategory"
           @delete-category="handleDeleteCategory"
           @reorder-category="handleReorderCategory"
         />
        
        <!-- Bookmarks Content -->
        <div class="bookmarks-area efficient-mode">
          <!-- Breadcrumbs -->
          <div 
            v-if="selectedCategoryId !== ALL_CATEGORIES_ID && !searchQuery" 
            class="breadcrumbs-container efficient-mode"
          >
            <button 
              class="breadcrumb-item root-item"
              @click="handleSelectCategory(ALL_CATEGORIES_ID)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="home-icon">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              首页
            </button>
            
            <template v-for="(item, index) in currentCategoryPath" :key="item.id">
              <span class="breadcrumb-separator">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </span>
              <button 
                class="breadcrumb-item"
                :class="{ active: index === currentCategoryPath.length - 1 }"
                @click="handleSelectCategory(item.id)"
              >
                {{ item.name }}
              </button>
            </template>
          </div>

          <template v-if="displayedCategories.length > 0">
            <CategorySection
              v-for="category in displayedCategories"
              :key="category.id"
              :category="category"
              :bookmarks="bookmarksByCategory[category.id] || []"
              :is-edit-mode="isEditMode"
              :is-batch-mode="isBatchMode"
              :selected-ids="selectedIds"
              :selected-category-ids="selectedCategoryIds"

              @select-category="handleSelectCategory"
              @edit-category="handleEditCategory"
              @delete-category="handleDeleteCategory"
              @edit-bookmark="handleEditBookmark"
              @delete-bookmark="handleDeleteBookmark"
              @reorder-bookmarks="handleReorderBookmarks"
              @toggle-selection="handleToggleSelection"
              @toggle-category-selection="handleToggleCategorySelection"
            />
          </template>
          <div v-else class="empty-state">
            <template v-if="searchQuery || searchCategoryId">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <p>搜索无结果</p>
              <p style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-secondary);">
                没有找到匹配的书签，请尝试其他搜索词或分类
              </p>
            </template>
            <template v-else>
              <p>暂无可用分类，请先创建分类</p>
            </template>
          </div>
        </div>
      </div>
    </main>
    
    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-content" v-html="footerContent"></div>
    </footer>
    
    <!-- Floating Buttons -->
    <FloatingButtons />
    
    <!-- Modals -->
    <LoginModal ref="loginModal" />
    <BookmarkDialog ref="bookmarkDialog" />
    <CategoryDialog ref="categoryDialog" />
    <ConfirmDialog ref="confirmDialog" />
    <PromptDialog ref="promptDialog" />
    <FooterEditDialog ref="footerEditDialog" />
    <ImportExportDialog ref="importExportDialog" />
    <BatchOperationDialog ref="batchOperationDialog" />
    <BatchAIGenerateDialog ref="batchAIGenerateDialog" />
    <BatchAIClassifyDialog ref="batchAIClassifyDialog" />
    <BackupDialog ref="backupDialog" />
    
    <!-- Settings Page -->
    <SettingsPage 
      ref="settingsPage"
      :theme-mode="themeMode"
      :theme-style="themeStyle"
      :is-dark="isDark"
      :bookmarks="bookmarks"
      :show-search="showSearch"
      :random-wallpaper="randomWallpaper"
      :wallpaper-api="wallpaperApi"

      :hide-empty-categories="hideEmptyCategories"
      :public-mode="publicMode"
      :custom-title="customTitle"
      :avatar-url="avatarUrl"
      :username="authUsername"
      :footer-content="footerContent"
      :active-settings-tab="activeSettingsTab"
      :empty-category-count="emptyCategoryCount"
      @close="navigateFromSettings"
      @action="handleSettingsAction"
      @set-theme-mode="setThemeMode"
      @toggle-search="toggleSearch"
      @toggle-hide-empty="toggleHideEmptyCategories"
      @toggle-public-mode="togglePublicMode"
      @toggle-random-wallpaper="toggleRandomWallpaper"
      @update-wallpaper-api="updateWallpaperApi"
      @update-title="updateCustomTitle"
      @update-footer="updateFooterContent"
      @editTitle="handleEditTitle"
      @editFooter="handleEditFooter"
      @uploadAvatar="handleUploadAvatar"
      @setActiveTab="handleSettingsTabChange"
    />
    
    <!-- Update Notification -->
    <UpdateNotification />
    
    <!-- Toast Notifications -->
    <ToastNotification ref="toast" />

    <!-- Hidden router-view for vue-router -->
    <router-view v-show="false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth'
import { useBookmarks } from './composables/useBookmarks'
import { useBatchOperations } from './composables/useBatchOperations'
import { useTheme } from './composables/useTheme'
import { useSettings } from './composables/useSettings'
import { useSearchEngines } from './composables/useSearchEngines'
import { useToast } from './composables/useToast'
import { buildCategoryTree, getCategoryPath } from './utils/categoryTree'
import SearchBar from './components/SearchBar.vue'
import CategorySidebar from './components/CategorySidebar.vue'
import CategorySection from './components/CategorySection.vue'
import FloatingButtons from './components/FloatingButtons.vue'
import EditModeToolbar from './components/EditModeToolbar.vue'
import SettingsPage from './components/SettingsPage.vue'
import LoginModal from './components/LoginModal.vue'
import BookmarkDialog from './components/BookmarkDialog.vue'
import CategoryDialog from './components/CategoryDialog.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import PromptDialog from './components/PromptDialog.vue'
import FooterEditDialog from './components/FooterEditDialog.vue'
import ImportExportDialog from './components/ImportExportDialog.vue'
import BatchOperationDialog from './components/BatchOperationDialog.vue'
import BatchAIGenerateDialog from './components/BatchAIGenerateDialog.vue'
import BatchAIClassifyDialog from './components/BatchAIClassifyDialog.vue'
import BackupDialog from './components/BackupDialog.vue'
import UpdateNotification from './components/UpdateNotification.vue'
import ToastNotification from './components/ToastNotification.vue'
import AvatarMenu from './components/AvatarMenu.vue'
import { useAI } from './composables/useAI'

const { isAuthenticated, username: authUsername, logout, onAuthChange } = useAuth()

const route = useRoute()
const router = useRouter()

// 路由状态
const isSettingsRoute = computed(() => route.name === 'settings')

const navigateToSettings = (tab) => {
  if (tab) setActiveSettingsTab(tab)
  router.push({ name: 'settings', query: tab ? { tab } : {} })
}

const navigateFromSettings = () => {
  const query = {}
  if (selectedCategoryId.value !== ALL_CATEGORIES_ID) {
    query.category = selectedCategoryId.value
  }
  router.push({ name: 'home', query })
}
const { aiEnabled, checkAIAvailability } = useAI()
const { loadSettingsFromDB: loadSearchEnginesSettings } = useSearchEngines()
const {
  categories,
  bookmarks,
  searchQuery,
  searchCategoryId,
  filteredBookmarks,
  bookmarksByCategory,
  fetchData,
  addCategory,
  updateCategory,
  deleteCategory,
  updateBookmark,
  deleteBookmark,
  reorderItems,
  batchOperation,
  getEmptyCategories,
  cleanupEmptyCategories
} = useBookmarks()
const { themeMode, isDark, setThemeMode, toggleTheme, loadThemeFromDB } = useTheme()
const { showSearch, hideEmptyCategories, customTitle, footerContent, activeSettingsTab, publicMode, randomWallpaper, wallpaperApi, avatarUrl, toggleSearch, toggleHideEmptyCategories, togglePublicMode, updateCustomTitle, updateFooterContent, setActiveSettingsTab, toggleRandomWallpaper, updateWallpaperApi, updateAvatarUrl, applyWallpaper, loadSettingsFromDB } = useSettings()
const { setToastInstance, success: toastSuccess, error: toastError } = useToast()
const {
  isBatchMode,
  selectedCount,
  selectedCategoryCount,
  toggleBatchMode,
  toggleBookmarkSelection,
  toggleCategorySelection,
  selectAll,
  deselectAll,
  invertSelection,
  getSelectedIds,
  getSelectedCategoryIds,
  clearSelection,
  clearCategorySelection
} = useBatchOperations()

const loading = ref(true)
const isEditMode = ref(false)
const emptyCategoryCount = ref(0)
const loginModal = ref(null)
const bookmarkDialog = ref(null)
const categoryDialog = ref(null)
const confirmDialog = ref(null)
const promptDialog = ref(null)
const footerEditDialog = ref(null)
const importExportDialog = ref(null)
const batchOperationDialog = ref(null)
const batchAIGenerateDialog = ref(null)
const batchAIClassifyDialog = ref(null)
const backupDialog = ref(null)
const settingsPage = ref(null)
const toast = ref(null)

const ALL_CATEGORIES_ID = 'all'
const SCROLL_OFFSET = 140
const PROGRAMMATIC_SCROLL_TIMEOUT = 600
let scrollResetTimer = null

// 从 URL 读取分类参数
watch(() => route.query.category, (catId) => {
  if (catId && categories.value.some(c => String(c.id) === String(catId))) {
    const id = Number(catId)
    if (selectedCategoryId.value !== id) {
      selectedCategoryId.value = id
    }
  } else if (!catId && selectedCategoryId.value !== ALL_CATEGORIES_ID) {
    selectedCategoryId.value = ALL_CATEGORIES_ID
  }
}, { immediate: true })

// 监听设置页路由变化
watch(() => route.name, (name) => {
  if (name === 'settings') {
    settingsPage.value?.open()
    // 从 query 中读取 tab
    if (route.query.tab) {
      setActiveSettingsTab(route.query.tab)
    }
  } else {
    settingsPage.value?.close()
  }
}, { immediate: true })

const isDesktop = ref(typeof window !== 'undefined' ? window.innerWidth >= 1025 : true)
const sidebarOpen = ref(false)
const selectedCategoryId = ref(ALL_CATEGORIES_ID)
const isScrollingProgrammatically = ref(false)

const selectedIds = computed(() => getSelectedIds())
const selectedCategoryIds = computed(() => getSelectedCategoryIds())

// 递归计算分类及其所有子分类的书签总数
const getBookmarkCountWithDescendants = (categoryId, categoryMap) => {
  let count = bookmarksByCategory.value[categoryId]?.length || 0
  const category = categoryMap[categoryId]
  
  if (category && category.children && category.children.length > 0) {
    category.children.forEach(child => {
      count += getBookmarkCountWithDescendants(child.id, categoryMap)
    })
  }
  
  return count
}

const bookmarkCountByCategory = computed(() => {
  const counts = {}
  const { map: categoryMap } = buildCategoryTree(categories.value)
  
  categories.value.forEach(category => {
    counts[category.id] = getBookmarkCountWithDescendants(category.id, categoryMap)
  })
  return counts
})

const totalBookmarkCount = computed(() => {
  // 只统计根分类的书签数（包含子分类），避免重复计算
  const { tree } = buildCategoryTree(categories.value)
  return tree.reduce((total, category) => {
    return total + (bookmarkCountByCategory.value[category.id] || 0)
  }, 0)
})

const categoryTreeData = computed(() => buildCategoryTree(categories.value))

const currentCategoryPath = computed(() => {
  if (selectedCategoryId.value === ALL_CATEGORIES_ID || !categoryTreeData.value.map) return []
  return getCategoryPath(selectedCategoryId.value, categoryTreeData.value.map)
})

const displayedCategories = computed(() => {
  // 搜索模式下，保持原有逻辑（显示所有包含匹配书签的分类）
  if (searchQuery.value) {
    if (!hideEmptyCategories.value) return categories.value
    return categories.value.filter(cat => (bookmarksByCategory.value[cat.id]?.length || 0) > 0)
  }

  // 文件夹模式逻辑
  if (selectedCategoryId.value === ALL_CATEGORIES_ID) {
    // 显示所有根分类
    return categoryTreeData.value.tree
  } else {
    // 显示当前选中的分类
    const current = categoryTreeData.value.map[selectedCategoryId.value]
    return current ? [current] : []
  }
})

watch(categories, (newCategories) => {
  if (!newCategories.length) {
    selectedCategoryId.value = ALL_CATEGORIES_ID
    return
  }
  // 如果当前选中的分类已被删除，回到"全部"
  if (selectedCategoryId.value !== ALL_CATEGORIES_ID && !newCategories.some(category => category.id === selectedCategoryId.value)) {
    selectedCategoryId.value = ALL_CATEGORIES_ID
  }
}, { immediate: true })

watch([showSearch, isEditMode, isBatchMode, isAuthenticated], () => {
  if (typeof window === 'undefined') return
  nextTick(() => {
    updateLayoutOffsets()
  })
})

const setProgrammaticScroll = () => {
  isScrollingProgrammatically.value = true
  if (scrollResetTimer) clearTimeout(scrollResetTimer)
  scrollResetTimer = setTimeout(() => {
    isScrollingProgrammatically.value = false
  }, PROGRAMMATIC_SCROLL_TIMEOUT)
}

const getScrollOffset = () => {
  if (typeof window === 'undefined') return SCROLL_OFFSET
  const header = document.querySelector('.app-header')
  return header ? header.offsetHeight + 24 : SCROLL_OFFSET
}

const scrollToTop = () => {
  if (typeof window === 'undefined') return
  setProgrammaticScroll()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const scrollToCategory = (categoryId) => {
  if (typeof window === 'undefined') return
  const categoryElement = document.getElementById(`category-${categoryId}`)
  if (!categoryElement) return

  const offset = getScrollOffset()
  const elementTop = categoryElement.getBoundingClientRect().top + window.pageYOffset
  const targetTop = elementTop - offset

  setProgrammaticScroll()
  window.scrollTo({ top: targetTop, behavior: 'smooth' })
}

// 文件夹模式下，滚动监听的逻辑需要调整（或者暂时禁用自动选中，因为现在是点击驱动的）
// 但为了保持兼容性，我们只在"全部"视图下启用滚动监听
function updateActiveCategoryFromScroll() {
  if (typeof window === 'undefined') return
  if (isScrollingProgrammatically.value) return
  if (!categories.value.length) return
  
  // 如果不是在"全部"视图，不进行滚动监听更新
  if (selectedCategoryId.value !== ALL_CATEGORIES_ID) return

  const scrollY = window.scrollY || document.documentElement.scrollTop || 0
  if (scrollY <= 80) {
    // 在顶部时保持"all"
    return
  }

  const offset = getScrollOffset()
  let activeId = null

  // 只检测当前展示的分类（根分类）
  for (const category of displayedCategories.value) {
    const element = document.getElementById(`category-${category.id}`)
    if (!element) continue
    const rect = element.getBoundingClientRect()

    if (rect.top - offset <= 0) {
      activeId = category.id
    } else {
      if (activeId === null) {
        activeId = category.id
      }
      break
    }
  }
  
  // 注意：在文件夹模式下，我们不希望滚动自动改变 selectedCategoryId，
  // 因为这会触发视图切换（从"全部"变成"单分类"）。
  // 所以这里我们可能需要一个新的状态来表示"当前视口中的分类"，而不是直接修改 selectedCategoryId。
  // 或者，我们完全禁用滚动更新 selectedCategoryId 的逻辑，只保留点击导航。
  // 鉴于文件夹模式的特性，禁用滚动自动选中是更合理的。
}

const handleSelectCategory = (categoryId) => {
  selectedCategoryId.value = categoryId
  sidebarOpen.value = false
  scrollToTop()
  // 同步分类选择到 URL query 参数
  const query = {}
  if (categoryId !== ALL_CATEGORIES_ID) {
    query.category = categoryId
  }
  router.replace({ name: route.name || 'home', query })
}

const handleScrollToBookmark = (bookmark) => {
  if (typeof window === 'undefined') return
  
  // 先滚动到分类
  scrollToCategory(bookmark.category_id)
  
  // 等待滚动完成后，再滚动到具体的书签
  setTimeout(() => {
    const bookmarkElement = document.getElementById(`bookmark-${bookmark.id}`)
    if (!bookmarkElement) return
    
    const offset = getScrollOffset()
    const elementTop = bookmarkElement.getBoundingClientRect().top + window.pageYOffset
    const targetTop = elementTop - offset - 20 // 额外留 20px 的间距
    
    setProgrammaticScroll()
    window.scrollTo({ top: targetTop, behavior: 'smooth' })
    
    // 高亮显示书签（添加一个临时的高亮效果）
    bookmarkElement.classList.add('highlight-bookmark')
    setTimeout(() => {
      bookmarkElement.classList.remove('highlight-bookmark')
    }, 2000)
  }, 500)
}

const updateLayoutOffsets = () => {
  if (typeof window === 'undefined') return
  const header = document.querySelector('.app-header')
  const headerHeight = header?.offsetHeight ?? 0
  const root = document.documentElement
  if (!root) return

  root.style.setProperty('--app-header-height', `${headerHeight}px`)

  const availableHeight = Math.max(window.innerHeight - headerHeight, 0)
  root.style.setProperty('--app-sidebar-available-height', `${availableHeight}px`)
}

const handleResize = () => {
  if (typeof window === 'undefined') return
  isDesktop.value = window.innerWidth >= 1025

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => updateLayoutOffsets())
  } else {
    updateLayoutOffsets()
  }
}

const handleSettingsTabChange = (tab) => {
  setActiveSettingsTab(tab)
  // 同步 tab 到 URL query
  if (route.name === 'settings') {
    router.replace({ name: 'settings', query: { tab } })
  }
  // 切换到数据管理标签时检查空分类
  if (tab === 'data' && isAuthenticated.value) {
    checkEmptyCategories()
  }
}

onMounted(async () => {
  await fetchData()
  // 初始化时加载设置（无论是否登录）
  await loadSettingsFromDB()
  await loadThemeFromDB()
  await loadSearchEnginesSettings()
  
  // 检查AI可用性
  await checkAIAvailability()
  
  // 如果壁纸已启用，应用壁纸
  if (randomWallpaper.value) {
    applyWallpaper()
  }
  
  loading.value = false
  
  // 初始化 Toast
  if (toast.value) {
    setToastInstance(toast.value)
  }
  
  // 如果已登录，检查空分类数量
  if (isAuthenticated.value) {
    checkEmptyCategories()
  }
  
  // 监听登录状态变化，重新获取数据
  onAuthChange(async () => {
    await fetchData()
    // 登录后重新加载设置（确保获取最新数据）
    await loadSettingsFromDB()
    await loadThemeFromDB()
    await loadSearchEnginesSettings()
    // 登录后检查空分类
    if (isAuthenticated.value) {
      checkEmptyCategories()
    }
  })
  
  // 监听自定义标题变化，更新页面标题
  watch(customTitle, (newTitle) => {
    document.title = newTitle
  }, { immediate: true })
  
  
  // 监听窗口滚动，更新活动分类
  let scrollTimeout = null
  const handleScroll = () => {
    if (scrollTimeout) clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      updateActiveCategoryFromScroll()
    }, 100)
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  handleResize()
  
  // 清理事件监听
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
    if (scrollResetTimer) clearTimeout(scrollResetTimer)
    if (scrollTimeout) clearTimeout(scrollTimeout)
  })
  
  // 初始化时调用一次滚动检测
  nextTick(() => {
    updateActiveCategoryFromScroll()
  })
  
  // 初始化布局偏移量
  nextTick(() => {
    updateLayoutOffsets()
  })
})

const handleLogout = async () => {
  const confirmed = await confirmDialog.value.open('确定要退出登录吗？')
  if (confirmed) {
    logout()
    isEditMode.value = false
    await fetchData()
  }
}

const handleUploadAvatar = async (base64Image) => {
  try {
    await updateAvatarUrl(base64Image)
    toastSuccess('头像已更新')
  } catch (error) {
    toastError('上传头像失败')
    console.error('Failed to upload avatar:', error)
  }
}

const handleSettingsAction = (action) => {
  switch (action) {
    case 'importExport':
      // 导入导出保持在设置页面内，不关闭设置页面
      importExportDialog.value.open()
      break
    case 'backup':
      // 备份管理保持在设置页面内，不关闭设置页面
      backupDialog.value.open()
      break
    case 'cleanupEmptyCategories':
      // 清理空分类保持在设置页面内
      handleCleanupEmptyCategories()
      break
    case 'addBookmark':
      // 其他操作需要关闭设置页面
      navigateFromSettings()
      setTimeout(() => {
        bookmarkDialog.value.open()
      }, 300)
      break
    case 'addCategory':
      // 其他操作需要关闭设置页面
      navigateFromSettings()
      setTimeout(() => {
        handleAddCategory()
      }, 300)
      break
  }
}

const checkEmptyCategories = async () => {
  try {
    const result = await getEmptyCategories()
    if (result.success) {
      emptyCategoryCount.value = result.count || 0
    }
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error('Failed to check empty categories:', error)
  }
}

const handleCleanupEmptyCategories = async () => {
  // 先检查空分类数量
  const result = await getEmptyCategories()
  if (!result.success) {
    toastError(result.error || '获取空分类失败')
    return
  }
  
  if (result.count === 0) {
    toastError('当前没有空分类需要清理')
    return
  }
  
  // 构建确认消息
  const categoryNames = result.emptyCategories.map(cat => `"${cat.name}"`).join('、')
  const message = result.count === 1
    ? `确定要删除空分类 ${categoryNames} 吗？`
    : `确定要删除以下 ${result.count} 个空分类吗？\n\n${categoryNames}\n\n此操作不可恢复！`
  
  const confirmed = await confirmDialog.value.open(message, '清理空分类')
  if (!confirmed) return
  
  // 执行清理
  const cleanupResult = await cleanupEmptyCategories()
  if (cleanupResult.success) {
    if (cleanupResult.deletedCount === 0) {
      toastError('没有空分类需要清理')
    } else {
      toastSuccess(`已成功清理 ${cleanupResult.deletedCount} 个空分类`)
      // 更新空分类数量
      emptyCategoryCount.value = 0
    }
  } else {
    toastError(cleanupResult.error || '清理空分类失败')
  }
}

// 监听数据变化，更新空分类数量（使用防抖）
let checkEmptyCategoriesTimer = null
watch([categories, bookmarks], async () => {
  if (isAuthenticated.value) {
    // 防抖：延迟 500ms 执行，避免频繁检查
    if (checkEmptyCategoriesTimer) {
      clearTimeout(checkEmptyCategoriesTimer)
    }
    checkEmptyCategoriesTimer = setTimeout(async () => {
      await checkEmptyCategories()
      checkEmptyCategoriesTimer = null
    }, 500)
  }
})

const handleAddCategory = async (parentId = null) => {
  const result = await categoryDialog.value.open(null, parentId)
  if (result && result.success) {
    toastSuccess('分类添加成功')
  } else if (result && !result.success) {
    toastError(result.error || '添加分类失败')
  }
}

const handleAddSubcategory = async (parentCategory) => {
  await handleAddCategory(parentCategory.id)
}

const handleAddBookmarkToCategory = (categoryId) => {
  bookmarkDialog.value.open(null, { categoryId })
}

// Get current context category ID (for adding bookmarks with proper default)
const getCurrentContextCategoryId = () => {
  // If a specific category is selected (not "all"), attempt to use it
  if (selectedCategoryId.value !== ALL_CATEGORIES_ID && selectedCategoryId.value !== null && selectedCategoryId.value !== undefined) {
    if (typeof selectedCategoryId.value === 'number') {
      return selectedCategoryId.value
    }
    const parsed = Number.parseInt(selectedCategoryId.value, 10)
    if (Number.isInteger(parsed)) {
      return parsed
    }
  }
  // Otherwise return null to use the first category
  return null
}

// 获取分类的完整路径显示名称
const getCategoryDisplayName = (category) => {
  if (!category || !categories.value.length) {
    return category?.name || ''
  }
  const { map } = buildCategoryTree(categories.value)
  const path = getCategoryPath(category.id, map)
  return path.map(item => item.name).join('/')
}

const handleEditCategory = async (category) => {
  const result = await categoryDialog.value.open(category)
  if (result && result.success) {
    toastSuccess('分类已更新')
  } else if (result && !result.success) {
    toastError(result.error || '更新分类失败')
  }
}

const handleDeleteCategory = async (category) => {
  const displayName = getCategoryDisplayName(category)
  const confirmed = await confirmDialog.value.open(
    `确定要删除分类"${displayName}"吗？该分类下的所有书签也将被删除。`,
    '删除分类'
  )
  if (confirmed) {
    const result = await deleteCategory(category.id)
    if (result.success) {
      toastSuccess('分类已删除')
    } else {
      toastError(result.error || '删除分类失败')
    }
  }
}

const handleEditBookmark = (bookmark) => {
  bookmarkDialog.value.open(bookmark)
}

const handleDeleteBookmark = async (bookmark) => {
  const confirmed = await confirmDialog.value.open(
    `确定要删除书签"${bookmark.name}"吗？`,
    '删除书签'
  )
  if (confirmed) {
    const result = await deleteBookmark(bookmark.id)
    if (result.success) {
      toastSuccess('书签已删除')
    } else {
      toastError(result.error || '删除书签失败')
    }
  }
}

const visibleBookmarkIds = computed(() => filteredBookmarks.value.map(bookmark => bookmark.id))

const handleToggleBatchMode = () => {
  if (!isBatchMode.value && filteredBookmarks.value.length === 0 && categories.value.length === 0) {
    toastError('当前没有可操作的书签或分类')
    return
  }
  if (!isBatchMode.value) {
    clearSelection()
    clearCategorySelection()
  }
  toggleBatchMode()
}

const handleSelectAll = () => {
  if (!isBatchMode.value) return
  if (visibleBookmarkIds.value.length === 0) {
    toastError('当前没有可选择的书签')
    return
  }
  deselectAll()
  selectAll(visibleBookmarkIds.value)
}

const handleDeselectAll = () => {
  if (!isBatchMode.value) return
  deselectAll()
}

const handleInvertSelection = () => {
  if (!isBatchMode.value) return
  if (visibleBookmarkIds.value.length === 0) {
    toastError('当前没有可选择的书签')
    return
  }
  invertSelection(visibleBookmarkIds.value)
}

const handleToggleSelection = (bookmarkId) => {
  if (!isBatchMode.value) return
  toggleBookmarkSelection(bookmarkId)
}

const handleToggleCategorySelection = (categoryId) => {
  if (!isBatchMode.value) return
  toggleCategorySelection(categoryId)
}

const handleBatchDelete = async () => {
  if (selectedCount.value === 0) {
    toastError('请先选择需要删除的书签')
    return
  }
  const dialogResult = await batchOperationDialog.value?.open('delete', selectedCount.value)
  if (!dialogResult?.confirmed) return

  const ids = getSelectedIds()
  const result = await batchOperation('delete', ids)
  if (result.success) {
    toastSuccess(`已删除 ${ids.length} 个书签`)
    clearSelection()
  } else {
    toastError(result.error || '批量删除失败')
  }
}

const handleBatchMove = async () => {
  if (selectedCount.value === 0) {
    toastError('请先选择需要移动的书签')
    return
  }
  if (categories.value.length === 0) {
    toastError('请先创建分类')
    return
  }
  const dialogResult = await batchOperationDialog.value?.open('move', selectedCount.value)
  if (!dialogResult?.categoryId) return

  const categoryId = parseInt(dialogResult.categoryId, 10)
  if (Number.isNaN(categoryId)) {
    toastError('请选择有效的分类')
    return
  }

  const ids = getSelectedIds()
  const result = await batchOperation('move', ids, { categoryId })
  if (result.success) {
    toastSuccess(`已移动 ${ids.length} 个书签`)
    clearSelection()
  } else {
    toastError(result.error || '批量移动失败')
  }
}

const handleBatchEdit = async () => {
  if (selectedCount.value === 0) {
    toastError('请先选择需要编辑的书签')
    return
  }
  const dialogResult = await batchOperationDialog.value?.open('edit', selectedCount.value)
  if (!dialogResult) return

  const ids = getSelectedIds()
  const result = await batchOperation('edit', ids, { isPrivate: dialogResult.isPrivate })
  if (result.success) {
    toastSuccess(`已更新 ${ids.length} 个书签的属性`)
    clearSelection()
  } else {
    toastError(result.error || '批量编辑失败')
  }
}

const handleBatchAIGenerate = async () => {
  if (selectedCount.value === 0) {
    toastError('请先选择需要生成描述的书签')
    return
  }
  
  if (!aiEnabled.value) {
    toastError('AI 功能未启用，请先在设置中配置 AI')
    return
  }
  
  const ids = getSelectedIds()
  const selectedBookmarksList = bookmarks.value.filter(b => ids.includes(b.id))
  
  if (selectedBookmarksList.length === 0) {
    toastError('未找到选中的书签')
    return
  }
  
  batchAIGenerateDialog.value?.open(selectedBookmarksList)
}

const handleBatchAIClassify = async () => {
  if (selectedCount.value === 0) {
    toastError('请先选择需要分类的书签')
    return
  }
  
  if (!aiEnabled.value) {
    toastError('AI 功能未启用，请先在设置中配置 AI')
    return
  }
  
  if (categories.value.length === 0) {
    toastError('请先创建分类')
    return
  }
  
  const ids = getSelectedIds()
  const selectedBookmarksList = bookmarks.value.filter(b => ids.includes(b.id))
  
  if (selectedBookmarksList.length === 0) {
    toastError('未找到选中的书签')
    return
  }
  
  batchAIClassifyDialog.value?.open(selectedBookmarksList)
}

const handleReorderBookmarks = async (items) => {
  // 如果items包含category_id，说明是跨分类移动
  if (items[0]?.category_id) {
    const item = items[0]
    // 从所有书签中查找，而不是从目标分类中查找
    const bookmark = bookmarks.value.find(b => b.id === item.id)
    if (bookmark) {
      await updateBookmark(item.id, {
        ...bookmark,
        category_id: item.category_id,
        position: item.position
      })
    }
  } else {
    // 同分类内排序
    await reorderItems('bookmarks', items)
  }
}

const handleEditTitle = async () => {
  const newTitle = await promptDialog.value.open('自定义标题', customTitle.value, '请输入新的标题')
  if (newTitle && newTitle.trim()) {
    updateCustomTitle(newTitle.trim())
    toastSuccess('标题已更新')
  }
}

const handleEditFooter = async () => {
  const newFooter = await footerEditDialog.value.open('自定义页脚', footerContent.value, '请输入页脚HTML内容')
  if (newFooter !== null) {
    updateFooterContent(newFooter)
    toastSuccess('页脚已更新')
  }
}

const handleAddBookmark = () => {
  const currentCategoryId = getCurrentContextCategoryId()
  if (Number.isInteger(currentCategoryId)) {
    bookmarkDialog.value.open(null, { categoryId: currentCategoryId })
  } else {
    bookmarkDialog.value.open()
  }
}

const handleBatchDeleteCategories = async () => {
  if (selectedCategoryCount.value === 0) {
    toastError('请先选择需要删除的分类')
    return
  }
  const dialogResult = await batchOperationDialog.value?.open('delete-categories', selectedCategoryCount.value)
  if (!dialogResult?.confirmed) return

  const ids = getSelectedCategoryIds()
  const result = await batchOperation('delete-categories', null, {}, ids)
  if (result.success) {
    toastSuccess(`已删除 ${ids.length} 个分类`)
    clearCategorySelection()
  } else {
    toastError(result.error || '批量删除分类失败')
  }
}

// 分类排序：同层级上/下移动
const handleReorderCategory = async ({ id, direction }) => {
  const category = categories.value.find(c => c.id === id)
  if (!category) return
  const parentId = category.parent_id ?? null
  const siblings = categories.value
    .filter(c => (c.parent_id ?? null) === parentId)
    .sort((a, b) => a.position - b.position)

  const index = siblings.findIndex(c => c.id === id)
  if (index === -1) return

  if (direction === 'up' && index > 0) {
    const [curr] = siblings.splice(index, 1)
    siblings.splice(index - 1, 0, curr)
  } else if (direction === 'down' && index < siblings.length - 1) {
    const [curr] = siblings.splice(index, 1)
    siblings.splice(index + 1, 0, curr)
  } else {
    return
  }

  const items = siblings.map((c, i) => ({ id: c.id, position: i }))
  await reorderItems('categories', items)
}
</script>


<style>
/* Breadcrumbs Styles */
.breadcrumbs-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.breadcrumbs-container.efficient-mode {
  margin-bottom: 1rem;
  padding: 0.5rem 0.75rem;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.95rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.breadcrumb-item:hover {
  background: var(--bg-tertiary);
  color: var(--text);
}

.breadcrumb-item.active {
  color: var(--primary);
  font-weight: 600;
  background: rgba(99, 102, 241, 0.1);
  cursor: default;
}

.breadcrumb-item.root-item {
  padding-left: 0.4rem;
}

.home-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.breadcrumb-separator {
  display: flex;
  align-items: center;
  color: var(--text-tertiary);
}

.breadcrumb-separator svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}
</style>
