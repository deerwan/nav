<template>
  <div 
    :id="`category-${category.id}`" 
    class="category-section"
    :class="{ 'efficient-mode': displayMode === 'efficient' }"
  >
    <div class="category-header">
      <div v-if="isBatchMode" class="category-checkbox">
        <input 
          type="checkbox" 
          :checked="isCategorySelected"
          @change="handleToggleCategorySelection"
        />
      </div>
      <h2 class="category-title">
        {{ category.name }}
        <span v-if="category.is_private" class="private-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>私密</span>
        </span>
      </h2>
      <div v-if="isEditMode && !isBatchMode" class="category-actions">
        <button class="icon-btn" @click="$emit('edit-category', category)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="icon-btn delete-btn" @click="$emit('delete-category', category)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div v-if="category.children && category.children.length > 0" class="subcategories-grid">
      <div 
        v-for="sub in category.children" 
        :key="sub.id"
        class="folder-card"
        :class="{ 'efficient-mode': displayMode === 'efficient' }"
        @click="$emit('select-category', sub.id)"
      >
        <div class="folder-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill-opacity="0.2"/>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="none"/>
          </svg>
        </div>
        <div class="folder-info">
          <div class="folder-name">{{ sub.name }}</div>
        </div>
      </div>
    </div>

    <div 
      ref="gridRef"
      class="bookmarks-grid"
      :class="{ 
        'is-drag-over': isGridDragOver,
        'efficient-mode': displayMode === 'efficient'
      }"
      @dragover.prevent="handleGridDragOver"
      @dragenter.prevent="handleGridDragEnter"
      @dragleave="handleGridDragLeave"
      @drop="handleDropOnGrid"
    >
      <template v-for="(bookmark, index) in bookmarks" :key="bookmark.id">
        <!-- 占位符：显示在拖拽插入位置之前 -->
        <div
          v-if="showPlaceholder && placeholderIndex === index && placeholderPosition === 'before' && currentDraggedId !== bookmark.id"
          class="drag-placeholder"
          :class="{ 'efficient-mode': displayMode === 'efficient' }"
        />
        
        <BookmarkCard
          :bookmark="bookmark"
          :is-edit-mode="isEditMode"
          :is-batch-mode="isBatchMode"
          :is-selected="isBookmarkSelected(bookmark.id)"
          :display-mode="displayMode"
          @edit="$emit('edit-bookmark', bookmark)"
          @delete="$emit('delete-bookmark', bookmark)"
          @dragstart="handleDragStart"
          @dragend="handleDragEnd"
          @drop="handleCardDrop"
          @dragenter="handleCardDragEnter"
          @dragleave="handleCardDragLeave"
          @dragoverPosition="handleDragOverPosition"
          @toggleSelect="handleToggleSelection"
          @keyboardReorder="handleKeyboardReorder"
        />
        
        <!-- 占位符：显示在拖拽插入位置之后 -->
        <div
          v-if="showPlaceholder && placeholderIndex === index && placeholderPosition === 'after' && currentDraggedId !== bookmark.id"
          class="drag-placeholder"
          :class="{ 'efficient-mode': displayMode === 'efficient' }"
        />
      </template>
      
      <!-- 占位符：显示在列表末尾 -->
      <div
        v-if="showPlaceholder && placeholderIndex >= bookmarks.length"
        class="drag-placeholder"
        :class="{ 'efficient-mode': displayMode === 'efficient' }"
      />
      
      <div v-if="!bookmarks.length" class="empty-state">
        暂无书签
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import BookmarkCard from './BookmarkCard.vue'

const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  bookmarks: {
    type: Array,
    default: () => []
  },
  isEditMode: {
    type: Boolean,
    default: false
  },
  isBatchMode: {
    type: Boolean,
    default: false
  },
  selectedIds: {
    type: Array,
    default: () => []
  },
  selectedCategoryIds: {
    type: Array,
    default: () => []
  },
  displayMode: {
    type: String,
    default: 'standard'
  }
})

const emit = defineEmits([
  'select-category',
  'edit-category',
  'delete-category',
  'edit-bookmark',
  'delete-bookmark',
  'reorder-bookmarks',
  'toggle-selection',
  'toggle-category-selection'
])

const gridRef = ref(null)
const isGridDragOver = ref(false)
const showPlaceholder = ref(false)
const placeholderIndex = ref(-1)
const placeholderPosition = ref('after')
const currentDraggedId = ref(null)

const selectedSet = computed(() => new Set(props.selectedIds))
const isBookmarkSelected = (id) => selectedSet.value.has(id)
const isCategorySelected = computed(() => props.selectedCategoryIds?.includes(props.category.id) || false)

const handleToggleCategorySelection = () => {
  emit('toggle-category-selection', props.category.id)
}

const handleDragStart = (bookmark) => {
  currentDraggedId.value = bookmark.id
}

const handleDragEnd = () => {
  currentDraggedId.value = null
  isGridDragOver.value = false
  showPlaceholder.value = false
  placeholderIndex.value = -1
}

const handleCardDragEnter = () => {
  isGridDragOver.value = false
}

const handleCardDragLeave = () => {
  // 延迟隐藏占位符，避免闪烁
  setTimeout(() => {
    if (!isGridDragOver.value) {
      showPlaceholder.value = false
    }
  }, 50)
}

const handleDragOverPosition = ({ id, position }) => {
  if (currentDraggedId.value === id) return
  
  const targetIndex = props.bookmarks.findIndex(b => b.id === id)
  if (targetIndex === -1) return
  
  showPlaceholder.value = true
  placeholderIndex.value = targetIndex
  placeholderPosition.value = position
}

// 处理来自 BookmarkCard 的 drop 事件
const handleCardDrop = (dropInfo) => {
  if (!dropInfo || !dropInfo.draggedId || !dropInfo.targetId || dropInfo.draggedId === dropInfo.targetId) {
    showPlaceholder.value = false
    return
  }
  
  const draggedIdNum = parseInt(dropInfo.draggedId, 10)
  const targetIdNum = parseInt(dropInfo.targetId, 10)
  
  // 使用从 dataTransfer 解析的书签数据，或从当前分类中查找
  let draggedBookmark = dropInfo.draggedBookmark || props.bookmarks.find(b => b.id === draggedIdNum)
  
  // 如果找不到书签数据，这是跨分类拖拽
  if (!draggedBookmark) {
    const targetIndex = props.bookmarks.findIndex(b => b.id === targetIdNum)
    if (targetIndex === -1) {
      showPlaceholder.value = false
      return
    }
    const insertIndex = dropInfo.position === 'after' ? targetIndex + 1 : targetIndex
    // 发出跨分类移动请求，App 会处理
    emit('reorder-bookmarks', [{ id: draggedIdNum, position: insertIndex, category_id: props.category.id }])
    showPlaceholder.value = false
    return
  }

  // 检查是否是跨分类拖拽
  if (draggedBookmark.category_id !== props.category.id) {
    const targetIndex = props.bookmarks.findIndex(b => b.id === targetIdNum)
    if (targetIndex === -1) {
      showPlaceholder.value = false
      return
    }
    const insertIndex = dropInfo.position === 'after' ? targetIndex + 1 : targetIndex
    emit('reorder-bookmarks', [{ id: draggedIdNum, position: insertIndex, category_id: props.category.id }])
    showPlaceholder.value = false
    return
  }

  // 同分类：重排列表
  const bookmarksCopy = [...props.bookmarks]
  const draggedIndex = bookmarksCopy.findIndex(b => b.id === draggedIdNum)
  const targetIndex = bookmarksCopy.findIndex(b => b.id === targetIdNum)
  if (draggedIndex === -1 || targetIndex === -1) {
    showPlaceholder.value = false
    return
  }

  let insertIndex = dropInfo.position === 'after' ? targetIndex + 1 : targetIndex
  const [removed] = bookmarksCopy.splice(draggedIndex, 1)
  if (draggedIndex < insertIndex) insertIndex -= 1
  bookmarksCopy.splice(insertIndex, 0, removed)

  const items = bookmarksCopy.map((b, index) => ({ id: b.id, position: index }))
  emit('reorder-bookmarks', items)
  showPlaceholder.value = false
}

const handleGridDragEnter = (e) => {
  if (!props.isEditMode) return
  isGridDragOver.value = true
  // 占位符位置会在 handleGridDragOver 中实时计算
}

const handleGridDragLeave = (e) => {
  // 检查是否真的离开了网格区域
  const relatedTarget = e.relatedTarget
  if (!gridRef.value?.contains(relatedTarget)) {
    isGridDragOver.value = false
    showPlaceholder.value = false
  }
}

const handleGridDragOver = (e) => {
  if (!props.isEditMode) return
  e.preventDefault()
  
  const draggedId = e.dataTransfer?.getData('bookmarkId')
  if (!draggedId) return
  
  // 计算鼠标在网格中的位置，确定占位符位置
  if (!gridRef.value) return
  
  const gridRect = gridRef.value.getBoundingClientRect()
  const mouseX = e.clientX - gridRect.left
  const mouseY = e.clientY - gridRect.top
  
  // 获取所有可见的卡片（排除正在拖拽的）
  const cards = Array.from(gridRef.value.querySelectorAll('.bookmark-card:not(.dragging)'))
  const draggedIdNum = parseInt(draggedId, 10)
  
  // 检查是否拖拽的是当前分类的书签
  const isDraggingFromThisCategory = props.bookmarks.some(b => b.id === draggedIdNum)
  
  if (props.bookmarks.length === 0 || (!isDraggingFromThisCategory && props.bookmarks.length === 0)) {
    // 如果没有其他卡片，占位符显示在位置 0
    showPlaceholder.value = true
    placeholderIndex.value = 0
    placeholderPosition.value = 'after'
    return
  }
  
  // 找到鼠标位置最近的卡片
  let closestCard = null
  let closestDistance = Infinity
  let closestIndex = -1
  
  cards.forEach((card) => {
    const cardRect = card.getBoundingClientRect()
    const cardCenterX = cardRect.left + cardRect.width / 2
    const cardCenterY = cardRect.top + cardRect.height / 2
    
    // 计算到鼠标的距离（考虑水平和垂直距离）
    const distanceX = Math.abs(e.clientX - cardCenterX)
    const distanceY = Math.abs(e.clientY - cardCenterY)
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
    
    // 检查鼠标是否在卡片区域内
    const isInCardArea = e.clientX >= cardRect.left &&
                        e.clientX <= cardRect.right &&
                        e.clientY >= cardRect.top &&
                        e.clientY <= cardRect.bottom
    
    // 如果鼠标在卡片内，或者距离更近，则更新最近卡片
    if (isInCardArea || (distance < closestDistance && (!closestCard || distance < closestDistance * 1.5))) {
      closestCard = card
      closestDistance = distance
      // 找到对应的书签索引（使用 props.bookmarks 而不是 visibleBookmarks，因为占位符位置需要考虑原始索引）
      const bookmarkId = parseInt(card.dataset.bookmarkId, 10)
      closestIndex = props.bookmarks.findIndex(b => b.id === bookmarkId)
    }
  })
  
  if (closestCard && closestIndex !== -1) {
    const cardRect = closestCard.getBoundingClientRect()
    const cardMiddleY = cardRect.top + cardRect.height / 2
    const cardMiddleX = cardRect.left + cardRect.width / 2
    
    showPlaceholder.value = true
    
    placeholderIndex.value = closestIndex
    
    // 根据鼠标位置确定插入位置
    // 优先考虑垂直位置，如果垂直接近则考虑水平位置
    const verticalDistance = Math.abs(e.clientY - cardMiddleY)
    
    if (verticalDistance < cardRect.height * 0.3) {
      // 鼠标在卡片垂直中间区域，根据水平位置判断
      placeholderPosition.value = e.clientX < cardMiddleX ? 'before' : 'after'
    } else {
      // 鼠标在卡片上下区域，根据垂直位置判断
      placeholderPosition.value = e.clientY < cardMiddleY ? 'before' : 'after'
    }
  } else {
    // 如果没有找到最近的卡片，放在末尾
    showPlaceholder.value = true
    placeholderIndex.value = props.bookmarks.length
    placeholderPosition.value = 'after'
  }
}

const handleDropOnGrid = (e) => {
  if (!props.isEditMode) return
  
  e.preventDefault()
  e.stopPropagation()
  
  const draggedId = e.dataTransfer?.getData('bookmarkId')
  if (!draggedId) {
    showPlaceholder.value = false
    return
  }
  
  const draggedBookmarkData = e.dataTransfer?.getData('bookmarkData')
  let draggedBookmark = null
  if (draggedBookmarkData) {
    try {
      draggedBookmark = JSON.parse(draggedBookmarkData)
    } catch (e) {
      console.error('Failed to parse dragged bookmark data', e)
    }
  }
  
  if (!draggedBookmark) {
    showPlaceholder.value = false
    return
  }
  
  const bookmarkId = parseInt(draggedId, 10)

  // 跨分类：放到该分类的指定位置或末尾
  if (draggedBookmark.category_id !== props.category.id) {
    const insertIndex = showPlaceholder.value && placeholderIndex.value !== -1
      ? placeholderIndex.value
      : props.bookmarks.length
    emit('reorder-bookmarks', [{ id: bookmarkId, position: insertIndex, category_id: props.category.id }])
    showPlaceholder.value = false
    isGridDragOver.value = false
    return
  }

  // 同分类：根据占位符位置重新排序
  const bookmarksCopy = [...props.bookmarks]
  const draggedIndex = bookmarksCopy.findIndex(b => b.id === bookmarkId)
  
  if (draggedIndex === -1) {
    showPlaceholder.value = false
    return
  }
  
  // 确定插入位置
  let insertIndex = showPlaceholder.value && placeholderIndex.value !== -1
    ? placeholderIndex.value
    : bookmarksCopy.length - 1
  
  // 如果插入位置在拖拽项之后，需要调整
  if (draggedIndex < insertIndex) {
    insertIndex--
  }
  
  // 移除拖拽项并插入到新位置
  const [removed] = bookmarksCopy.splice(draggedIndex, 1)
  bookmarksCopy.splice(insertIndex, 0, removed)
  
  const items = bookmarksCopy.map((b, index) => ({ id: b.id, position: index }))
  emit('reorder-bookmarks', items)
  showPlaceholder.value = false
  isGridDragOver.value = false
}

const handleToggleSelection = (bookmarkId) => {
  emit('toggle-selection', bookmarkId)
}

const handleKeyboardReorder = ({ id, direction }) => {
  if (!props.isEditMode) return
  const bookmarksCopy = [...props.bookmarks]
  const currentIndex = bookmarksCopy.findIndex(b => b.id === id)
  if (currentIndex === -1) return
  
  if (direction === 'up' && currentIndex > 0) {
    const [removed] = bookmarksCopy.splice(currentIndex, 1)
    bookmarksCopy.splice(currentIndex - 1, 0, removed)
  } else if (direction === 'down' && currentIndex < bookmarksCopy.length - 1) {
    const [removed] = bookmarksCopy.splice(currentIndex, 1)
    bookmarksCopy.splice(currentIndex + 1, 0, removed)
  } else {
    return
  }
  
  const items = bookmarksCopy.map((b, index) => ({ id: b.id, position: index }))
  emit('reorder-bookmarks', items)
}
</script>

<style scoped>
.category-section {
  margin-bottom: 2rem;
}

/* Efficient Mode - Compact Category Section */
.category-section.efficient-mode {
  margin-bottom: 1.25rem;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 0.75rem;
}

/* Efficient Mode - Compact Category Header */
.category-section.efficient-mode .category-header {
  margin-bottom: 0.625rem;
}

.category-checkbox {
  display: flex;
  align-items: center;
}

.category-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary);
}

.category-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.category-title .private-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
  border: 1.5px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  color: #dc2626;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

html.dark .category-title .private-badge {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.category-title .private-badge svg {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}

/* Efficient Mode - Compact Category Title */
.category-section.efficient-mode .category-title {
  font-size: 1.2rem;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

.bookmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
  position: relative;
  padding: 0.25rem;
  transition: border 0.2s ease;
}

.bookmarks-grid.efficient-mode {
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.5rem;
}

.bookmarks-grid.is-drag-over {
  border: 3px dashed var(--primary);
  border-radius: var(--radius);
  background: rgba(99, 102, 241, 0.05);
  box-shadow: inset 0 0 20px rgba(99, 102, 241, 0.1);
  animation: gridDragOver 1.5s ease-in-out infinite;
}

@keyframes gridDragOver {
  0%, 100% {
    border-color: var(--primary);
    background: rgba(99, 102, 241, 0.05);
  }
  50% {
    border-color: rgba(139, 92, 246, 0.8);
    background: rgba(99, 102, 241, 0.1);
  }
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  font-size: 0.9rem;
}

/* 拖拽占位符样式 */
.drag-placeholder {
  min-height: 120px;
  border: 3px dashed var(--primary);
  border-radius: var(--radius);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: placeholderPulse 1.2s ease-in-out infinite;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2), inset 0 0 20px rgba(99, 102, 241, 0.15);
}

.drag-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.drag-placeholder.efficient-mode {
  min-height: 100px;
}

@keyframes placeholderPulse {
  0%, 100% {
    opacity: 0.7;
    border-color: var(--primary);
    transform: scale(1);
  }
  50% {
    opacity: 1;
    border-color: rgba(139, 92, 246, 0.8);
    transform: scale(1.02);
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  }
}

/* 拖拽时的卡片样式 */
.bookmark-card.dragging {
  opacity: 0.4;
  transform: scale(0.95);
  z-index: 1000;
}

/* Subcategories Grid Styles */
.subcategories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.folder-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.folder-card:hover {
  background: var(--bg-tertiary);
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.folder-card.efficient-mode {
  padding: 0.5rem 0.75rem;
  gap: 0.5rem;
}

.folder-icon {
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-icon svg {
  width: 24px;
  height: 24px;
  stroke-width: 2;
}

.folder-info {
  flex: 1;
  min-width: 0;
}

.folder-name {
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
