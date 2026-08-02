<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'

interface LibraryDocument {
  title: string
  category: string
  path: string
  type: string
  size: string
  link: string
}

const props = defineProps<{
  documents: LibraryDocument[]
}>()

const query = ref('')
const selectedCategory = ref('')
const selectedType = ref('')

const categories = computed(() => {
  const preferredOrder = ['嵌入式', '机器人运动控制']
  const counts = new Map<string, number>()
  for (const document of props.documents) {
    counts.set(document.category, (counts.get(document.category) || 0) + 1)
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.name)
      const bIndex = preferredOrder.indexOf(b.name)
      if (aIndex !== -1 || bIndex !== -1) {
        return (aIndex === -1 ? preferredOrder.length : aIndex) -
          (bIndex === -1 ? preferredOrder.length : bIndex)
      }
      return a.name.localeCompare(b.name, 'zh-CN')
    })
})

const types = computed(() => [...new Set(props.documents.map((document) => document.type))])

const hasFilters = computed(() => Boolean(
  query.value.trim() || selectedCategory.value || selectedType.value
))

const results = computed(() => {
  const terms = normalize(query.value).split(/\s+/).filter(Boolean)

  return props.documents.filter((document) => {
    if (selectedCategory.value && document.category !== selectedCategory.value) return false
    if (selectedType.value && document.type !== selectedType.value) return false

    const searchable = normalize(`${document.title} ${document.path} ${document.type}`)
    return terms.every((term) => searchable.includes(term))
  })
})

function normalize(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('zh-CN')
}

function chooseCategory(category: string) {
  selectedCategory.value = selectedCategory.value === category ? '' : category
}

function clearFilters() {
  query.value = ''
  selectedCategory.value = ''
  selectedType.value = ''
}
</script>

<template>
  <section class="kb-library-search" aria-labelledby="kb-library-search-title">
    <h2 id="kb-library-search-title" class="visually-hidden">搜索资料</h2>

    <div class="kb-library-search-controls">
      <label class="kb-library-search-field">
        <span class="visually-hidden">输入资料关键词</span>
        <input
          v-model="query"
          type="search"
          placeholder="搜索资料名称、芯片型号或技术方向"
          autocomplete="off"
        >
      </label>

      <label class="kb-library-type-filter">
        <span class="visually-hidden">筛选文件格式</span>
        <select v-model="selectedType" aria-label="筛选文件格式">
          <option value="">全部格式</option>
          <option v-for="type in types" :key="type" :value="type">{{ type }}</option>
        </select>
      </label>
    </div>

    <div class="kb-category-segments" aria-label="筛选资料分类">
      <button
        type="button"
        :class="{ 'is-active': !selectedCategory }"
        @click="selectedCategory = ''"
      >
        全部 <span>{{ documents.length }}</span>
      </button>
      <button
        v-for="category in categories"
        :key="category.name"
        type="button"
        :class="{ 'is-active': selectedCategory === category.name }"
        @click="chooseCategory(category.name)"
      >
        {{ category.name }} <span>{{ category.count }}</span>
      </button>
    </div>

    <div v-if="hasFilters" class="kb-library-results">
      <div class="kb-library-results-heading">
        <p aria-live="polite">找到 <strong>{{ results.length }}</strong> 份资料</p>
        <button type="button" class="kb-clear-filters" @click="clearFilters">清除筛选</button>
      </div>

      <ul v-if="results.length" class="kb-library-result-list">
        <li v-for="document in results" :key="document.link">
          <a :href="withBase(document.link)">
            <span class="kb-result-main">
              <strong>{{ document.title }}</strong>
              <small>{{ document.path }}</small>
            </span>
            <span class="kb-result-meta">
              <span>{{ document.type }}</span>
              <small>{{ document.size }}</small>
            </span>
          </a>
        </li>
      </ul>

      <p v-else class="kb-library-empty">暂无匹配资料，请换一个关键词或分类。</p>
    </div>
  </section>
</template>
