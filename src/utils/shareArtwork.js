const loadArtwork = (url) => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
  image.src = url;
});

export async function createArtworkFile({ image_url: imageUrl, code }) {
  const image = await loadArtwork(imageUrl);
  const width = Math.min(image.naturalWidth, 1600);
  const height = Math.round(image.naturalHeight * width / image.naturalWidth);
  const footerHeight = Math.max(96, Math.round(width * 0.09));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height + footerHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("CANVAS_UNAVAILABLE");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  context.fillStyle = "#151515";
  context.fillRect(0, height, width, footerHeight);
  context.fillStyle = "#c7a15a";
  context.fillRect(0, height, width, Math.max(3, Math.round(width * 0.004)));
  context.textBaseline = "middle";
  context.fillStyle = "#ffffff";
  context.font = `600 ${Math.max(18, Math.round(width * 0.024))}px Arial`;
  context.fillText("IMAGEM FIT", Math.round(width * 0.04), height + footerHeight / 2);
  context.textAlign = "right";
  context.font = `700 ${Math.max(24, Math.round(width * 0.035))}px Arial`;
  context.fillText(`#${code}`, Math.round(width * 0.96), height + footerHeight / 2, width * 0.52);

  const blob = await new Promise((resolve, reject) => {
    try {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("IMAGE_EXPORT_FAILED")), "image/png");
    } catch (error) {
      reject(error);
    }
  });
  const safeCode = String(code || "quadro").replace(/[^a-z0-9_-]/gi, "-");
  return new File([blob], `imagem-fit-${safeCode}.png`, { type: "image/png" });
}

export function downloadArtwork(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
