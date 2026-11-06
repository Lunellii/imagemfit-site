// Peças comuns das imagens que o cliente compartilha (quadro avulso e seleção).

export const SHARE_COLORS = {
  ink: "#0e0d0b",
  inkSoft: "#1b1916",
  ivory: "#f7f2e9",
  paper: "#ffffff",
  gold: "#c9a056",
  goldDeep: "#a9813c",
  goldLight: "#e3c584",
  text: "#1a1815",
  muted: "#7b746a",
};

export const SHARE_NOTICE_TITLE = "Imagem ilustrativa";
export const SHARE_NOTICE_TEXT = "Cores e detalhes podem ter pequenas alterações após a impressão.";
export const SHARE_SITE = "imagemfitquadros.com.br";

export const SERIF = "'Playfair Display', Georgia, serif";
export const SANS = "Montserrat, Arial, sans-serif";

const LOGO_URL = `${import.meta.env.BASE_URL}logo-imagem-fit-quadros-branca.png`;
// Área visível da logo, em proporção do arquivo. O servidor pode entregar o PNG
// redimensionado, então coordenadas em pixels absolutos não funcionam.
const LOGO_CROP = { x: 0.181, y: 0.32, width: 0.637, height: 0.358 };

export const loadImage = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const image = new Image();
    try {
      if (new URL(src, window.location.href).origin !== window.location.origin) image.crossOrigin = "anonymous";
    } catch {
      // Segue carregando mesmo sem conseguir interpretar a URL.
    }
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

export const loadLogo = () => loadImage(LOGO_URL);

export async function loadShareFonts() {
  if (!document.fonts?.load) return;
  const faces = [
    `600 32px ${SERIF}`,
    `italic 400 32px ${SERIF}`,
    `400 16px ${SANS}`,
    `500 16px ${SANS}`,
    `600 16px ${SANS}`,
    `700 16px ${SANS}`,
  ];
  await Promise.race([
    Promise.all(faces.map((face) => document.fonts.load(face).catch(() => null))),
    new Promise((resolve) => window.setTimeout(resolve, 1500)),
  ]);
}

export const setFont = (context, font, spacing = 0) => {
  context.font = font;
  if ("letterSpacing" in context) context.letterSpacing = `${spacing}px`;
};

// Desenha a logo e devolve a largura usada.
export function drawLogo(context, logo, x, y, height) {
  if (!logo) return 0;
  const sx = logo.naturalWidth * LOGO_CROP.x;
  const sy = logo.naturalHeight * LOGO_CROP.y;
  const sw = logo.naturalWidth * LOGO_CROP.width;
  const sh = logo.naturalHeight * LOGO_CROP.height;
  const width = (sw / sh) * height;
  context.drawImage(logo, sx, sy, sw, sh, x, y, width, height);
  return width;
}

export function drawCover(context, image, x, y, width, height) {
  if (!image) {
    context.fillStyle = "#e9e3d8";
    context.fillRect(x, y, width, height);
    context.fillStyle = SHARE_COLORS.muted;
    setFont(context, `500 15px ${SANS}`);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Imagem indisponível", x + width / 2, y + height / 2);
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    return;
  }
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sw = width / scale;
  const sh = height / scale;
  context.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, width, height);
}

export function goldGradient(context, x0, x1) {
  const gradient = context.createLinearGradient(x0, 0, x1, 0);
  gradient.addColorStop(0, SHARE_COLORS.goldDeep);
  gradient.addColorStop(0.5, SHARE_COLORS.goldLight);
  gradient.addColorStop(1, SHARE_COLORS.goldDeep);
  return gradient;
}

// Selo redondo com "i" para o aviso de imagem ilustrativa.
export function drawInfoBadge(context, cx, cy, radius) {
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.lineWidth = Math.max(1.5, radius * 0.14);
  context.strokeStyle = SHARE_COLORS.gold;
  context.stroke();
  context.fillStyle = SHARE_COLORS.gold;
  setFont(context, `italic 600 ${Math.round(radius * 1.35)}px ${SERIF}`);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("i", cx, cy + radius * 0.06);
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
}

export function wrapText(context, text, maxWidth) {
  const lines = [];
  let current = "";
  String(text || "")
    .split(" ")
    .forEach((word) => {
      const test = current ? `${current} ${word}` : word;
      if (context.measureText(test).width <= maxWidth || !current) {
        current = test;
      } else {
        lines.push(current);
        current = word;
      }
    });
  if (current) lines.push(current);
  return lines;
}

export function truncateText(context, text, maxWidth) {
  const value = String(text || "").trim();
  if (!value || context.measureText(value).width <= maxWidth) return value;
  let truncated = value;
  while (truncated.length > 0 && context.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated ? `${truncated}…` : "";
}

export const canvasToPng = (canvas) =>
  new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG_FAILED"))), "image/png");
    } catch (error) {
      reject(error);
    }
  });
