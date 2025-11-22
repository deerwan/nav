<template>
  <div class="settings-section">
    <h2 class="section-title">AI 助手</h2>
    <p class="section-description">配置 AI 服务，启用智能生成书签描述、推荐分类等功能</p>

    <div class="settings-group">
      <div class="setting-item">
        <div class="setting-header">
          <label class="setting-label">API 状态</label>
        </div>
        <div class="status-display">
          <span v-if="aiEnabled" class="status-badge status-enabled">
            <span class="status-dot"></span>
            已启用
          </span>
          <span v-else class="status-badge status-disabled">
            <span class="status-dot"></span>
            未配置
          </span>
          <button 
            v-if="!isAuthenticated"
            class="btn-info"
            disabled
          >
            需要登录后配置
          </button>
        </div>
      </div>

      <div v-if="isAuthenticated" class="config-section">
        <div class="setting-item">
          <div class="setting-header">
            <label class="setting-label" for="ai-api-key">API Key</label>
          </div>
          <div class="api-key-input-wrapper">
            <input
              id="ai-api-key"
              v-model="localApiKey"
              :type="showApiKey ? 'text' : 'password'"
              placeholder="sk-..."
              class="setting-input"
              :disabled="saving || lockedFields.apiKey"
            />
            <button
              v-if="!lockedFields.apiKey && localApiKey"
              type="button"
              class="btn-toggle-visibility"
              @click="showApiKey = !showApiKey"
              :title="showApiKey ? '隐藏 API Key' : '显示 API Key'"
            >
              <svg v-if="showApiKey" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="icon-eye">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" class="icon-eye-off">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <p v-if="lockedFields.apiKey" class="setting-note setting-locked">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            此参数已通过环境变量 <code>OPENAI_API_KEY</code> 配置，无法在界面修改
          </p>
          <p v-else class="setting-note">
            保存后不会显示 API Key，如需修改请重新输入完整密钥<br>
            也可以通过环境变量 <code>OPENAI_API_KEY</code> 配置（优先级更高）
          </p>
        </div>

        <div class="setting-item">
          <div class="setting-header">
            <label class="setting-label" for="ai-base-url">Base URL</label>
            <span class="setting-hint">API 基础地址（可选）</span>
          </div>
          <input
            id="ai-base-url"
            v-model="localBaseUrl"
            type="text"
            placeholder="https://api.openai.com/v1"
            class="setting-input"
            :disabled="saving || lockedFields.baseUrl"
          />
          <p v-if="lockedFields.baseUrl" class="setting-note setting-locked">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            此参数已通过环境变量 <code>OPENAI_BASE_URL</code> 配置，无法在界面修改
          </p>
          <p v-else class="setting-note">
            环境变量：<code>OPENAI_BASE_URL</code>
          </p>
        </div>

        <div class="setting-item">
          <div class="setting-header">
            <label class="setting-label" for="ai-model">模型名称</label>
            <span class="setting-hint">使用的模型（可选）</span>
          </div>
          <input
            id="ai-model"
            v-model="localModel"
            type="text"
            placeholder="gpt-4o-mini"
            class="setting-input"
            :disabled="saving || lockedFields.model"
          />
          <p v-if="lockedFields.model" class="setting-note setting-locked">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            此参数已通过环境变量 <code>OPENAI_MODEL</code> 配置，无法在界面修改
          </p>
          <p v-else class="setting-note">
            环境变量：<code>OPENAI_MODEL</code>
          </p>
        </div>

        <div class="advanced-settings">
          <button
            type="button"
            class="btn-collapse"
            @click="showAdvanced = !showAdvanced"
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              :style="{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)' }"
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            高级配置
          </button>

          <div v-if="showAdvanced" class="advanced-content">
            <div class="setting-item">
              <div class="setting-header">
                <label class="setting-label" for="ai-auth-header">认证 Header 名称</label>
                <span class="setting-hint">默认为 Authorization</span>
              </div>
              <input
                id="ai-auth-header"
                v-model="localAuthHeader"
                type="text"
                placeholder="Authorization"
                class="setting-input"
                :disabled="saving || lockedFields.authHeader"
              />
              <p v-if="lockedFields.authHeader" class="setting-note setting-locked">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                此参数已通过环境变量 <code>OPENAI_AUTH_HEADER</code> 配置，无法在界面修改
              </p>
              <p v-else class="setting-note">
                环境变量：<code>OPENAI_AUTH_HEADER</code>
              </p>
            </div>

            <div class="setting-item">
              <div class="setting-header">
                <label class="setting-label" for="ai-auth-prefix">认证前缀</label>
                <span class="setting-hint">通常为 "Bearer "</span>
              </div>
              <input
                id="ai-auth-prefix"
                v-model="localAuthPrefix"
                type="text"
                placeholder="Bearer "
                class="setting-input"
                :disabled="saving || lockedFields.authPrefix"
              />
              <p v-if="lockedFields.authPrefix" class="setting-note setting-locked">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                此参数已通过环境变量 <code>OPENAI_AUTH_PREFIX</code> 配置，无法在界面修改
              </p>
              <p v-else class="setting-note">
                默认为 "Bearer "，留空表示不添加前缀<br>
                环境变量：<code>OPENAI_AUTH_PREFIX</code>
              </p>
            </div>
          </div>
        </div>

        <div class="setting-actions">
          <button
            class="btn btn-primary"
            @click="saveSettings"
            :disabled="saving || !hasChanges"
          >
            <span v-if="saving">保存中...</span>
            <span v-else>保存配置</span>
          </button>
          <button
            v-if="hasChanges"
            class="btn btn-secondary"
            @click="resetSettings"
            :disabled="saving"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <div v-if="isAuthenticated" class="settings-group prompt-settings">
      <h3 class="subsection-title">自定义 Prompt 提示词</h3>
      <p class="subsection-description">
        自定义提示词用于生成书签描述。开启后将使用自定义提示词替代默认提示词。
      </p>
      
      <div class="setting-item">
        <div class="setting-header">
          <label class="setting-label">启用自定义提示词</label>
          <span class="setting-hint">开启后使用自定义提示词</span>
        </div>
        <label class="toggle-switch">
          <input 
            type="checkbox" 
            v-model="localCustomPromptDescriptionEnabled"
            :disabled="saving"
          />
          <span class="toggle-slider"></span>
        </label>
        <p class="setting-note">
          关闭后将使用系统默认 Prompt
        </p>
      </div>
      
      <div v-show="localCustomPromptDescriptionEnabled" class="setting-item">
        <div class="setting-header">
          <label class="setting-label">自定义提示词</label>
          <span class="setting-hint">用于书签描述生成</span>
        </div>
        <textarea
          v-model="localCustomPromptDescription"
          class="setting-textarea"
          rows="8"
          placeholder="输入自定义 Prompt...&#10;&#10;可用变量：{name} {url}&#10;&#10;示例：&#10;为以下书签生成简洁的中文描述：&#10;名称：{name}&#10;链接：{url}&#10;&#10;要求：一句话说明网站功能，20字以内"
          :disabled="saving"
        ></textarea>
        <p class="setting-note">
          <strong>可用变量：</strong><code>{name}</code> - 书签名称，<code>{url}</code> - 书签链接
        </p>
        
        <div class="example-templates">
          <button
            class="btn btn-secondary btn-sm"
            @click="fillDescriptionTemplate"
            :disabled="saving"
          >
            填充示例模板
          </button>
          <span class="template-hint">快速填充预设的示例 Prompt 模板</span>
        </div>
      </div>
      
      <div class="setting-actions">
        <button
          class="btn btn-primary"
          @click="savePrompts"
          :disabled="saving || !hasPromptChanges"
        >
          <span v-if="saving">保存中...</span>
          <span v-else>保存 Prompt</span>
        </button>
        <button
          v-if="hasPromptChanges"
          class="btn btn-secondary"
          @click="resetPrompts"
          :disabled="saving"
        >
          取消
        </button>
      </div>
    </div>

    <div class="ai-features-info">
      <h4>AI 功能说明</h4>
      <ul class="feature-list">
        <li>
          <strong>智能生成描述：</strong>在添加/编辑书签时，AI 可以根据网站名称和 URL 自动生成描述
        </li>
        <li>
          <strong>分类推荐：</strong>AI 会分析书签内容，推荐最合适的分类
        </li>
        <li>
          <strong>批量生成：</strong>支持为多个书签批量生成描述，提升效率
        </li>

      </ul>
    </div>


  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAI } from '../../composables/useAI'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'

const { isAuthenticated } = useAuth()
const { aiEnabled, aiSource, checkAIAvailability, saveAISettings, getAISettings } = useAI()
const { success: toastSuccess, error: toastError } = useToast()

const localApiKey = ref('')
const localBaseUrl = ref('https://api.openai.com/v1')
const localModel = ref('gpt-4o-mini')
const localAuthHeader = ref('Authorization')
const localAuthPrefix = ref('Bearer ')
const showAdvanced = ref(false)
const saving = ref(false)

const showApiKey = ref(false)

const localCustomPromptDescription = ref('')
const localCustomPromptDescriptionEnabled = ref(false)

const lockedFields = ref({})

const originalSettings = ref({})
const originalPromptDescription = ref('')
const originalPromptDescriptionEnabled = ref(false)

const hasChanges = computed(() => {
  if (!isAuthenticated.value) return false
  return (
    localApiKey.value !== originalSettings.value.apiKey ||
    localBaseUrl.value !== originalSettings.value.baseUrl ||
    localModel.value !== originalSettings.value.model ||
    localAuthHeader.value !== originalSettings.value.authHeader ||
    localAuthPrefix.value !== originalSettings.value.authPrefix
  )
})

const hasPromptChanges = computed(() => {
  if (!isAuthenticated.value) return false
  return localCustomPromptDescription.value !== originalPromptDescription.value ||
    localCustomPromptDescriptionEnabled.value !== originalPromptDescriptionEnabled.value
})

const loadSettings = async () => {
  if (!isAuthenticated.value) return

  const result = await getAISettings()
  if (result.success) {
    localApiKey.value = result.apiKey || ''
    localBaseUrl.value = result.baseUrl || 'https://api.openai.com/v1'
    localModel.value = result.model || 'gpt-4o-mini'
    localAuthHeader.value = result.authHeader || 'Authorization'
    localAuthPrefix.value = result.authPrefix !== undefined ? result.authPrefix : 'Bearer '
    lockedFields.value = result.lockedFields || {}

    originalSettings.value = {
      apiKey: localApiKey.value,
      baseUrl: localBaseUrl.value,
      model: localModel.value,
      authHeader: localAuthHeader.value,
      authPrefix: localAuthPrefix.value
    }
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const settingsToSave = {
      baseUrl: localBaseUrl.value,
      model: localModel.value,
      authHeader: localAuthHeader.value,
      authPrefix: localAuthPrefix.value
    }
    
    // 只有当 API Key 有值时才发送
    if (localApiKey.value) {
      settingsToSave.apiKey = localApiKey.value
    }
    
    const result = await saveAISettings(settingsToSave)

    if (result.success) {
      toastSuccess('AI 配置已保存')
      // 保存成功后清空 API Key 输入框并重新加载设置
      localApiKey.value = ''
      await loadSettings()
      await checkAIAvailability()
    } else {
      toastError(result.error || '保存失败')
    }
  } catch (error) {
    toastError('保存失败')
  } finally {
    saving.value = false
  }
}

const resetSettings = () => {
  localApiKey.value = originalSettings.value.apiKey
  localBaseUrl.value = originalSettings.value.baseUrl
  localModel.value = originalSettings.value.model
  localAuthHeader.value = originalSettings.value.authHeader
  localAuthPrefix.value = originalSettings.value.authPrefix
}

const savePrompts = async () => {
  saving.value = true
  try {
    const result = await saveAISettings({
      customPromptDescription: localCustomPromptDescription.value,
      customPromptDescriptionEnabled: localCustomPromptDescriptionEnabled.value
    })

    if (result.success) {
      toastSuccess('Prompt 配置已保存')
      originalPromptDescription.value = localCustomPromptDescription.value
      originalPromptDescriptionEnabled.value = localCustomPromptDescriptionEnabled.value
    } else {
      toastError(result.error || '保存失败')
    }
  } catch (error) {
    toastError('保存失败')
  } finally {
    saving.value = false
  }
}

const resetPrompts = () => {
  localCustomPromptDescription.value = originalPromptDescription.value
  localCustomPromptDescriptionEnabled.value = originalPromptDescriptionEnabled.value
}

const loadPrompts = async () => {
  if (!isAuthenticated.value) return
  
  const result = await getAISettings()
  if (result.success) {
    localCustomPromptDescription.value = result.customPromptDescription || ''
    localCustomPromptDescriptionEnabled.value = result.customPromptDescriptionEnabled || false
    originalPromptDescription.value = localCustomPromptDescription.value
    originalPromptDescriptionEnabled.value = localCustomPromptDescriptionEnabled.value
  }
}

const fillDescriptionTemplate = () => {
  localCustomPromptDescription.value = `为以下书签生成简洁的中文描述：

名称：{name}
链接：{url}

要求：
1. 使用简体中文
2. 一句话说明网站功能或内容，20字以内
3. 直接返回描述文本，不要引号或其他格式

示例：
- GitHub → 全球最大的代码托管和协作平台
- 知乎 → 中文互联网高质量问答社区
- MDN Web Docs → Web 技术权威文档和学习资源`
  toastSuccess('已填充书签描述示例模板')
}

onMounted(async () => {
  await checkAIAvailability()
  await loadSettings()
  await loadPrompts()
})
</script>

<style scoped>
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.section-description {
  color: var(--text-secondary);
  font-size: 0.8125rem;
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
}

.doc-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
}

.doc-link:hover {
  text-decoration: underline;
}

.settings-group {
  background: transparent;
  border-radius: 0;
  padding: 0;
  margin-bottom: 0;
}

.setting-item {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.setting-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.setting-label {
  font-weight: var(--font-semibold);
  color: var(--text);
  font-size: var(--text-sm);
}

.setting-hint {
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.setting-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font-size: 0.9375rem;
}

.setting-input:focus {
  outline: none;
  border-color: var(--primary);
}

.setting-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.api-key-input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.api-key-input-wrapper .setting-input {
  flex: 1;
}

.btn-toggle-visibility {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-toggle-visibility:hover:not(:disabled) {
  color: var(--primary);
  border-color: var(--primary);
  background: rgba(var(--primary-rgb), 0.05);
}

.btn-toggle-visibility:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-toggle-visibility svg {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.icon-eye {
  display: block;
}

.icon-eye-off {
  display: block;
}

.icon-check {
  color: #16a34a;
}

.icon-error {
  color: #dc2626;
}

.icon-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.setting-note {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.5;
}

.setting-note code {
  background: var(--bg);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-xs);
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
}

.setting-locked {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.setting-locked svg {
  flex-shrink: 0;
  stroke-width: 2;
}

.setting-success {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.1);
  border: 1px solid rgba(22, 163, 74, 0.2);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
}

.setting-error {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.2);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
}

.status-display {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.status-enabled {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.status-disabled {
  background: rgba(148, 163, 184, 0.1);
  color: #64748b;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.btn-info {
  padding: 0.375rem 0.75rem;
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.advanced-settings {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.btn-collapse {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.5rem 0;
  background: none;
  border: none;
  color: var(--primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition);
}

.btn-collapse:hover {
  color: var(--primary-dark);
}

.btn-collapse svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
  transition: transform 0.2s;
}

.advanced-content {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
}

.setting-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border);
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-sm);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition);
  border: none;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg);
}

.ai-features-info,
.compatibility-info {
  background: transparent;
  border-radius: 0;
  padding: 1.5rem 0;
  margin-bottom: 0;
  border-top: 1px solid var(--border);
}

.ai-features-info h4,
.compatibility-info h4 {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text);
  margin: 0 0 var(--space-3) 0;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  padding: var(--space-2) 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.feature-list li strong {
  color: var(--text);
  font-weight: var(--font-semibold);
}

.feature-list li code {
  background: var(--bg);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-xs);
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
}

.compatibility-info p {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
  margin: 0 0 var(--space-3) 0;
}

.compatible-services {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-2);
}

.compatible-services li {
  padding: var(--space-2) var(--space-3);
  background: var(--bg);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  text-align: center;
}

@media (max-width: 768px) {
  .compatible-services {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}

.prompt-settings {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid var(--border);
}

.subsection-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 0.5rem 0;
}

.subsection-description {
  color: var(--text-secondary);
  font-size: 0.8125rem;
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
}

.setting-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text);
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.6;
  resize: vertical;
  min-height: 150px;
}

.setting-textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.setting-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  margin-top: 0.5rem;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border);
  transition: var(--transition);
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: var(--transition);
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--primary);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.toggle-switch input:disabled + .toggle-slider {
  opacity: 0.6;
  cursor: not-allowed;
}

.example-templates {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.template-hint {
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.prompt-section {
  margin-top: var(--space-4);
  padding: var(--space-4);
  background: var(--bg);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.prompt-section:first-child {
  margin-top: 0;
}

.prompt-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 1rem 0;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: var(--text-xs);
}
</style>
