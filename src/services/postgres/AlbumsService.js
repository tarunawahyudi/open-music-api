const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const albumQuery = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const albumResult = await this._pool.query(albumQuery);
    if (!albumResult.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const album = albumResult.rows[0];

    const songQuery = {
      text: 'SELECT * FROM songs WHERE album_id = $1',
      values: [album.id],
    };

    const songResult = await this._pool.query(songQuery);
    const songs = songResult.rows;

    return {
      id: album.id,
      name: album.name,
      year: album.year,
      coverUrl: album.cover ? `http://${process.env.HOST}:${process.env.PORT}/albums/images/${album.cover}` : null,
      songs: songs.map((song) => ({
        id: song.id,
        title: song.title,
        performer: song.performer,
      })),
    };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. id tidak ditemukan');
    }
  }

  async editAlbumCoverById(id, filename) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2 RETURNING id',
      values: [filename, id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui cover. id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('album gagal dihapus. id tidak ditemukan');
    }
  }

  async addLikeAlbum({ userId, albumId }) {
    const id = `like-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('like album gagal');
    }

    await this._cacheService.delete(`albums:${albumId}`);
  }

  async getLikeAlbum(id) {
    try {
      const result = await this._cacheService.get(`albums:${id}`);
      const data = JSON.parse(result);
      return {
        total: data,
        cache: 'cache',
      }
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(id) FROM user_album_likes WHERE album_id = $1',
        values: [id],
      };

      const result = await this._pool.query(query);
      if (!result.rows.length) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      const total = result.rows[0].count;
      await this._cacheService.set(`albums:${id}`, JSON.stringify(total));

      return { total, cache: null };
    }
  }

  async deleteLikeAlbum(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('unlike album gagal');
    }

    await this._cacheService.delete(`albums:${albumId}`);
  }

  async isAvailableAlbum(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }
  }

  async verifyLikeAlbum(userId, albumId) {
    await this.isAvailableAlbum(albumId);
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);
    if (result.rows.length) {
      throw new InvariantError('Anda telah like album ini!');
    }
  }

  async verifyUnlikeAlbum(userId, albumId) {
    await this.isAvailableAlbum(albumId);
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Anda belum like album ini!');
    }
  }
}

module.exports = AlbumsService;
