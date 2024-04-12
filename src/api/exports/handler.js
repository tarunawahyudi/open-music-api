class ExportsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postExportPlaylistHandler = this.postExportPlaylistHandler.bind(this);
  }

  async postExportPlaylistHandler(request, h) {
    this._validator.validateExportPlaylistsPayload(request.payload);

    const { playlistId } = request.params;

    const message = {
      playlistId,
      userId: request.auth.credentials.id,
      targetEmail: request.payload.targetEmail,
    };

    await this._service.sendMessage('export:songs', JSON.stringify(message));
    const response = h.response({
      status: 'success',
      message: 'Permintaan anda dalam antrean',
    });

    response.statusCode(201);
    return response;
  }
}

module.exports = ExportsHandler;
