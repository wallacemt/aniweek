import { NotFoundException } from '@nestjs/common';
import { updateAnimeSchema } from '@aniweek/shared';
import { AnimesService } from './animes.service';

// Cobre a única regra não-trivial do módulo: degradação graciosa quando o
// Jikan está fora do ar (§12 do blueprint — servir o espelho local em vez de
// derrubar a rota). M6 (fora do blueprint) soma o guard de manuallyEdited.

function buildAnimesService() {
  const jikan = { getAnimeById: jest.fn(), searchAnime: jest.fn() };
  const prisma = {
    anime: { upsert: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    calendarEntry: { groupBy: jest.fn() },
  };
  const animes = new AnimesService(jikan as never, prisma as never);
  return { animes, jikan, prisma };
}

describe('AnimesService', () => {
  it('getByMalId serve do espelho local quando o Jikan está fora do ar', async () => {
    const { animes, jikan, prisma } = buildAnimesService();
    jikan.getAnimeById.mockRejectedValue(new Error('Jikan indisponível'));
    prisma.anime.findUnique.mockResolvedValue({
      malId: 52991,
      title: 'Frieren',
      imageUrl: null,
      synopsis: null,
      episodes: 28,
      genres: ['Fantasia'],
      malUrl: null,
      cachedAt: new Date(),
    });

    const result = await animes.getByMalId(52991);

    expect(result.title).toBe('Frieren');
    expect(prisma.anime.upsert).not.toHaveBeenCalled();
  });

  it('getByMalId propaga o erro quando não há nada em cache local para servir', async () => {
    const { animes, jikan, prisma } = buildAnimesService();
    jikan.getAnimeById.mockRejectedValue(new Error('Jikan indisponível'));
    prisma.anime.findUnique.mockResolvedValue(null);

    await expect(animes.getByMalId(999)).rejects.toThrow('Jikan indisponível');
  });

  it('getByMalId serve o espelho local (não o Jikan) quando o anime foi editado manualmente (M6)', async () => {
    const { animes, jikan, prisma } = buildAnimesService();
    jikan.getAnimeById.mockResolvedValue({
      malId: 52991,
      title: 'Frieren (Jikan)',
    });
    prisma.anime.findUnique.mockResolvedValue({
      malId: 52991,
      title: 'Frieren (editado pelo usuário)',
      imageUrl: null,
      synopsis: null,
      episodes: 28,
      genres: ['Fantasia'],
      malUrl: null,
      manuallyEdited: true,
    });

    const result = await animes.getByMalId(52991);

    expect(result.title).toBe('Frieren (editado pelo usuário)'); // edição do usuário não é descartada na leitura
    expect(prisma.anime.upsert).not.toHaveBeenCalled(); // e o espelho local (usado no board) também não é sobrescrito
  });

  it('update seta manuallyEdited:true pra proteger o próximo upsert do Jikan', async () => {
    const { animes, prisma } = buildAnimesService();
    prisma.anime.findUnique.mockResolvedValue({ id: 'anime-1' });
    prisma.anime.update.mockResolvedValue({
      id: 'anime-1',
      title: 'Novo título',
    });

    await animes.update('anime-1', { title: 'Novo título' });

    expect(prisma.anime.update).toHaveBeenCalledWith({
      where: { id: 'anime-1' },
      data: { title: 'Novo título', manuallyEdited: true },
    });
  });

  it('update devolve 404 se o anime não existe', async () => {
    const { animes, prisma } = buildAnimesService();
    prisma.anime.findUnique.mockResolvedValue(null);

    await expect(animes.update('anime-1', { title: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getCommunityPopular ordena por entryCount e filtra por gênero (M10.3)', async () => {
    const { animes, prisma } = buildAnimesService();
    prisma.calendarEntry.groupBy.mockResolvedValue([
      { animeId: 'anime-frieren', _count: { animeId: 5 } },
      { animeId: 'anime-solo-leveling', _count: { animeId: 2 } },
    ]);
    prisma.anime.findUnique.mockImplementation(
      ({ where: { id } }: { where: { id: string } }) =>
        Promise.resolve(
          id === 'anime-frieren'
            ? { malId: 1, title: 'Frieren', genres: ['Fantasy'] }
            : { malId: 2, title: 'Solo Leveling', genres: ['Action'] },
        ),
    );

    const all = await animes.getCommunityPopular();
    expect(all.map((a) => a.title)).toEqual(['Frieren', 'Solo Leveling']);
    expect(all[0].entryCount).toBe(5);

    const filtered = await animes.getCommunityPopular('Action');
    expect(filtered.map((a) => a.title)).toEqual(['Solo Leveling']);
  });
});

describe('release date persistence', () => {
  it('validates calendar dates and permits clearing an existing date', () => {
    expect(
      updateAnimeSchema.parse({ releaseDate: '2024-02-29' }).releaseDate,
    ).toBe('2024-02-29');
    expect(
      updateAnimeSchema.safeParse({ releaseDate: '2023-02-29' }).success,
    ).toBe(false);
    expect(
      updateAnimeSchema.safeParse({ releaseDate: '2026-13-01' }).success,
    ).toBe(false);
    expect(
      updateAnimeSchema.safeParse({ releaseDate: '2026-09-30T00:00:00Z' })
        .success,
    ).toBe(false);
    expect(
      updateAnimeSchema.parse({ releaseDate: null }).releaseDate,
    ).toBeNull();
    expect(updateAnimeSchema.parse({})).not.toHaveProperty('releaseDate');
  });
  it('persists the catalog date and serves it from the local fallback', async () => {
    const { animes, jikan, prisma } = buildAnimesService();
    jikan.getAnimeById.mockResolvedValue({
      malId: 1,
      releaseDate: '2026-09-30',
    });
    await animes.getByMalId(1);
    expect(prisma.anime.upsert.mock.calls).toMatchObject([
      [
        {
          create: { releaseDate: '2026-09-30' },
          update: { releaseDate: '2026-09-30' },
        },
      ],
    ]);
    prisma.anime.findUnique.mockResolvedValue({
      malId: 1,
      releaseDate: '2026-09-30',
    });
    jikan.getAnimeById.mockRejectedValue(new Error('offline'));
    expect((await animes.getByMalId(1)).releaseDate).toBe('2026-09-30');
  });
  it.each(['2026-09-30', null])(
    'saves manual date %s and protects it from refresh',
    async (releaseDate) => {
      const { animes, jikan, prisma } = buildAnimesService();
      prisma.anime.findUnique.mockResolvedValue({
        id: 'anime-1',
        manuallyEdited: true,
        releaseDate,
      });
      await animes.update('anime-1', { releaseDate });
      expect(prisma.anime.update).toHaveBeenCalledWith({
        where: { id: 'anime-1' },
        data: { releaseDate, manuallyEdited: true },
      });
      jikan.getAnimeById.mockResolvedValue({ releaseDate: '2000-01-01' });
      expect((await animes.getByMalId(1)).releaseDate).toBe(releaseDate);
      expect(prisma.anime.upsert).not.toHaveBeenCalled();
    },
  );
});
