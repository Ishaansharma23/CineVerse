const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

const buildTmdbImageUrl = (path, size = 'w500') => {
    // size -> Ye image file ki resolution/quality size hai jo TMDB server se aati hai. as tmdb alag alg 
    // resolutions ki images rkhta or ye w500 fit hai for banner size 
  if (!path) {
    return '';
  }

  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

module.exports = {
  buildTmdbImageUrl,
};