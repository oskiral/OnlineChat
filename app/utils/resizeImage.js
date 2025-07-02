export default async function resizeImage(file, options = {}) {
  const {
    maxWidth = 200,
    maxHeight = null,   // if null, uses maxWidth as height
    // maxHeight = 200, // if not provided, will use maxWidth as height
    forceSize = false   // if true, sets exact dimensions, ignoring aspect ratio
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (forceSize && maxWidth && maxHeight) {
        width = maxWidth;
        height = maxHeight;
      } else {
        // skalowanie proporcjonalne
        if (maxWidth && maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const scale = Math.min(widthRatio, heightRatio);
          width = width * scale;
          height = height * scale;
        } else if (maxWidth) {
          const scale = maxWidth / width;
          width = maxWidth;
          height = height * scale;
        } else if (maxHeight) {
          const scale = maxHeight / height;
          height = maxHeight;
          width = width * scale;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(resizedFile);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      }, file.type);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
// This function resizes an image file to a maximum width and height, maintaining aspect ratio.
// It returns a Promise that resolves to a resized File object.