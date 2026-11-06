import {
  SANS,
  SERIF,
  SHARE_COLORS,
  SHARE_NOTICE_TEXT,
  SHARE_NOTICE_TITLE,
  SHARE_SITE,
  canvasToPng,
  drawCover,
  drawInfoBadge,
  drawLogo,
  goldGradient,
  loadImage,
  loadLogo,
  loadShareFonts,
  setFont,
  truncateText,
  wrapText,
} from "@/utils/shareImageKit";

const WIDTH = 1080;
const PADDING = 56;
const GAP = 28;
const HEADER_HEIGHT = 206;
const MAT = 10;

const columnsFor = (count) => (count === 1 ? 1 : count === 2 || count === 4 ? 2 : 3);

// items: [{ image_url, code, label, size }]
export async function createSelectionImage(items, requestText) {
  const [logo, images] = await Promise.all([
    loadLogo(),
    Promise.all(items.map((item) => loadImage(item.image_url))),
    loadShareFonts(),
  ]);

  const columns = columnsFor(items.length);
  const rows = Math.ceil(items.length / columns);
  const cardWidth = Math.floor((WIDTH - PADDING * 2 - GAP * (columns - 1)) / columns);
  const imageWidth = cardWidth - MAT * 2;
  const imageHeight = Math.round(imageWidth * (columns === 1 ? 0.7 : 0.68));
  const hasSize = items.some((item) => item.size);
  const captionHeight = (columns === 3 ? 92 : columns === 2 ? 104 : 116) + (hasSize ? 24 : 0);
  const cardHeight = MAT + imageHeight + captionHeight;
  const gridHeight = rows * cardHeight + (rows - 1) * GAP;

  const measure = document.createElement("canvas").getContext("2d");
  const boxPadding = 40;
  const boxInner = WIDTH - PADDING * 2 - boxPadding * 2;
  setFont(measure, `400 19px ${SANS}`);
  const requestLines = wrapText(measure, requestText, boxInner);
  setFont(measure, `400 16px ${SANS}`);
  const noticeLines = wrapText(measure, SHARE_NOTICE_TEXT, boxInner - 44);
  const requestHeight = 40 + 38 + requestLines.length * 29 + 30;
  const noticeHeight = 30 + 24 + noticeLines.length * 24 + 34;
  const boxHeight = requestHeight + noticeHeight;
  const bottomHeight = 72;

  const gridY = HEADER_HEIGHT + 5 + 52;
  const boxY = gridY + gridHeight + 48;
  const height = boxY + boxHeight + 48 + bottomHeight;

  const pixelRatio = height * 2 > 14000 ? 1 : 2;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * pixelRatio;
  canvas.height = height * pixelRatio;
  const context = canvas.getContext("2d");
  context.scale(pixelRatio, pixelRatio);

  // Fundo
  context.fillStyle = SHARE_COLORS.ivory;
  context.fillRect(0, 0, WIDTH, height);

  // Cabeçalho
  context.fillStyle = SHARE_COLORS.ink;
  context.fillRect(0, 0, WIDTH, HEADER_HEIGHT);
  drawLogo(context, logo, PADDING, 60, 86);

  const right = WIDTH - PADDING;
  context.textAlign = "right";
  context.fillStyle = SHARE_COLORS.gold;
  setFont(context, `600 13px ${SANS}`, 4);
  context.fillText("SELEÇÃO PARA ORÇAMENTO", right - 4, 92);

  const countWord = items.length === 1 ? " quadro" : " quadros";
  setFont(context, `italic 400 46px ${SERIF}`);
  const wordWidth = context.measureText(countWord).width;
  context.fillStyle = "#ffffff";
  context.fillText(countWord, right, 148);
  setFont(context, `600 54px ${SERIF}`);
  context.fillStyle = SHARE_COLORS.goldLight;
  context.fillText(String(items.length), right - wordWidth, 148);
  context.textAlign = "left";

  context.fillStyle = goldGradient(context, 0, WIDTH);
  context.fillRect(0, HEADER_HEIGHT, WIDTH, 5);

  // Cartões
  const codeSize = columns === 3 ? 23 : columns === 2 ? 27 : 32;
  items.forEach((item, index) => {
    const x = PADDING + (index % columns) * (cardWidth + GAP);
    const y = gridY + Math.floor(index / columns) * (cardHeight + GAP);

    context.save();
    context.shadowColor = "rgba(45, 32, 12, 0.16)";
    context.shadowBlur = 28;
    context.shadowOffsetY = 10;
    context.fillStyle = SHARE_COLORS.paper;
    context.fillRect(x, y, cardWidth, cardHeight);
    context.restore();

    drawCover(context, images[index], x + MAT, y + MAT, imageWidth, imageHeight);

    const textX = x + MAT + 8;
    const textWidth = imageWidth - 16;
    const captionY = y + MAT + imageHeight;

    const number = String(index + 1).padStart(2, "0");
    context.textAlign = "right";
    context.fillStyle = SHARE_COLORS.gold;
    setFont(context, `italic 400 ${codeSize - 2}px ${SERIF}`);
    context.fillText(number, x + cardWidth - MAT - 8, captionY + 40);
    const numberWidth = context.measureText(number).width + 12;
    context.textAlign = "left";

    context.fillStyle = SHARE_COLORS.text;
    setFont(context, `700 ${codeSize}px ${SANS}`, 0.3);
    context.fillText(truncateText(context, `#${item.code}`, textWidth - numberWidth), textX, captionY + 40);

    if (item.label) {
      context.fillStyle = SHARE_COLORS.muted;
      setFont(context, `600 ${columns === 3 ? 11 : 13}px ${SANS}`, 1.8);
      context.fillText(truncateText(context, item.label.toUpperCase(), textWidth), textX, captionY + 66);
    }
    if (item.size) {
      context.fillStyle = SHARE_COLORS.goldDeep;
      setFont(context, `600 ${columns === 3 ? 13 : 15}px ${SANS}`);
      context.fillText(truncateText(context, `Tamanho: ${item.size}`, textWidth), textX, captionY + 92);
    }

    context.fillStyle = goldGradient(context, x, x + cardWidth);
    context.fillRect(x, y + cardHeight - 3, cardWidth, 3);
  });

  // Pedido + aviso
  const boxX = PADDING;
  const boxWidth = WIDTH - PADDING * 2;
  context.fillStyle = SHARE_COLORS.ink;
  context.fillRect(boxX, boxY, boxWidth, boxHeight);
  context.fillStyle = goldGradient(context, boxX, boxX + boxWidth);
  context.fillRect(boxX, boxY, boxWidth, 3);

  const innerX = boxX + boxPadding;
  context.fillStyle = SHARE_COLORS.goldLight;
  setFont(context, `italic 400 32px ${SERIF}`);
  context.fillText("Pedido de orçamento", innerX, boxY + 40 + 26);
  context.fillStyle = "rgba(247, 242, 233, 0.86)";
  setFont(context, `400 19px ${SANS}`);
  requestLines.forEach((line, index) => context.fillText(line, innerX, boxY + 40 + 38 + 24 + index * 29));

  const dividerY = boxY + requestHeight;
  context.fillStyle = "rgba(201, 160, 86, 0.3)";
  context.fillRect(innerX, dividerY, boxInner, 1);

  drawInfoBadge(context, innerX + 14, dividerY + 30 + 12, 14);
  context.fillStyle = SHARE_COLORS.goldLight;
  setFont(context, `700 14px ${SANS}`, 3);
  context.fillText(SHARE_NOTICE_TITLE.toUpperCase(), innerX + 44, dividerY + 30 + 17);
  context.fillStyle = "rgba(247, 242, 233, 0.72)";
  setFont(context, `400 16px ${SANS}`);
  noticeLines.forEach((line, index) => context.fillText(line, innerX + 44, dividerY + 30 + 24 + 20 + index * 24));

  // Rodapé
  const bottomY = height - bottomHeight;
  context.fillStyle = SHARE_COLORS.ink;
  context.fillRect(0, bottomY, WIDTH, bottomHeight);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = SHARE_COLORS.gold;
  setFont(context, `600 13px ${SANS}`, 5);
  context.fillText(SHARE_SITE.toUpperCase(), WIDTH / 2, bottomY + bottomHeight / 2);

  return canvasToPng(canvas);
}
