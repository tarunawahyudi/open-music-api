const mapDBToModel = ({
    id,
    title,
    performer,
}) => ({
    id,
    title,
    performer,
});

const mapDBToModelDetail = ({
    id,
    title,
    year,
    genre,
    performer,
    duration,
    album_id
}) => ({
    id,
    title,
    year,
    genre,
    performer,
    duration,
    albumId: album_id
});

module.exports = { mapDBToModel, mapDBToModelDetail };