import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const p = new PrismaClient();

async function main() {
  await p.$transaction([
    p.notification.deleteMany(), p.report.deleteMany(), p.block.deleteMany(), p.comment.deleteMany(),
    p.postLike.deleteMany(), p.post.deleteMany(), p.follow.deleteMany(), p.listeningHistory.deleteMany(),
    p.favorite.deleteMany(), p.playlistTrack.deleteMany(), p.playlist.deleteMany(),
    p.track.deleteMany(), p.album.deleteMany(), p.artist.deleteMany(),
    p.passwordResetToken.deleteMany(), p.refreshToken.deleteMany(), p.session.deleteMany(),
    p.userSettings.deleteMany(), p.userProfile.deleteMany(), p.user.deleteMany(),
  ]);

  const hash = await bcrypt.hash('delta12345', 10);
  const alice = await p.user.create({ data: { email: 'alice@delta.test', username: 'alice', passwordHash: hash, profile: { create: { displayName: 'Alice Wave', bio: 'Синтезаторы и ночные города.' } }, settings: { create: {} } } });
  const bob = await p.user.create({ data: { email: 'bob@delta.test', username: 'bob', passwordHash: hash, profile: { create: { displayName: 'Bob Loop', bio: 'Собираю биты из чего придётся.' } }, settings: { create: {} } } });
  const mira = await p.user.create({ data: { email: 'mira@delta.test', username: 'mira', passwordHash: hash, profile: { create: { displayName: 'Mira', bio: 'Приватный аккаунт для своих.' } }, settings: { create: { privateProfile: true } } } });

  const artistsData = [
    { name: 'Nova Circuit', tracks: ['Neon Drive', 'Midnight Signal', 'Analog Heart'] },
    { name: 'Echo Chamber', tracks: ['Deep Field', 'Slow Orbit'] },
    { name: 'Luna Keys', tracks: ['Pulse Garden', 'Glass Rain'] },
    { name: 'Vela', tracks: ['Open Road'] },
  ];
  const genres = ['Electronic', 'Ambient', 'Lo-fi', 'Synthwave'];
  let i = 0;
  for (const a of artistsData) {
    const artist = await p.artist.create({ data: { name: a.name, bio: `${a.name} — демо-исполнитель DELTA` } });
    const album = await p.album.create({ data: { title: `${a.name} EP`, releaseYear: 2026, coverSeed: a.name, artistId: artist.id } });
    for (const t of a.tracks) {
      i++;
      await p.track.create({
        data: {
          title: t, durationSec: 180 + (i % 5) * 20, audioUrl: `/audio/track${((i - 1) % 8) + 1}.mp3`,
          genre: genres[i % genres.length], license: 'delta-test', coverSeed: t,
          artistId: artist.id, albumId: album.id, playCount: Math.floor(Math.random() * 50),
        },
      });
    }
  }

  await p.follow.createMany({ data: [{ followerId: alice.id, followeeId: bob.id }, { followerId: bob.id, followeeId: alice.id }, { followerId: alice.id, followeeId: mira.id }] });

  const firstTrack = await p.track.findFirst()!;
  const post1 = await p.post.create({ data: { authorId: bob.id, text: 'Ночной вайб от Nova Circuit — лучший старт недели.', trackId: (await p.track.findFirst({ orderBy: { playCount: 'desc' } }))!.id } });
  await p.post.create({ data: { authorId: alice.id, text: 'Собрала плейлист для работы. Делюсь позже!' } });
  await p.postLike.create({ data: { postId: post1.id, userId: alice.id } });
  await p.comment.create({ data: { postId: post1.id, authorId: alice.id, text: 'Топ 🔥' } });
  await p.notification.create({ data: { recipientId: bob.id, senderId: alice.id, type: 'LIKE_POST', payload: { postId: post1.id } } });

  console.log('Seed done:', { users: 3, tracks: i, demoPassword: 'delta12345' });
}

main().then(() => p.$disconnect()).catch(async (e) => { console.error(e); await p.$disconnect(); process.exit(1); });
