<template>
  <div class="search-container">
    <div class="search-bar">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <input 
        v-model="query"
        type="text" 
        placeholder="搜索书签名称、URL、描述、标签或备注..."
        @input="handleSearch"
        @focus="showResults = true"
      >
      <button v-if="query || selectedCategoryId || selectedTags.length > 0" class="clear-btn" @click="clearSearch" title="清除搜索">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <button class="filter-btn" :class="{ active: showFilter }" @click="showFilter = !showFilter" title="过滤选项">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
      </button>
    </div>
    
    <Transition name="slide-down">
      <div v-if="showFilter" class="filter-panel">
        <div class="filter-group">
          <label>按分类过滤：</label>
          <select v-model="selectedCategoryId" @change="handleCategoryFilter">
            <option :value="null">全部分类</option>
            <option 
              v-for="cat in categoryOptions" 
              :key="cat.id" 
              :value="cat.id"
            >
              {{ cat.displayName }}
            </option>
          </select>
        </div>
        
        <div v-if="allTags.length > 0" class="filter-group">
          <label>按标签过滤：</label>
          <div class="tags-filter">
            <button
              v-for="tag in allTags"
              :key="tag"
              class="tag-filter-btn"
              :class="{ active: selectedTags.includes(tag) }"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
          <p v-if="selectedTags.length > 0" class="selected-tags-info">
            已选择 {{ selectedTags.length }} 个标签
          </p>
        </div>
      </div>
    </Transition>
    
    <!-- 搜索结果列表 -->
    <Transition name="slide-down">
      <div v-if="showResults && query && searchResults.length > 0" class="search-results" ref="resultsPanel">
        <div class="search-results-header">
          <span class="result-count">找到 <strong>{{ searchResults.length }}</strong> 个书签</span>
          <button class="close-results-btn" @click="showResults = false" title="关闭结果">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="search-results-list">
          <div 
            v-for="result in searchResults" 
            :key="result.id"
            class="search-result-item"
            @click="handleResultClick(result)"
          >
            <div class="result-icon">
              <img 
                v-if="result.icon" 
                :src="result.icon" 
                :alt="result.name"
                @error="handleIconError"
              >
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <div class="result-info">
              <div class="result-name">{{ result.name }}</div>
              <div class="result-path">{{ result.categoryPath }}</div>
              <div v-if="result.description" class="result-description">{{ result.description }}</div>
              <div class="result-url">{{ result.url }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    
    <div v-if="(query || selectedCategoryId || selectedTags.length > 0) && !showResults" class="search-result-info">
      <span class="result-count">
        找到 <strong>{{ filteredBookmarks.length }}</strong> 个书签
      </span>
    </div>

    <!-- 快速搜索引擎 -->
    <Transition name="slide-down">
      <div v-if="query && showEngines && enabledSearchEnginesPanel && availableEngines.length > 0" class="search-engines">
        <div class="engines-header">
          <span class="engines-label">快速搜索：</span>
        </div>
        <div class="engines-list">
          <button
            v-for="engine in availableEngines"
            :key="engine.id"
            class="engine-btn"
            :title="engine.name"
            @click="searchWithEngine(engine.id)"
          >
            <img 
              v-if="engine.icon.startsWith('http')" 
              :src="engine.icon" 
              class="engine-icon-img" 
              :alt="engine.name"
            />
            <span v-else class="engine-icon">{{ engine.icon }}</span>
            <span class="engine-name">{{ engine.name }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBookmarks } from '../composables/useBookmarks'
import { useSearchEngines } from '../composables/useSearchEngines'
import { buildCategoryTree, getCategoryPath } from '../utils/categoryTree'
import { debounce } from '../utils/helpers'

const emit = defineEmits(['scrollToBookmark'])

const { searchQuery, searchCategoryId, searchTags, categories, filteredBookmarks, bookmarks, allTags } = useBookmarks()
const { getAvailableEngines, openSearchEngine, enabledSearchEnginesPanel } = useSearchEngines()
const query = ref('')
const selectedCategoryId = ref(null)
const selectedTags = ref([])
const showFilter = ref(false)
const showResults = ref(false)
const showEngines = ref(false)
const resultsPanel = ref(null)

// 可用搜索引擎
const availableEngines = computed(() => {
  return getAvailableEngines()
})

// 分类选项
const categoryOptions = computed(() => {
  if (!categories.value.length) {
    return []
  }
  const { flatList, map } = buildCategoryTree(categories.value)
  return flatList.map(cat => ({
    id: cat.id,
    displayName: getCategoryPath(cat.id, map).map(item => item.name).join('/')
  }))
})

// 搜索结果（带分类路径）
const searchResults = computed(() => {
  if (!query.value) return []
  
  const queryLower = query.value.toLowerCase()
  const { map } = buildCategoryTree(categories.value)
  
  return filteredBookmarks.value.map(bookmark => {
    const categoryPath = getCategoryPath(bookmark.category_id, map)
      .map(cat => cat.name)
      .join(' / ')
    
    return {
      ...bookmark,
      categoryPath,
      icon: bookmark.icon || getFaviconUrl(bookmark.url)
    }
  }).slice(0, 50) // 限制最多显示50个结果
})

// 获取网站图标
const getFaviconUrl = (url) => {
  try {
    const urlObj = new URL(url)
    return `${urlObj.origin}/favicon.ico`
  } catch {
    return null
  }
}

// 处理图标加载错误
const handleIconError = (e) => {
  e.target.style.display = 'none'
}

// 使用防抖优化搜索性能
const handleSearch = debounce(() => {
  searchQuery.value = query.value
  if (query.value) {
    showResults.value = true
    showEngines.value = true
  }
}, 300)

const handleCategoryFilter = () => {
  searchCategoryId.value = selectedCategoryId.value
}

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
  searchTags.value = [...selectedTags.value]
}

const clearSearch = () => {
  query.value = ''
  selectedCategoryId.value = null
  selectedTags.value = []
  searchQuery.value = ''
  searchCategoryId.value = null
  searchTags.value = []
  showResults.value = false
  showEngines.value = false
}

// 点击搜索结果项，滚动到对应书签
const handleResultClick = (bookmark) => {
  emit('scrollToBookmark', bookmark)
  showResults.value = false
}

// 使用搜索引擎搜索
const searchWithEngine = (engineId) => {
  openSearchEngine(engineId, query.value)
  showEngines.value = false
}

// 监听搜索结果变化，自动滚动到第一个匹配项
watch(() => filteredBookmarks.value, (newBookmarks) => {
  if (query.value && newBookmarks.length > 0) {
    // 延迟一下让DOM更新
    setTimeout(() => {
      const firstResult = newBookmarks[0]
      if (firstResult) {
        emit('scrollToBookmark', firstResult)
      }
    }, 400)
  }
}, { deep: false })

// 点击外部关闭结果面板
if (typeof window !== 'undefined') {
  const handleClickOutside = (e) => {
    if (resultsPanel.value && !resultsPanel.value.contains(e.target)) {
      const searchBar = e.target.closest('.search-bar')
      if (!searchBar) {
        showResults.value = false
      }
    }
  }
  
  watch(showResults, (show) => {
    if (show) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 100)
    } else {
      document.removeEventListener('click', handleClickOutside)
    }
  })
}
</script>

<style scoped>
.search-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius);
  transition: var(--transition);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

html.dark .search-bar {
  background: rgba(15, 23, 42, 0.75);
  border-color: rgba(255, 255, 255, 0.1);
}

.search-bar:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
  stroke-width: 2;
  flex-shrink: 0;
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  color: var(--text);
  outline: none;
  min-width: 0;
}

.search-bar input::placeholder {
  color: var(--text-secondary);
}

.clear-btn,
.filter-btn,
.close-results-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
}

.clear-btn:hover,
.filter-btn:hover,
.close-results-btn:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.filter-btn.active {
  background: var(--primary);
  color: white;
}

.clear-btn svg,
.filter-btn svg,
.close-results-btn svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.filter-panel {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

html.dark .filter-panel {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group {
  margin-top: 1rem;
}

.filter-group:first-child {
  margin-top: 0;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
}

.filter-group select {
  padding: 0.5rem;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition);
}

.filter-group select:focus {
  outline: none;
  border-color: var(--primary);
}

.tags-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag-filter-btn {
  padding: 0.4rem 0.75rem;
  background: var(--bg);
  color: var(--text);
  border: 2px solid var(--border);
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.tag-filter-btn:hover {
  border-color: var(--primary);
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary);
  transform: translateY(-1px);
}

.tag-filter-btn.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.selected-tags-info {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-style: italic;
}

/* 搜索结果面板 */
.search-results {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--primary);
  border-radius: var(--radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

html.dark .search-results {
  background: rgba(15, 23, 42, 0.85);
}

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(99, 102, 241, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.search-results-list {
  overflow-y: auto;
  max-height: 350px;
}

.search-result-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: var(--transition);
}

.search-result-item:hover {
  background: var(--bg-hover);
}

.result-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--bg);
  overflow: hidden;
}

.result-icon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.result-icon svg {
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
  stroke-width: 2;
}

.result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.result-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-path {
  font-size: 0.8rem;
  color: var(--primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-description {
  font-size: 0.8rem;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  opacity: 0.85;
}

.result-url {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-result-info {
  padding: 0.5rem 1rem;
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid var(--primary);
  border-radius: var(--radius-sm);
  text-align: center;
}

.result-count {
  font-size: 0.875rem;
  color: var(--text);
}

.result-count strong {
  color: var(--primary);
  font-weight: 600;
}

/* 搜索引擎快速搜索 */
.search-engines {
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

html.dark .search-engines {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
}

.engines-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.engines-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
}

.engines-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.engine-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.engine-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.engine-btn:active {
  transform: translateY(0);
}

.engine-icon {
  font-size: 1rem;
  display: flex;
  align-items: center;
}

.engine-icon-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  border-radius: 2px;
}

.engine-name {
  font-size: 0.85rem;
}

/* 动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .search-bar {
    padding: 0.6rem 0.875rem;
  }
  
  .search-bar input {
    font-size: 0.9rem;
  }
  
  .search-bar input::placeholder {
    font-size: 0.85rem;
  }
  
  .filter-panel {
    padding: 0.875rem;
  }
  
  .search-results {
    max-height: 300px;
  }
  
  .search-results-list {
    max-height: 250px;
  }
  
  .result-name {
    font-size: 0.9rem;
  }
  
  .result-path,
  .result-url {
    font-size: 0.75rem;
  }
}
</style>
