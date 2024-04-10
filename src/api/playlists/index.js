const PlaylistsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'playlists',
  version: '1.0.0',
  register: async (server, { songService, playlistService, validator }) => {
    const playlistsHandler = new PlaylistsHandler(songService, playlistService, validator);
    server.route(routes(playlistsHandler));
  },
};
