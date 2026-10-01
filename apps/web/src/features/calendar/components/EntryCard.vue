<script setup lang="ts">
import ReleaseDate from '../../../components/ReleaseDate.vue'
import { computed, ref } from 'vue'
import { ExternalLink, Pencil, Heart, MessageCircle, Minus, Plus, X } from 'lucide-vue-next'
import type { CalendarEntryResponse } from '../api'
import CommentsModal from '../../social/components/CommentsModal.vue'
import { STATUS_META } from './entry-status-meta'

const props = defineProps<{ entry: CalendarEntryResponse }>()
const emit = defineEmits<{ edit: []; remove: []; progress: [currentEpisode: number]; contextmenu: [event: MouseEvent] }>()

// Comentário/reação são de QUEM VISITA (SharedEntryCard) — aqui, no próprio
// card do dono, é só leitura: sem botão de reagir ao próprio progresso, só
// um jeito de abrir o mesmo thread que a notificação truncada aponta.
const showComments = ref(false)
const commentCount = ref(props.entry.social?.commentCount ?? 0)
const hasSocial = computed(
  () => (props.entry.social?.commentCount ?? 0) > 0 || (props.entry.social?.reactionCount ?? 0) > 0,
)

// totalEpisodes null = "em exibição" (ADR-06: episodes vem null do Jikan
// pra animes ainda em transmissão) — não dá pra calcular % nesse caso.
const ongoing = computed(() => props.entry.totalEpisodes == null)
const pct = computed(() => {
  if (ongoing.value) return 100
  const total = props.entry.totalEpisodes as number
  if (total <= 0) return 0
  return Math.min(100, Math.round((props.entry.currentEpisode / total) * 100))
})
const epLabel = computed(() =>
  ongoing.value
    ? `Ep. ${props.entry.currentEpisode} · em exibição`
    : `Ep. ${props.entry.currentEpisode}/${props.entry.totalEpisodes}`,
)
const meta = computed(() => STATUS_META[props.entry.status])

const atMax = computed(
  () => !ongoing.value && props.entry.currentEpisode >= (props.entry.totalEpisodes as number),
)
function step(delta: number) {
  const next = props.entry.currentEpisode + delta
  if (next < 0) return
  emit('progress', next)
}
</script>

<template>
  <div
    class="glass group flex-shrink-0 cursor-grab overflow-hidden rounded-[13px] active:cursor-grabbing"
    @contextmenu.prevent="emit('contextmenu', $event)"
  >
    <div class="relative aspect-[2/3] bg-white/5">
      <img
        v-if="entry.anime.imageUrl"
        :src="entry.anime.imageUrl"
        :alt="entry.anime.title"
        class="h-full w-full object-cover"
      />
      <div
        class="pointer-events-none absolute inset-0"
        style="background: linear-gradient(to bottom, rgba(5, 6, 9, 0.5) 0%, transparent 22%, transparent 78%, rgba(5, 6, 9, 0.8) 100%)"
      />
      <button type="button" v-tooltip="'Editar anime'" class="absolute left-1.5 bottom-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-black/80 text-white" @click.stop="$emit('edit')">
        <Pencil :size="14" aria-hidden="true" />
      </button>
      <button
        type="button"
        v-tooltip="'Remover do calendário'"
        class="absolute right-1.5 bottom-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-[5px] text-(--ink-text-muted) transition-opacity hover:!bg-red-500/80 hover:!text-white"
        style="background: rgba(5, 6, 9, 0.75)"
        @click="$emit('remove')"
      >
        <X :size="11" />
      </button>
    </div>
    <div class="p-2.25 pb-2.75">
      <div class="mb-1.5 line-clamp-2 min-h-7.25 text-[11.5px] leading-tight font-bold text-(--ink-text)">
        {{ entry.anime.title }}
      </div>
      <ReleaseDate :date="entry.anime.releaseDate" />
      <div class="mb-1.25 flex items-center gap-1 text-[10px] text-(--ink-text-muted)">
        <button
          type="button"
          v-tooltip="'Episódio anterior'"
          class="flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded text-(--ink-text-faint) hover:!bg-white/10 hover:!text-(--ink-text) disabled:cursor-not-allowed"
          :disabled="entry.currentEpisode <= 0"
          @click="step(-1)"
        >
          <Minus :size="9" />
        </button>
        <span class="truncate">{{ epLabel }}</span>
        <button
          type="button"
          v-tooltip="'Próximo episódio'"
          class="flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded text-(--ink-text-faint) hover:!bg-white/10 hover:!text-(--ink-text) disabled:cursor-not-allowed"
          :disabled="atMax"
          @click="step(1)"
        >
          <Plus :size="9" />
        </button>
      </div>
      <div v-if="!ongoing" class="mb-2 h-1 overflow-hidden rounded-full" style="background: rgba(255, 255, 255, 0.07)">
        <div class="h-full" :style="{ width: `${pct}%`, background: meta.bar }" />
      </div>
      <div
        class="inline-flex rounded-full px-2 py-0.75 text-[9.5px] font-semibold"
        :style="{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }"
      >
        {{ meta.label }}
      </div>

      <!-- Onde o usuário assiste (M6, fora do blueprint) — só aparece se
           entry.anime.linkAccess estiver preenchido (PATCH /animes/:id). -->
      <a
        v-if="entry.anime.linkAccess"
        :href="entry.anime.linkAccess"
        target="_blank"
        rel="noopener noreferrer"
        title="Acessar anime"
        class="mt-1.5 flex items-center justify-center gap-1 rounded-md py-1 text-[9.5px] font-bold text-(--ink-text-muted) hover:!bg-white/10 hover:!text-(--ink-text)"
        style="background: rgba(255, 255, 255, 0.05)"
        @click.stop
      >
        <ExternalLink :size="9" /> Acessar anime
      </a>

      <!-- M10 — o que a rede social deixou nesse card. Só aparece se alguém
           já interagiu (senão é um badge vazio poluindo todo card). -->
      <button
        v-if="hasSocial"
        type="button"
        v-tooltip="'Ver comentários e reações'"
        class="mt-1.5 flex w-full items-center justify-center gap-3 rounded-md py-1 text-[9.5px] font-bold text-(--ink-text-muted) hover:!bg-white/10 hover:!text-(--ink-text)"
        style="background: rgba(255, 255, 255, 0.05)"
        @click.stop="showComments = true"
      >
        <span v-if="entry.social!.reactionCount > 0" class="flex items-center gap-1">
          <Heart :size="9" fill="currentColor" /> {{ entry.social!.reactionCount }}
        </span>
        <span v-if="commentCount > 0" class="flex items-center gap-1">
          <MessageCircle :size="9" /> {{ commentCount }}
        </span>
      </button>
    </div>

    <CommentsModal v-if="showComments" :entry-id="entry.id" :anime-title="entry.anime.title" :can-post="true"
      @close="showComments = false" @count-change="commentCount += $event" />
  </div>
</template>
