<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="close">
      <div class="modal-content" role="dialog" aria-labelledby="dialog-title" aria-modal="true">
        <div class="modal-header">
          <h3 id="dialog-title">AI 批量分类</h3>
          <button 
            class="close-btn" 
            @click="close"
            :disabled="isClassifying"
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div v-if="!isClassifying && !completed" class="confirmation-section">
            <p class="info-text">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              即将为选中的 <strong>{{ selectedBookmarks.length }}</strong> 个书签进行智能分类
            </p>
            <p class="warning-text">
              AI将分析每个书签的内容，推荐最合适的分类。
            </p>
            <div class="option-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="autoApply" />
                <span>自动应用推荐分类</span>
              </label>
              <p class="option-hint">如果不勾选，将显示推荐结果供您审核</p>
            </div>
          </div>
          
          <div v-if="isClassifying" class="progress-section">
            <div class="progress-info">
              <div class="progress-stats">
                <div class="stat-item">
                  <span class="stat-label">进度</span>
                  <span class="stat-value">{{ currentIndex }} / {{ totalCount }}</span>
                </div>
                <div class="stat-item success">
                  <span class="stat-label">成功</span>
                  <span class="stat-value">{{ successCount }}</span>
                </div>
                <div class="stat-item error">
                  <span class="stat-label">失败</span>
                  <span class="stat-value">{{ failedCount }}</span>
                </div>
              </div>
              
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: progressPercentage + '%' }"
                ></div>
              </div>
              
              <p class="progress-text">{{ progressPercentage }}%</p>
            </div>
            
            <div v-if="currentBookmark" class="current-bookmark">
              <p class="current-label">正在分析：</p>
              <p class="current-name">{{ currentBookmark.name }}</p>
              <p class="current-url">{{ currentBookmark.url }}</p>
            </div>
            
            <div v-if="results.length > 0" class="results-list">
              <div 
                v-for="result in visibleResults" 
                :key="result.id"
                class="result-item"
                :class="{ success: result.success, error: !result.success }"
              >
                <svg v-if="result.success" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="result-icon">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" class="result-icon">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                <div class="result-content">
                  <p class="result-name">{{ result.name }}</p>
                  <p v-if="result.success" class="result-category">
                    → {{ getCategoryName(result.categoryId) }}
                  </p>
                  <p v-if="!result.success" class="result-error">{{ result.error }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="completed && !autoApply" class="review-section">
            <div class="completion-icon success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h4 class="completion-title">分类推荐完成</h4>
            <div class="completion-stats">
              <div class="stat-item success">
                <span class="stat-label">成功</span>
                <span class="stat-value">{{ successCount }}</span>
              </div>
              <div class="stat-item error">
                <span class="stat-label">失败</span>
                <span class="stat-value">{{ failedCount }}</span>
              </div>
            </div>
            
            <div class="recommendations-list">
              <div 
                v-for="result in successfulResults" 
                :key="result.id"
                class="recommendation-item"
              >
                <div class="recommendation-header">
                  <div class="bookmark-info">
                    <h5>{{ result.name }}</h5>
                    <p class="bookmark-url">{{ result.url }}</p>
                  </div>
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      :checked="isRecommendationSelected(result.id)"
                      @change="toggleRecommendation(result.id)"
                    />
                  </label>
                </div>
                <div class="recommendation-body">
                  <div class="category-suggestion">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    </svg>
                    <span>{{ getCategoryName(result.categoryId) }}</span>
                  </div>
                  <p v-if="result.reason" class="reason-text">{{ result.reason }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="completed && autoApply" class="completion-section">
            <div class="completion-icon" :class="{ success: failedCount === 0, warning: failedCount > 0 }">
              <svg v-if="failedCount === 0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
            </div>
            <h4 class="completion-title">
              {{ failedCount === 0 ? '全部完成！' : '部分完成' }}
            </h4>
            <div class="completion-stats">
              <div class="stat-item success">
                <span class="stat-label">成功</span>
                <span class="stat-value">{{ successCount }}</span>
              </div>
              <div class="stat-item error">
                <span class="stat-label">失败</span>
                <span class="stat-value">{{ failedCount }}</span>
              </div>
            </div>
            <p class="completion-message">
              {{ failedCount === 0 
                ? '所有书签已成功分类' 
                : `${successCount} 个书签已分类，${failedCount} 个失败` 
              }}
            </p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            v-if="!isClassifying && !completed"
            class="btn btn-secondary" 
            @click="close"
          >
            取消
          </button>
          <button 
            v-if="!isClassifying && !completed"
            class="btn btn-primary" 
            @click="startClassification"
            :disabled="selectedBookmarks.length === 0"
          >
            开始分类
          </button>
          <button 
            v-if="completed && autoApply"
            class="btn btn-primary" 
            @click="close"
          >
            完成
          </button>
          <button 
            v-if="completed && !autoApply"
            class="btn btn-secondary" 
            @click="close"
          >
            取消
          </button>
          <button 
            v-if="completed && !autoApply"
            class="btn btn-primary" 
            @click="applySelectedRecommendations"
            :disabled="selectedRecommendations.size === 0"
          >
            应用选中 ({{ selectedRecommendations.size }})
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAI } from '../composables/useAI'
import { useBookmarks } from '../composables/useBookmarks'
import { useToast } from '../composables/useToast'
import { buildCategoryTree, getCategoryPath } from '../utils/categoryTree'

const { batchClassify, suggestCategory } = useAI()
const { updateBookmark, categories, bookmarks } = useBookmarks()
const { success: toastSuccess, error: toastError } = useToast()

const show = ref(false)
const selectedBookmarks = ref([])
const isClassifying = ref(false)
const completed = ref(false)
const autoApply = ref(false)

const currentIndex = ref(0)
const totalCount = ref(0)
const successCount = ref(0)
const failedCount = ref(0)
const currentBookmark = ref(null)
const results = ref([])
const selectedRecommendations = ref(new Set())

const categoryMap = computed(() => {
  if (!categories.value.length) return {}
  const { map } = buildCategoryTree(categories.value)
  return map
})

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((currentIndex.value / totalCount.value) * 100)
})

const visibleResults = computed(() => {
  return results.value.slice(-5).reverse()
})

const successfulResults = computed(() => {
  return results.value.filter(r => r.success)
})

const getCategoryName = (categoryId) => {
  const path = getCategoryPath(categoryId, categoryMap.value)
  return path.map(c => c.name).join(' / ')
}

const isRecommendationSelected = (bookmarkId) => {
  return selectedRecommendations.value.has(bookmarkId)
}

const toggleRecommendation = (bookmarkId) => {
  const newSet = new Set(selectedRecommendations.value)
  if (newSet.has(bookmarkId)) {
    newSet.delete(bookmarkId)
  } else {
    newSet.add(bookmarkId)
  }
  selectedRecommendations.value = newSet
}

const open = (bookmarksToClassify) => {
  selectedBookmarks.value = bookmarksToClassify
  isClassifying.value = false
  completed.value = false
  autoApply.value = false
  currentIndex.value = 0
  totalCount.value = 0
  successCount.value = 0
  failedCount.value = 0
  currentBookmark.value = null
  results.value = []
  selectedRecommendations.value = new Set()
  show.value = true
}

const close = () => {
  if (isClassifying.value) return
  show.value = false
}

const prepareCategoriesForAI = () => {
  if (!categories.value.length) return []
  const { flatList, map } = buildCategoryTree(categories.value)
  return flatList.map(cat => ({
    id: cat.id,
    name: cat.name,
    path: getCategoryPath(cat.id, map).map(c => c.name).join(' / ')
  }))
}

const startClassification = async () => {
  if (selectedBookmarks.value.length === 0) {
    toastError('没有选中的书签')
    return
  }
  
  const categoriesForAI = prepareCategoriesForAI()
  if (categoriesForAI.length === 0) {
    toastError('没有可用的分类')
    return
  }
  
  isClassifying.value = true
  totalCount.value = selectedBookmarks.value.length
  currentIndex.value = 0
  successCount.value = 0
  failedCount.value = 0
  results.value = []
  
  // 逐个处理书签，实时更新进度
  for (let i = 0; i < selectedBookmarks.value.length; i++) {
    const bookmark = selectedBookmarks.value[i]
    currentBookmark.value = bookmark
    currentIndex.value = i + 1
    
    try {
      // 调用单个分类 API
      const result = await suggestCategory(
        bookmark.name,
        bookmark.url,
        bookmark.description || '',
        categoriesForAI
      )
      
      if (result.success) {
        successCount.value++
        results.value.push({
          id: bookmark.id,
          name: bookmark.name,
          url: bookmark.url,
          success: true,
          categoryId: result.categoryId,
          reason: result.reason
        })
        
        // 如果自动应用，立即更新书签
        if (autoApply.value) {
          try {
            await updateBookmark(bookmark.id, {
              ...bookmark,
              category_id: result.categoryId
            })
          } catch (error) {
            console.error('Failed to update bookmark:', error)
          }
        }
      } else {
        failedCount.value++
        results.value.push({
          id: bookmark.id,
          name: bookmark.name,
          url: bookmark.url,
          success: false,
          error: result.error || '分类失败'
        })
      }
    } catch (error) {
      failedCount.value++
      results.value.push({
        id: bookmark.id,
        name: bookmark.name,
        url: bookmark.url,
        success: false,
        error: '网络错误'
      })
    }
    
    // 添加小延迟，避免请求过快
    if (i < selectedBookmarks.value.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  // 如果不是自动应用，默认选中所有成功的推荐
  if (!autoApply.value) {
    selectedRecommendations.value = new Set(
      results.value.filter(r => r.success).map(r => r.id)
    )
  }
  
  isClassifying.value = false
  completed.value = true
  currentBookmark.value = null
  
  if (autoApply.value) {
    if (failedCount.value === 0) {
      toastSuccess(`成功分类 ${successCount.value} 个书签`)
    } else {
      toastError(`分类完成：成功 ${successCount.value} 个，失败 ${failedCount.value} 个`)
    }
  }
}

const applySelectedRecommendations = async () => {
  if (selectedRecommendations.value.size === 0) {
    toastError('请至少选择一个推荐')
    return
  }
  
  let appliedCount = 0
  
  for (const bookmarkId of selectedRecommendations.value) {
    const resultItem = results.value.find(r => r.id === bookmarkId && r.success)
    if (resultItem) {
      const bookmark = selectedBookmarks.value.find(b => b.id === resultItem.id)
      if (bookmark) {
        try {
          await updateBookmark(bookmark.id, {
            ...bookmark,
            category_id: resultItem.categoryId
          })
          appliedCount++
        } catch (error) {
          console.error('Failed to update bookmark:', error)
        }
      }
    }
  }
  
  toastSuccess(`已应用 ${appliedCount} 个分类推荐`)
  close()
}

defineExpose({
  open,
  close
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: var(--bg);
  border-radius: var(--radius);
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

.close-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition);
  border-radius: var(--radius-sm);
}

.close-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--text);
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-btn svg {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.confirmation-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  border-radius: var(--radius);
  color: var(--info-text);
  margin: 0;
}

.info-text svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  stroke-width: 2;
}

.info-text strong {
  color: var(--primary);
}

.warning-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.option-group {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: var(--text);
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.option-hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-stats {
  display: flex;
  gap: 1rem;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  flex: 1;
}

.stat-item.success {
  background: rgba(34, 197, 94, 0.1);
}

.stat-item.error {
  background: rgba(239, 68, 68, 0.1);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.stat-item.success .stat-value {
  color: #16a34a;
}

.stat-item.error .stat-value {
  color: #dc2626;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-dark));
  transition: width 0.3s ease;
  border-radius: var(--radius-full);
}

.progress-text {
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.current-bookmark {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.current-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.current-name {
  font-weight: 600;
  color: var(--text);
  margin: 0 0 0.25rem 0;
}

.current-url {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.result-item.success {
  border-color: #16a34a;
  background: rgba(34, 197, 94, 0.05);
}

.result-item.error {
  border-color: #dc2626;
  background: rgba(239, 68, 68, 0.05);
}

.result-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  stroke-width: 2;
}

.result-item.success .result-icon {
  color: #16a34a;
}

.result-item.error .result-icon {
  color: #dc2626;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-weight: 500;
  color: var(--text);
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-category {
  font-size: 0.875rem;
  color: var(--primary);
  margin: 0;
}

.result-error {
  font-size: 0.875rem;
  color: #dc2626;
  margin: 0;
}

.review-section,
.completion-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.completion-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.completion-icon.success {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.completion-icon.warning {
  background: rgba(251, 191, 36, 0.1);
  color: #f59e0b;
}

.completion-icon svg {
  width: 32px;
  height: 32px;
  stroke-width: 2.5;
}

.completion-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.completion-stats {
  display: flex;
  gap: 1rem;
}

.completion-message {
  color: var(--text-secondary);
  text-align: center;
  margin: 0;
}

.recommendations-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.recommendation-item {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
  background: var(--bg-secondary);
  transition: var(--transition);
}

.recommendation-item:hover {
  border-color: var(--primary);
}

.recommendation-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.bookmark-info {
  flex: 1;
  min-width: 0;
}

.bookmark-info h5 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-url {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommendation-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-suggestion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--bg);
  border-radius: var(--radius-sm);
  color: var(--primary);
  font-weight: 500;
}

.category-suggestion svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  stroke-width: 2;
}

.reason-text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid var(--border);
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  border: none;
  font-size: 0.9375rem;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 95%;
  }
  
  .progress-stats {
    flex-direction: column;
  }
  
  .recommendations-list {
    max-height: 300px;
  }
}
</style>
