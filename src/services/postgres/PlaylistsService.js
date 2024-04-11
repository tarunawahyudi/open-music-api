const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const { mapDBToModelPlaylistByUsername } = require('../../utils');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES ($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async addSongToPlaylist({ id, songId }) {
    const songPlaylistId = nanoid(16);
    const query = {
      text: 'INSERT INTO playlist_songs VALUES ($1, $2, $3) RETURNING id',
      values: [songPlaylistId, id, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Song gagal ditambahkan ke playlist');
    }
  }

  async getPlaylists(owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE owner = $1',
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows.map(mapDBToModelPlaylistByUsername);
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. id tidak ditemukan');
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async getSongsFromPlaylist(id) {
    const playlistQuery = {
      text: 'SELECT p.id, p.name, u.username FROM playlists p LEFT JOIN users u ON p.owner=u.id WHERE p.id = $1',
      values: [id],
    };

    const resultPlaylist = await this._pool.query(playlistQuery);
    if (!resultPlaylist.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = resultPlaylist.rows[0];

    const songsQuery = {
      text: 'SELECT * FROM playlist_songs ps INNER JOIN songs s ON s.id=ps.song_id WHERE ps.playlist_id = $1',
      values: [playlist.id],
    };

    const resultSongs = await this._pool.query(songsQuery);
    const songs = resultSongs.rows;

    return {
      id: playlist.id,
      name: playlist.name,
      username: playlist.username,
      songs: songs.map((song) => ({
        id: song.id,
        title: song.title,
        performer: song.performer,
      })),
    };
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('playlist atau song tidak ditemukan');
    }
  }
}

module.exports = PlaylistsService;
