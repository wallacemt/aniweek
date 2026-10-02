<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { X } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const visible = ref(false)
const key = () => `aniweek:welcome:v1:${auth.user?.id}`
watch(() => auth.user?.id, id => {
  try { visible.value = !!id && localStorage.getItem(key()) !== 'dismissed' }
  catch { visible.value = !!id }
}, { immediate: true })
function dismiss() {
  visible.value = false
  try { localStorage.setItem(key(), 'dismissed') }
  catch { /* Storage can be disabled; dismissal still works for this visit. */ }
}
</script>

<template>
  <section v-if="visible" aria-labelledby="welcome-title" class="glass glass-strong relative mx-3 mt-3 shrink-0 rounded-2xl p-4 sm:mx-6 sm:mt-5 sm:p-5">
    <button type="button" v-tooltip="'Dispensar introdução'" class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-(--ink-text-muted) hover:bg-white/10" @click="dismiss">
      <X :size="16" aria-hidden="true" />
    </button>
    <h2 id="welcome-title" class="pr-8 font-display text-lg font-bold text-(--ink-text)">Sua semana de animes começa aqui</h2>
    <ol class="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-(--ink-text-muted)">
      <li><strong class="text-(--ink-text)">Escolha o que assistir.</strong> Use “+ Adicionar” no dia ou explore Descobrir.</li>
      <li><strong class="text-(--ink-text)">Acompanhe no seu ritmo.</strong> Mova os cards entre dias, avance episódios com + e use o lápis para editar a data de lançamento.</li>
      <li><strong class="text-(--ink-text)">Guarde suas memórias.</strong> Registre os assistidos no Museu, veja estatísticas, personalize Temas e compartilhe em Social.</li>
    </ol>
    <div class="mt-4 flex flex-wrap items-center gap-4 text-sm">
      <button type="button" class="rounded-lg bg-(--brand-secondary) px-4 py-2 font-semibold text-white" @click="dismiss">Entendi, vamos começar</button>
      <RouterLink :to="{ name: 'help' }" class="text-(--ink-text) underline underline-offset-4">Ver tutoriais e dúvidas</RouterLink>
    </div>
  </section>
</template>
