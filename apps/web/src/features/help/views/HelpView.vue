<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppShell from '../../../components/AppShell.vue'

const tutorials = [
  { id: 'calendario', title: 'Monte sua semana', steps: ['No Calendário, abra o dia desejado e selecione “+ Adicionar”. Busque pelo título e selecione o anime.', 'Em Descobrir, explore a temporada ou use a busca e os filtros. Selecione um anime para ver detalhes e adicioná-lo ao calendário.', 'Arraste os cards entre dias. Para mudar sem arrastar, use o lápis no card e escolha “Dia da semana”. Use Extra para os animes sem dia definido.'] },
  { id: 'progresso', title: 'Atualize episódios e data de lançamento', steps: ['Use + e − no card para avançar ou corrigir o episódio atual. Quando o total é conhecido, o progresso aparece na barra.', 'Selecione o lápis para abrir “Editar anime”. Você pode alterar título, status, episódios, dia, link de acesso e data de lançamento.', 'A data é a estreia do anime, não a data do próximo episódio. Informe a data e salve: ela aparece abaixo do título. Para removê-la, limpe o campo e salve.'] },
  { id: 'temporadas', title: 'Organize outras temporadas', steps: ['Use “Nova temporada” para criar um calendário de outra estação e ano. “Trocar temporada” abre os calendários existentes.', '“Importar da temporada anterior” traz os animes ainda não concluídos, preservando o progresso.', 'Para escolher um anime específico de outro calendário, use “Buscar em outra temporada”. O calendário de origem é preservado.'] },
  { id: 'museu', title: 'Registre o que já assistiu', steps: ['No computador, clique com o botão direito no card e escolha “Marcar como assistido” para registrá-lo no Museu. Você pode informar nota e comentário.', 'Também é possível adicionar um anime diretamente no Museu, sem passar pelo calendário, e informar quando você assistiu.', 'Visite Estatísticas para acompanhar sua coleção. Concluir os episódios no calendário muda o status; o registro no Museu é uma ação separada.'] },
  { id: 'social', title: 'Compartilhe e personalize', steps: ['Em Social, gere um link de compartilhamento ou convide alguém pelo nome de usuário. Quem recebe pode visualizar seu calendário; não pode editá-lo.', 'Você pode desativar o link e revogar convites. Siga pessoas e acompanhe comentários, reações e notificações na mesma área.', 'Em Temas, personalize as cores e o fundo ou use o modo automático. No Perfil, atualize seus dados e escolha se suas estatísticas ficam públicas.'] },
]
const faqs = [
  { question: 'Por que alguns animes não têm data de lançamento?', answer: 'O catálogo pode ainda não informar uma data completa. Nesse caso, o card não mostra uma data. Você pode preenchê-la manualmente pelo lápis do card.' },
  { question: 'A edição do anime é só minha?', answer: 'Título, imagem, sinopse e data de lançamento pertencem ao cadastro compartilhado do anime. Ao editar esses dados, a mudança pode aparecer nos calendários de outras pessoas. Dia da semana, status e progresso pertencem ao seu calendário.' },
  { question: 'Como organizo um anime sem dia certo?', answer: 'Coloque-o na coluna Extra (backlog). Quando decidir assistir, mova-o para um dia da semana ou altere o dia em “Editar anime”.' },
  { question: 'Por que aparece “em exibição” no progresso?', answer: 'Esse rótulo aparece quando o total de episódios não está informado. Você pode continuar registrando seu progresso ou preencher o total em “Editar anime”.' },
  { question: 'Posso repetir o mesmo anime?', answer: 'O mesmo anime pode estar em temporadas diferentes, mas não pode aparecer duas vezes no mesmo calendário. O Museu mantém um registro por anime na sua coleção.' },
  { question: 'Remover do calendário apaga do Museu?', answer: 'Não. O Museu mantém um registro independente do calendário. Remover um card não remove o registro de assistido.' },
  { question: 'Como vejo o tutorial inicial novamente?', answer: 'Os mesmos primeiros passos estão nesta página, sempre acessível em Ajuda. Ao dispensar o card inicial, sua escolha fica salva para esta conta neste navegador. Em outro navegador, ele pode aparecer novamente.' },
  { question: 'Como identifico os botões que só têm ícones?', answer: 'Passe o mouse ou use Tab para focar um botão e ler sua dica. Enter ou Espaço ativa botões; Escape fecha a dica. No celular, use os tutoriais desta página para consultar as ações.' },
]
</script>

<template>
  <AppShell title="Ajuda" subtitle="Do primeiro anime à sua coleção">
    <main class="mx-auto min-h-full max-w-4xl select-text px-4 py-6 sm:px-8 sm:py-10">
      <div class="glass glass-strong rounded-2xl p-5 sm:p-8">
        <h1 class="font-display text-2xl font-bold text-(--ink-text) sm:text-3xl">Como usar o AnimeWeek</h1>
        <p class="mt-3 max-w-prose text-sm leading-7 text-(--ink-text-muted)">Organize o que quer assistir, acompanhe os episódios e guarde o que já terminou. Comece pelo calendário e volte aqui quando precisar.</p>
        <nav aria-label="Tutoriais" class="mt-5 flex flex-wrap gap-2 text-sm">
          <a v-for="item in tutorials" :key="item.id" :href="`#${item.id}`" class="glass rounded-full px-3.5 py-1.5 text-(--ink-text) hover:border-white/30">{{ item.title }}</a>
          <a href="#duvidas" class="glass rounded-full px-3.5 py-1.5 text-(--ink-text) hover:border-white/30">Dúvidas frequentes</a>
        </nav>
      </div>

      <section v-for="item in tutorials" :id="item.id" :key="item.id" class="glass mt-5 scroll-mt-6 rounded-2xl p-5 sm:p-8">
        <h2 class="font-display text-lg font-bold text-(--ink-text)">{{ item.title }}</h2>
        <ol class="mt-3 max-w-prose list-decimal space-y-3 pl-5 text-sm leading-7 text-(--ink-text-muted)">
          <li v-for="step in item.steps" :key="step">{{ step }}</li>
        </ol>
      </section>

      <section id="duvidas" class="glass mt-5 scroll-mt-6 rounded-2xl p-5 sm:p-8">
        <h2 class="mb-4 font-display text-xl font-bold text-(--ink-text)">Dúvidas frequentes</h2>
        <details v-for="faq in faqs" :key="faq.question" class="border-b border-white/10 py-4 last:border-b-0">
          <summary class="cursor-pointer text-sm font-semibold leading-6 text-(--ink-text)">{{ faq.question }}</summary>
          <p class="mt-3 max-w-prose text-sm leading-7 text-(--ink-text-muted)">{{ faq.answer }}</p>
        </details>
      </section>

      <RouterLink :to="{ name: 'home' }" class="mt-6 inline-block rounded-lg bg-(--brand-secondary) px-4 py-2.5 text-sm font-semibold text-white">Ir para meu calendário</RouterLink>
    </main>
  </AppShell>
</template>
