(function installSpriteFanImageIo(root) {
  'use strict';

  function loadObjectUrlImage(
    file,
    {
      urlApi = root.URL,
      createImage = () => new root.Image(),
      onLoad,
      onError,
    } = {},
  ) {
    if (!urlApi || typeof urlApi.createObjectURL !== 'function' || typeof urlApi.revokeObjectURL !== 'function') {
      throw new TypeError('an object-URL API is required');
    }
    if (typeof createImage !== 'function') throw new TypeError('createImage must be a function');
    if (typeof onLoad !== 'function') throw new TypeError('onLoad must be a function');

    const url = urlApi.createObjectURL(file);
    let released = false;
    const release = () => {
      if (released) return false;
      released = true;
      urlApi.revokeObjectURL(url);
      return true;
    };

    let image;
    try {
      image = createImage();
      image.onload = () => {
        try {
          onLoad(image);
        } finally {
          release();
        }
      };
      image.onerror = (event) => {
        release();
        if (typeof onError === 'function') onError(event);
      };
      image.src = url;
    } catch (error) {
      release();
      throw error;
    }
    return Object.freeze({ image, url, release });
  }

  root.SpriteFanImageIo = Object.freeze({ loadObjectUrlImage });
})(typeof globalThis !== 'undefined' ? globalThis : window);
