const Logger = require('../../utils/logger');

class AlbumsHandler {
  constructor(service, storageService, validator) {
    this._service = service;
    this._storageService = storageService;
    this._validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.postUploadCoverHandler = this.postUploadCoverHandler.bind(this);
    this.likeAlbumHandler = this.likeAlbumHandler.bind(this);
    this.unlikeAlbumHandler = this.unlikeAlbumHandler.bind(this);
    this.countLikeAlbumHandler = this.countLikeAlbumHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name = 'untitled', year } = request.payload;
    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });

    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadCoverHandler(request, h) {
    const { cover } = request.payload;
    const { id } = request.params;

    this._validator.validateCoverHeader(cover.hapi.headers);

    const filename = await this._storageService.writeFile(cover, cover.hapi);
    Logger.log(`filename: ${filename} - upload to directory`);

    await this._service.editAlbumCoverById(id, filename);
    Logger.log(`filename: ${filename} - saved to database`);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });

    response.code(201);
    return response;
  }

  async likeAlbumHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { id: albumId } = request.params;

    Logger.log(`album id: ${albumId}`);
    Logger.log(`user id: ${userId}`);

    await this._service.verifyLikeAlbum(userId, albumId);
    await this._service.addLikeAlbum({ userId, albumId });
    Logger.log('like success save to database');

    const response = h.response({
      status: 'success',
      message: 'like album success',
    });

    response.code(201);
    return response;
  }

  async unlikeAlbumHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { id: albumId } = request.params;

    await this._service.verifyUnlikeAlbum(userId, albumId);
    await this._service.deleteLikeAlbum(userId, albumId);

    Logger.log('like success delete from database');

    const response = h.response({
      status: 'success',
      message: 'unlike album success',
    });

    response.code(200);
    return response;
  }

  async countLikeAlbumHandler(request, h) {
    const { id } = request.params;

    const result = await this._service.getLikeAlbum(id);
    const total = parseInt(result.total);

    Logger.log(`Total album ${total}`);

    const response = h.response({
      status: 'success',
      data: {
        likes: total,
      },
    });

    if (result.cache != null) {
      response.header('X-Data-Source', result.cache);
    }

    response.code(200);
    return response;
  }
}

module.exports = AlbumsHandler;
