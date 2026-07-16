import { useMemo, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localClient } from "@/api/localClient";
import { useToast } from "@/components/ui/use-toast";

function extractCode(filename) {
  return filename.replace(/\.[^/.]+$/, "");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

const PREFIX_ALIASES_BY_CATEGORY = {
  "ABSTRATO ARQUITETONICO": ["ARQ", "AAR", "ABS"],
  "ABSTRATO FLUIDO E MARMORE": ["AFM", "FLU", "ABS"],
  "ABSTRATO GEOMETRICO": ["AGT", "AGE", "GEO", "ABS"],
  "ABSTRATO MINIMALISTA": ["AMN", "AMI", "MIN", "ABS"],
  "ABSTRATO ESTILO PINTURA": ["AEP", "APA"],
  ANIMAIS: ["ANI"],
  ARVORES: ["ARV"],
  COZINHA: ["COZ"],
  DIVERSOS: ["DIV"],
  "DIVERSOS.": ["DIV"],
  ESPIRITUALIDADE: ["ESD", "ESPIR", "ESPI", "ESPU"],
  ESPELHOS: ["ESP"],
  "ESTILO 3D": ["E3D", "ABR"],
  "FLORES E FOLHAS": ["FLO", "FOL"],
  FRASES: ["FRA"],
  INFANTIL: ["INF"],
  "MAR E PRAIA": ["MAR"],
  NATUREZA: ["NAT"],
  "PINTURAS MANUAIS": ["QD", "PIT", "PIN", "PMA"],
  PONTE: ["PON"],
  PONTES: ["PON"],
  "SALA DE JOGOS": ["SAL", "JOG"],
  TRIDIMENSIONAL: ["TRID", "TRI"],
  TRIDMENSIONAL: ["TRID", "TRI"],
  URBANO: ["URB"],
  VIDA: ["VID"]
};

function canonicalizeCodeForCategory(code, category) {
  const normalizedCategory = normalizeText(category?.name);
  const current = String(code || "").trim().toUpperCase();
  if (normalizedCategory === "ABSTRATO ESTILO PINTURA") {
    return current.replace(/^(APA|ABS)_/, "AEP_");
  }
  if (normalizedCategory === "ESTILO 3D") {
    return current.replace(/^ABR_/, "E3D_");
  }
  return current;
}

const CONNECTOR_WORDS = new Set(["E", "DE", "DA", "DO", "DAS", "DOS"]);

function isImageFile(file) {
  if (!file) return false;
  if (typeof file.type === "string" && file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name || "");
}

function fileKey(file) {
  return [file?.name || "", file?.size || 0, file?.lastModified || 0].join("::");
}

function buildPrefixIndex(categories) {
  const index = new Map();

  const addPrefix = (prefix, category) => {
    const normalizedPrefix = normalizeText(prefix).replace(/[^A-Z0-9]/g, "");
    if (!normalizedPrefix) return;
    if (!index.has(normalizedPrefix)) {
      index.set(normalizedPrefix, []);
    }
    const current = index.get(normalizedPrefix);
    if (!current.some((item) => item.id === category.id)) {
      current.push(category);
    }
  };

  for (const category of categories) {
    const normalizedName = normalizeText(category.name);
    const words = normalizedName.split(/\s+/).filter(Boolean);
    const strongWords = words.filter((word) => !CONNECTOR_WORDS.has(word));
    const baseWords = strongWords.length ? strongWords : words;
    const firstWord = baseWords[0] || "";
    const acronym = baseWords.map((word) => word[0] || "").join("");
    const aliases = PREFIX_ALIASES_BY_CATEGORY[normalizedName] || [];

    // If this category has explicit prefix aliases, use only those aliases.
    // This avoids collisions like ESP (Espelhos vs Espiritualidade).
    if (aliases.length > 0) {
      aliases.forEach((alias) => addPrefix(alias, category));
      continue;
    }

    addPrefix(firstWord.slice(0, 3), category);
    if (acronym.length >= 3) {
      addPrefix(acronym.slice(0, 3), category);
    }
  }

  return index;
}

function extractFilenamePrefix(filename) {
  const code = extractCode(filename);
  const normalized = normalizeText(code);
  const token = normalized.split(/[^A-Z0-9]+/)[0] || normalized;
  return (token.match(/^[A-Z][A-Z0-9]*/) || [""])[0];
}

function resolveCategoryByFileName(filename, prefixIndex, fallbackCategoryId) {
  const rawPrefix = extractFilenamePrefix(filename);
  if (!rawPrefix) {
    return { category_id: "", prefix: "", reason: "SEM_PREFIXO", matches: [] };
  }

  const candidates = [rawPrefix];
  if (rawPrefix.length > 3) {
    candidates.push(rawPrefix.slice(0, 3));
  }

  for (const prefix of candidates) {
    const matches = prefixIndex.get(prefix) || [];

    if (matches.length === 1) {
      return { category_id: matches[0].id, prefix, reason: "OK", matches };
    }

    if (matches.length > 1) {
      const fallbackMatch = matches.find((item) => item.id === fallbackCategoryId);
      if (fallbackMatch) {
        return { category_id: fallbackMatch.id, prefix, reason: "OK_FALLBACK", matches };
      }
      return { category_id: "", prefix, reason: "AMBIGUO", matches };
    }
  }

  return { category_id: "", prefix: candidates[0], reason: "NAO_ENCONTRADO", matches: [] };
}

function reasonLabel(reason) {
  if (reason === "AMBIGUO") return "prefixo ambíguo";
  if (reason === "NAO_ENCONTRADO") return "prefixo não mapeado";
  if (reason === "SEM_PREFIXO") return "sem prefixo";
  return "não classificado";
}

function dedupeFiles(items) {
  const seen = new Set();
  return items.filter((file) => {
    const key = fileKey(file);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function ImageUploader({ categories, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [assignMode, setAssignMode] = useState("manual");
  const [uploading, setUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [lastAssignments, setLastAssignments] = useState([]);
  const { toast } = useToast();

  const categoryNameById = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const categoryById = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {});
  }, [categories]);

  const prefixIndex = useMemo(() => buildPrefixIndex(categories), [categories]);

  const fileAssignments = useMemo(() => {
    if (assignMode !== "by_name") return [];
    return files.map((file) => {
      const resolved = resolveCategoryByFileName(file.name, prefixIndex, categoryId);
      return {
        file,
        code: canonicalizeCodeForCategory(extractCode(file.name), categoryById[resolved.category_id]),
        ...resolved
      };
    });
  }, [assignMode, files, prefixIndex, categoryId, categoryById]);

  const addFiles = (incoming) => {
    const incomingFiles = Array.from(incoming || []).filter(isImageFile);
    if (!incomingFiles.length) {
      toast({ title: "Nenhuma imagem válida encontrada.", variant: "destructive" });
      return;
    }

    setLastAssignments([]);
    setFiles((current) => {
      const seen = new Set(current.map(fileKey));
      const deduped = incomingFiles.filter((file) => {
        const key = fileKey(file);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return [...current, ...deduped];
    });
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!uploading) setIsDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    if (uploading) return;
    addFiles(event.dataTransfer?.files);
  };

  const handleUpload = async () => {
    if (!files.length) {
      toast({ title: "Selecione pelo menos uma imagem.", variant: "destructive" });
      return;
    }

    if (assignMode === "manual" && !categoryId) {
      toast({ title: "Selecione a categoria para upload manual.", variant: "destructive" });
      return;
    }

    const unresolvedAssignments = assignMode === "by_name" ? fileAssignments.filter((item) => !item.category_id) : [];
    const uploadAssignments =
      assignMode === "manual"
        ? files.map((file) => ({
            file,
            code: canonicalizeCodeForCategory(extractCode(file.name), categoryById[categoryId]),
            category_id: categoryId,
            prefix: ""
          }))
        : fileAssignments.filter((item) => item.category_id);

    if (!uploadAssignments.length) {
      toast({
        title: "Nenhuma imagem com categoria identificada",
        description: "Confira o prefixo no nome do arquivo. Exemplo: ANI_0001, NAT_0001, VID_0001.",
        variant: "destructive"
      });
      return;
    }

    if (unresolvedAssignments.length > 0) {
      toast({
        title: `${unresolvedAssignments.length} arquivo(s) sem categoria`,
        description: "Somente os arquivos com prefixo mapeado serão enviados neste lote.",
        variant: "destructive"
      });
    }

    let uploadedCount = 0;
    const completedAssignments = [];

    try {
      setUploading(true);
      setProgress({ done: 0, total: uploadAssignments.length });
      setLastAssignments([]);

      for (let i = 0; i < uploadAssignments.length; i++) {
        const assignment = uploadAssignments[i];
        const file = assignment.file;
        const code = assignment.code;
        const uploadResult = await localClient.integrations.Core.UploadFile({ file, code });
        const fileUrl = uploadResult?.file_url;
        const imageHash = uploadResult?.image_hash;

        await localClient.entities.PortfolioImage.create({
          title: code,
          code,
          image_url: fileUrl,
          image_hash: imageHash,
          category_id: assignment.category_id,
          is_new: true
        });

        completedAssignments.push({
          file_name: file.name,
          code,
          category_name: categoryNameById[assignment.category_id] || "Categoria",
          mode: assignMode === "manual" ? "manual" : "nome"
        });

        uploadedCount = i + 1;
        setProgress({ done: uploadedCount, total: uploadAssignments.length });
      }

      setLastAssignments(completedAssignments);
      toast({ title: `${uploadAssignments.length} imagem(ns) adicionada(s) com sucesso!` });

      if (assignMode === "manual") {
        setFiles([]);
        setCategoryId("");
      } else {
        setFiles(unresolvedAssignments.map((item) => item.file));
      }

      setProgress({ done: 0, total: 0 });
      onUploaded();
    } catch (error) {
      const pending = uploadAssignments.slice(uploadedCount).map((item) => item.file);
      const nextQueue = assignMode === "manual" ? pending : [...unresolvedAssignments.map((item) => item.file), ...pending];
      setFiles(dedupeFiles(nextQueue));

      if (uploadedCount > 0) {
        setLastAssignments(completedAssignments);
        onUploaded();
      }

      const isUnauthorized = error?.status === 401 || error?.status === 403 || error?.message === "UNAUTHORIZED" || error?.message === "ADMIN_DISABLED_PUBLIC";

      if (isUnauthorized) {
        toast({
          title: "Sessão expirada",
          description: "Entre no painel novamente e tente enviar as imagens.",
          variant: "destructive"
        });
      } else if (error?.message === "STORAGE_QUOTA_EXCEEDED") {
        toast({
          title: "Espaço do navegador lotado",
          description: "Exclua algumas imagens no painel e tente novamente, ou envie em lotes menores.",
          variant: "destructive"
        });
      } else if (error?.message === "DUPLICATE_IMAGE_CODE") {
        const duplicateCode = String(error?.duplicate_code || "").trim();
        toast({
          title: "Código já cadastrado",
          description: duplicateCode ? `Já existe uma imagem com o código ${duplicateCode}.` : "Já existe imagem com este código.",
          variant: "destructive"
        });
      } else if (error?.message === "INVALID_IMAGE_CODE") {
        toast({
          title: "Código inválido",
          description: "Não foi possível extrair um código válido do nome do arquivo.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro durante o upload das imagens",
          description: uploadedCount > 0 ? `${uploadedCount} imagem(ns) foram enviadas antes do erro.` : "Tente novamente em alguns instantes.",
          variant: "destructive"
        });
      }
    } finally {
      setUploading(false);
      setIsDragActive(false);
    }
  };

  const hasFallback = categoryId && categoryId !== "__none__";

  return (
    <div className="border border-border p-8 space-y-6 max-w-2xl">
      <h3 className="font-heading text-xl font-semibold text-white">Adicionar imagens em massa</h3>

      <div className="grid grid-cols-2 border border-border bg-card">
        <button
          type="button"
          onClick={() => setAssignMode("manual")}
          className={`py-3 text-xs tracking-widest uppercase transition-colors ${
            assignMode === "manual" ? "bg-gold text-black font-semibold" : "text-white/60 hover:text-white"
          }`}
        >
          Categoria manual
        </button>
        <button
          type="button"
          onClick={() => setAssignMode("by_name")}
          className={`py-3 text-xs tracking-widest uppercase transition-colors ${
            assignMode === "by_name" ? "bg-gold text-black font-semibold" : "text-white/60 hover:text-white"
          }`}
        >
          Pelo nome
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-white/50 text-xs tracking-widest uppercase">
          {assignMode === "manual" ? "Categoria *" : "Fallback (opcional para prefixo ambíguo)"}
        </label>
        <Select
          value={assignMode === "by_name" ? (hasFallback ? categoryId : "__none__") : categoryId}
          onValueChange={(value) => {
            setCategoryId(value === "__none__" ? "" : value);
          }}
        >
          <SelectTrigger className="rounded-none bg-card border-border text-white">
            <SelectValue placeholder={assignMode === "manual" ? "Selecione uma categoria" : "Opcional: usar esta categoria quando houver empate"} />
          </SelectTrigger>
          <SelectContent>
            {assignMode === "by_name" ? <SelectItem value="__none__">Sem fallback</SelectItem> : null}
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border p-3 text-xs text-white/65 space-y-1">
        <p className="uppercase tracking-widest text-white/45">Siglas ativas para envio pelo nome</p>
        <p>
          AEP=Abstrato Estilo Pintura, AFM=Abstrato Fluido e Mármore, AGT=Abstrato Geométrico, AMN=Abstrato Minimalista, ANI=Animais, E3D=Estilo 3D,
          ARQ=Abstrato Arquitetônico, ARV=Árvores, COZ=Cozinha, DIV=Diversos, ESD=Espiritualidade, ESP=Espelhos, FLO=Flores e Folhas, FRA=Frases,
          INF=Infantil, MAR=Mar e Praia, NAT=Natureza, QD=Pinturas Manuais, PON=Pontes, SAL=Sala de Jogos, TRID=Tridimensionais, URB=Urbano, VID=Vida.
        </p>
        <p className="text-white/40">Exemplo de nome: AFM_00001.jpg, ANI_00045.png, URB_0102.webp</p>
      </div>

      <div className="space-y-2">
        <label className="text-white/50 text-xs tracking-widest uppercase">Imagens - o código é extraído automaticamente do nome do arquivo</label>
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed transition-colors p-10 text-center ${
            isDragActive ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"
          }`}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            id="img-upload"
            className="hidden"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <label htmlFor="img-upload" className="cursor-pointer flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-gold/50" />
            <span className="text-white/50 text-sm">{files.length ? `${files.length} arquivo(s) selecionado(s)` : "Clique ou arraste imagens aqui"}</span>
            <span className="text-white/30 text-xs">JPG, PNG, WEBP - múltiplos arquivos suportados</span>
          </label>
        </div>
      </div>

      {files.length > 0 ? (
        <div className="max-h-48 overflow-y-auto space-y-1.5 border border-border p-4">
          {assignMode === "manual"
            ? files.map((file, index) => (
                <div key={`${fileKey(file)}-${index}`} className="flex items-center justify-between text-xs">
                  <span className="text-white/60 truncate max-w-[60%]">{file.name}</span>
                  <span className="text-gold font-mono">-&gt; #{extractCode(file.name)}</span>
                </div>
              ))
            : fileAssignments.map((assignment, index) => {
                const categoryName = assignment.category_id ? categoryById[assignment.category_id]?.name : "";
                return (
                  <div key={`${fileKey(assignment.file)}-${index}`} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-white/60 truncate max-w-[45%]">{assignment.file.name}</span>
                    <span className="text-gold font-mono">#{assignment.code}</span>
                    {assignment.category_id ? (
                      <span className="text-white/70 truncate">{categoryName}</span>
                    ) : (
                      <span className="text-destructive/90">{reasonLabel(assignment.reason)}</span>
                    )}
                  </div>
                );
              })}
        </div>
      ) : null}

      {lastAssignments.length > 0 ? (
        <div className="border border-border p-4 space-y-2 max-h-56 overflow-y-auto">
          <p className="text-white/60 text-xs tracking-widest uppercase">Último lote enviado</p>
          {lastAssignments.map((assignment, index) => (
            <div key={`${assignment.code}-${index}`} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-white/55 truncate">{assignment.file_name}</span>
              <span className="text-gold/90 font-mono">#{assignment.code}</span>
              <span className="text-white/70 truncate">{assignment.category_name}</span>
              <span className="px-2 py-0.5 border border-white/30 text-white/60">{assignment.mode}</span>
            </div>
          ))}
        </div>
      ) : null}

      {uploading && progress.total > 0 ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/50">
            <span>Enviando...</span>
            <span>
              {progress.done}/{progress.total}
            </span>
          </div>
          <div className="h-1 bg-border rounded-full">
            <div className="h-full bg-gold rounded-full transition-all duration-300" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        </div>
      ) : null}

      <button
        onClick={handleUpload}
        disabled={uploading || !files.length || (assignMode === "manual" && !categoryId)}
        className="w-full bg-gold text-black py-4 text-xs tracking-[0.3em] uppercase font-semibold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload size={14} />}
        {uploading ? `Enviando (${progress.done}/${progress.total})...` : "Enviar imagens"}
      </button>
    </div>
  );
}
