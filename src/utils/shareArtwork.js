import {
  SANS,
  SHARE_COLORS,
  SHARE_NOTICE_TEXT,
  SHARE_NOTICE_TITLE,
  canvasToPng,
  drawInfoBadge,
  drawLogo,
  goldGradient,
  loadImage,
  loadLogo,
  loadShareFonts,
  setFont,
} from "@/utils/shareImageKit";

export async function createArtworkFile({ image_url: imageUrl, code }) {
  const [image, logo] = await Promise.all([loadImage(imageUrl), loadLogo(), loadShareFonts()]);
  if (!image) throw new Error("IMAGE_LOAD_FAILED");

  const width = Math.min(image.naturalWidth, 1600);
  const height = Math.round((image.naturalHeight * width) / image.naturalWidth);
  const s = width / 1080;
  const lineHeight = Math.max(3, Math.round(5 * s));
  const footerHeight = Math.round(150 * s);
  const noticeHeight = Math.round(66 * s);
  const padding = Math.round(48 * s);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height + lineHeight + footerHeight + noticeHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("CANVAS_UNAVAILABLE");

  context.fillStyle = SHARE_COLORS.paper;
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  context.fillStyle = goldGradient(context, 0, width);
  context.fillRect(0, height, width, lineHeight);

  const footerY = height + lineHeight;
  context.fillStyle = SHARE_COLORS.ink;
  context.fillRect(0, footerY, width, footerHeight + noticeHeight);

  const logoHeight = Math.round(74 * s);
  drawLogo(context, logo, padding, footerY + (footerHeight - logoHeight) / 2, logoHeight);

  context.textAlign = "right";
  context.fillStyle = SHARE_COLORS.gold;
  setFont(context, `600 ${Math.round(14 * s)}px ${SANS}`, 5 * s);
  context.fillText("CÓDIGO DO QUADRO", width - padding - 5 * s, footerY + footerHeight / 2 - 18 * s);
  context.fillStyle = "#ffffff";
  setFont(context, `700 ${Math.round(44 * s)}px ${SANS}`, 1 * s);
  context.fillText(`#${code}`, width - padding, footerY + footerHeight / 2 + 32 * s, width * 0.5);

  const noticeY = footerY + footerHeight;
  context.fillStyle = SHARE_COLORS.inkSoft;
  context.fillRect(0, noticeY, width, noticeHeight);
  context.fillStyle = "rgba(201, 160, 86, 0.28)";
  context.fillRect(0, noticeY, width, Math.max(1, Math.round(s)));

  setFont(context, `700 ${Math.round(16 * s)}px ${SANS}`);
  const title = `${SHARE_NOTICE_TITLE}  ·  `;
  const titleWidth = context.measureText(title).width;
  setFont(context, `400 ${Math.round(16 * s)}px ${SANS}`);
  const bodyWidth = context.measureText(SHARE_NOTICE_TEXT).width;
  const badgeRadius = 11 * s;
  const rowWidth = badgeRadius * 2 + 14 * s + titleWidth + bodyWidth;
  const fit = Math.min(1, (width - padding * 2) / rowWidth);
  const rowX = (width - rowWidth * fit) / 2;
  const rowY = noticeY + noticeHeight / 2;

  context.save();
  context.translate(rowX, rowY);
  context.scale(fit, fit);
  drawInfoBadge(context, badgeRadius, 0, badgeRadius);
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillStyle = SHARE_COLORS.goldLight;
  setFont(context, `700 ${Math.round(16 * s)}px ${SANS}`);
  context.fillText(title, badgeRadius * 2 + 14 * s, 1 * s);
  context.fillStyle = "rgba(247, 242, 233, 0.78)";
  setFont(context, `400 ${Math.round(16 * s)}px ${SANS}`);
  context.fillText(SHARE_NOTICE_TEXT, badgeRadius * 2 + 14 * s + titleWidth, 1 * s);
  context.restore();

  const blob = await canvasToPng(canvas);
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
