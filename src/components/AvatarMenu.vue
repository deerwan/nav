<template>
  <div class="avatar-menu-container">
    <button class="avatar-button" @click="toggleMenu" ref="avatarBtn">
      <img 
        :src="avatarUrl || defaultAvatarIcon" 
        alt="用户头像" 
        class="avatar-image"
      />
    </button>

    <div 
      v-if="isMenuOpen" 
      class="avatar-dropdown"
      ref="dropdown"
    >
      <div class="avatar-dropdown-header">
        <div class="user-info">
          <div class="user-avatar-large">
            <img 
              :src="avatarUrl || defaultAvatarIcon" 
              alt="用户头像"
            />
          </div>
          <div class="user-details">
            <div class="user-name">{{ username }}</div>
            <div class="user-role">管理员</div>
          </div>
        </div>
      </div>

      <div class="avatar-dropdown-divider"></div>

      <div class="avatar-dropdown-menu">
        <button class="avatar-menu-item" @click="handleSettings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
          设置
        </button>

        <button v-if="!isEditMode" class="avatar-menu-item" @click="handleEdit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          编辑
        </button>

        <div class="avatar-dropdown-divider"></div>

        <button class="avatar-menu-item danger" @click="handleLogout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          退出
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  avatarUrl: {
    type: String,
    default: ''
  },
  username: {
    type: String,
    default: '用户'
  },
  isEditMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['settings', 'edit', 'logout'])

const isMenuOpen = ref(false)
const avatarBtn = ref(null)
const dropdown = ref(null)

const defaultAvatarIcon = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const handleSettings = () => {
  emit('settings')
  closeMenu()
}

const handleEdit = () => {
  emit('edit')
  closeMenu()
}

const handleLogout = () => {
  emit('logout')
  closeMenu()
}

const handleClickOutside = (event) => {
  if (!avatarBtn.value || !dropdown.value) return
  
  if (!avatarBtn.value.contains(event.target) && !dropdown.value.contains(event.target)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.avatar-menu-container {
  position: relative;
}

.avatar-button {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  border: 2px solid var(--border);
  background: var(--bg);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-button:hover {
  border-color: var(--primary);
  transform: scale(1.05);
  box-shadow: 0 2px 8px var(--shadow);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 4px 16px var(--shadow-lg);
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.avatar-dropdown-header {
  padding: 1rem;
  background: var(--bg-secondary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 2px solid var(--border);
  flex-shrink: 0;
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: var(--font-semibold);
  color: var(--text);
  font-size: var(--text-base);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: 0.125rem;
}

.avatar-dropdown-divider {
  height: 1px;
  background: var(--border);
  margin: 0.5rem 0;
}

.avatar-dropdown-menu {
  padding: 0.5rem;
}

.avatar-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.avatar-menu-item svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
  flex-shrink: 0;
}

.avatar-menu-item:hover {
  background: var(--bg-hover);
  color: var(--primary);
}

.avatar-menu-item.danger {
  color: var(--error);
}

.avatar-menu-item.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

@media (max-width: 768px) {
  .avatar-dropdown {
    width: 260px;
  }
}
</style>
