<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'
defineProps<{ date?: string | null }>()
</script>

<template>
  <time v-if="date" :datetime="date" class="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] leading-relaxed text-(--ink-text-muted)">
    <CalendarDays :size="12" aria-hidden="true" class="shrink-0" />
    <span>Lançamento {{ date.split('-').reverse().join('/') }}</span>
  </time>
</template>
