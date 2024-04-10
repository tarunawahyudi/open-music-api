const Joi = require('joi');

const PostPlaylistsPayloadSchema = Joi.object({
  name: Joi.string().required(),
});

const SongToPlaylistsPayloadSchema = Joi.object({
  songId: Joi.string().required(),
});

module.exports = {
  PostPlaylistsPayloadSchema,
  SongToPlaylistsPayloadSchema,
};
