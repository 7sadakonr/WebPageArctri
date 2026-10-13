<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { REPO_URL } from '../config'

const { t } = useI18n()
</script>

<template>
  <footer class="border-t border-line px-5 py-8 text-sm text-muted/70">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
      <span>© {{ new Date().getFullYear() }} Arctri · {{ t('footer.rights') }}</span>
      <span class="flex gap-5">
        <a :href="REPO_URL" target="_blank" rel="noopener" class="hover:text-fg">GitHub</a>
        <a :href="`${REPO_URL}/blob/main/CHANGELOG.md`" target="_blank" rel="noopener" class="hover:text-fg">Changelog</a>
      </span>
    </div>
  </footer>
</template>
