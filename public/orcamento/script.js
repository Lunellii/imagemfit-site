const storageKey = "orcamento-quadros-espelhos-v1";
const today = new Date().toISOString().slice(0, 10);

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const itemTemplate = document.querySelector("#itemTemplate");
const itemsList = document.querySelector("#itemsList");
const quotePreview = document.querySelector("#quotePreview");
const printArea = document.querySelector("#printArea");

const defaultCompany = {
  name: "Empresa de Quadros Decorativos",
  phone: "",
  email: "",
  address: "",
};

let state = loadState();

function newId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createItem() {
  return {
    id: newId(),
    type: "quadro",
    imageCode: "",
    description: "",
    width: "",
    height: "",
    quantity: "1",
    unitPrice: "",
    technique: "Impressão",
    material: "Canvas",
    glass: "Sem vidro",
    frame: "Sem moldura",
    frameColor: "",
    infiniteEdge: false,
    mirrorShape: "Orgânico",
    led: "Sem LED",
    edgeTape: "Sem fita de borda",
    edgeTapeColor: "",
    mirrorFinish: "",
    notes: "",
  };
}

function createDefaultState() {
  return {
    company: { ...defaultCompany },
    customer: {
      name: "",
      phone: "",
      email: "",
      address: "",
    },
    quote: {
      number: `ORC-${today.replaceAll("-", "")}`,
      date: today,
      validUntil: "",
      seller: "",
      payment: "",
      delivery: "",
      discount: "",
      freight: "",
      notes: "",
    },
    items: [createItem()],
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || !Array.isArray(saved.items) || saved.items.length === 0) {
      return createDefaultState();
    }
    return {
      ...createDefaultState(),
      ...saved,
      company: { ...defaultCompany, ...saved.company },
      customer: { ...createDefaultState().customer, ...saved.customer },
      quote: { ...createDefaultState().quote, ...saved.quote },
      items: saved.items.map((item) => ({ ...createItem(), ...item, id: item.id || newId() })),
    };
  } catch {
    return createDefaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // O orçamento continua funcionando mesmo quando o navegador bloqueia armazenamento local.
  }
}

function getPathValue(path) {
  return path.split(".").reduce((current, key) => current?.[key], state) ?? "";
}

function setPathValue(path, value) {
  const keys = path.split(".");
  let target = state;
  keys.slice(0, -1).forEach((key) => {
    target = target[key];
  });
  target[keys.at(-1)] = value;
}

function fillStaticFields() {
  document.querySelectorAll("[data-path]").forEach((field) => {
    field.value = getPathValue(field.dataset.path);
  });
}

function fillItemField(field, item) {
  const value = item[field.dataset.field];
  if (field.type === "checkbox") {
    field.checked = Boolean(value);
    return;
  }
  field.value = value ?? "";
}

function renderItems() {
  itemsList.innerHTML = "";
  state.items.forEach((item, index) => {
    const node = itemTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.itemId = item.id;
    node.dataset.type = item.type;
    node.querySelector('[data-role="item-number"]').textContent = String(index + 1).padStart(2, "0");
    node.querySelector('[data-role="item-title"]').textContent = item.description || labelForType(item.type);
    node.querySelectorAll("[data-field]").forEach((field) => fillItemField(field, item));
    itemsList.appendChild(node);
  });
  renderPreview();
}

function labelForType(type) {
  const labels = {
    quadro: "Quadro decorativo",
    espelho: "Espelho",
    outro: "Produto",
  };
  return labels[type] || "Produto";
}

function parseMoney(value) {
  if (typeof value === "number") {
    return value;
  }
  const cleaned = String(value || "").replace(/[^\d,.-]/g, "");
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value) {
  return currency.format(value || 0);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function itemTotal(item) {
  const quantity = Number.parseFloat(item.quantity) || 0;
  return quantity * parseMoney(item.unitPrice);
}

function totals() {
  const subtotal = state.items.reduce((sum, item) => sum + itemTotal(item), 0);
  const discount = parseMoney(state.quote.discount);
  const freight = parseMoney(state.quote.freight);
  return {
    subtotal,
    discount,
    freight,
    total: subtotal - discount + freight,
  };
}

function itemSpecs(item) {
  const specs = [];
  const dimensions = [item.width, item.height].filter(Boolean).join(" x ");

  if (item.imageCode) specs.push(`Código da imagem: ${item.imageCode}`);
  if (dimensions) specs.push(`Medida: ${dimensions} cm`);
  specs.push(`Quantidade: ${item.quantity || 0}`);

  if (item.type === "quadro") {
    specs.push(`Técnica: ${item.technique}`);
    specs.push(`Material: ${item.material}`);
    specs.push(`Vidro: ${item.glass}`);
    specs.push(`Moldura: ${item.frame}${item.frameColor ? ` - ${item.frameColor}` : ""}`);
    if (item.infiniteEdge) specs.push("Canvas com borda infinita");
  }

  if (item.type === "espelho") {
    specs.push(`Formato: ${item.mirrorShape}`);
    specs.push(`LED: ${item.led}`);
    specs.push(`Fita de borda: ${item.edgeTape}${item.edgeTapeColor ? ` - ${item.edgeTapeColor}` : ""}`);
    if (item.mirrorFinish) specs.push(`Acabamento: ${item.mirrorFinish}`);
  }

  if (item.notes) specs.push(`Obs.: ${item.notes}`);
  return specs;
}

function renderPreview() {
  const quoteTotals = totals();
  const itemsHtml = state.items
    .map((item, index) => {
      const title = item.description || labelForType(item.type);
      const specs = itemSpecs(item).map((spec) => `<span>${escapeHtml(spec)}</span>`).join("");
      return `
        <article class="preview-item">
          <div class="preview-item-title">
            <span>${String(index + 1).padStart(2, "0")} · ${escapeHtml(title)}</span>
            <span>${escapeHtml(formatMoney(itemTotal(item)))}</span>
          </div>
          <div class="preview-specs">${specs}</div>
        </article>
      `;
    })
    .join("");

  const previewHtml = `
    <div class="preview-document">
      <div class="preview-company">
        <h3>${escapeHtml(state.company.name || "Empresa")}</h3>
        <div class="preview-specs">
          ${state.company.phone ? `<span>${escapeHtml(state.company.phone)}</span>` : ""}
          ${state.company.email ? `<span>${escapeHtml(state.company.email)}</span>` : ""}
          ${state.company.address ? `<span>${escapeHtml(state.company.address)}</span>` : ""}
        </div>
      </div>

      <div class="preview-meta">
        ${metaItem("Orçamento", state.quote.number)}
        ${metaItem("Data", formatDate(state.quote.date))}
        ${metaItem("Validade", formatDate(state.quote.validUntil))}
        ${metaItem("Vendedor", state.quote.seller)}
      </div>

      <div class="preview-client">
        <span class="preview-label">Cliente</span>
        <span class="preview-value">${escapeHtml(state.customer.name || "Não informado")}</span>
        <div class="preview-specs">
          ${state.customer.phone ? `<span>${escapeHtml(state.customer.phone)}</span>` : ""}
          ${state.customer.email ? `<span>${escapeHtml(state.customer.email)}</span>` : ""}
          ${state.customer.address ? `<span>${escapeHtml(state.customer.address)}</span>` : ""}
        </div>
      </div>

      <div class="preview-items">${itemsHtml}</div>

      <div class="preview-totals">
        ${totalRow("Subtotal", quoteTotals.subtotal)}
        ${totalRow("Desconto", -quoteTotals.discount)}
        ${totalRow("Frete", quoteTotals.freight)}
        <div class="total-row final">
          <span>Total</span>
          <span>${escapeHtml(formatMoney(quoteTotals.total))}</span>
        </div>
      </div>

      <div class="preview-notes">
        ${state.quote.payment ? metaBlock("Pagamento", state.quote.payment) : ""}
        ${state.quote.delivery ? metaBlock("Prazo", state.quote.delivery) : ""}
        ${state.quote.notes ? metaBlock("Observações", state.quote.notes) : ""}
      </div>
    </div>
  `;

  quotePreview.innerHTML = previewHtml;
  printArea.innerHTML = previewHtml;
}

function metaItem(label, value) {
  return `
    <div>
      <span class="preview-label">${escapeHtml(label)}</span>
      <span class="preview-value">${escapeHtml(value || "-")}</span>
    </div>
  `;
}

function metaBlock(label, value) {
  return `
    <div>
      <span class="preview-label">${escapeHtml(label)}</span>
      <span class="preview-value">${escapeHtml(value)}</span>
    </div>
  `;
}

function totalRow(label, value) {
  return `
    <div class="total-row">
      <span>${escapeHtml(label)}</span>
      <span>${escapeHtml(formatMoney(value))}</span>
    </div>
  `;
}

function updateFieldFromEvent(event) {
  const field = event.target.closest("[data-path]");
  if (!field) return;
  setPathValue(field.dataset.path, field.value);
  saveState();
  renderPreview();
}

function updateItemFromEvent(event) {
  const field = event.target.closest("[data-field]");
  const card = event.target.closest(".item-card");
  if (!field || !card) return;

  const item = state.items.find((current) => current.id === card.dataset.itemId);
  if (!item) return;

  item[field.dataset.field] = field.type === "checkbox" ? field.checked : field.value;
  saveState();

  if (field.dataset.field === "type" || field.dataset.field === "description") {
    renderItems();
    return;
  }

  renderPreview();
}

document.addEventListener("input", updateFieldFromEvent);
itemsList.addEventListener("input", updateItemFromEvent);
itemsList.addEventListener("change", updateItemFromEvent);

document.querySelector("#addItem").addEventListener("click", () => {
  state.items.push(createItem());
  saveState();
  renderItems();
});

itemsList.addEventListener("click", (event) => {
  const button = event.target.closest('[data-action="remove-item"]');
  if (!button) return;
  const card = button.closest(".item-card");
  state.items = state.items.filter((item) => item.id !== card.dataset.itemId);
  if (state.items.length === 0) {
    state.items.push(createItem());
  }
  saveState();
  renderItems();
});

document.querySelector("#resetQuote").addEventListener("click", () => {
  if (!confirm("Limpar todos os dados deste orçamento?")) return;
  state = createDefaultState();
  saveState();
  fillStaticFields();
  renderItems();
});

document.querySelector("#printQuote").addEventListener("click", () => {
  renderPreview();
  printArea.setAttribute("aria-hidden", "false");
  window.print();
});

window.addEventListener("afterprint", () => {
  printArea.setAttribute("aria-hidden", "true");
});

fillStaticFields();
renderItems();
