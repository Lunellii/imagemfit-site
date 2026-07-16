param(
  [string]$SourceRoot = "\\MYCLOUDEX2ULTRA\Dados\CATALOGO FISICO\Catalogo Simulado\simulações feitas",
  [string]$OutputRoot = "public/catalog",
  [string]$SeedJsonPath = "src/data/seedCatalog.json",
  [int]$MaxPerCategory = 6,
  [int]$MaxDimension = 1600,
  [int]$JpegQuality = 82
)

$ErrorActionPreference = "Stop"

function Normalize-Text {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return "" }
  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $sb = New-Object System.Text.StringBuilder
  foreach ($char in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$sb.Append($char)
    }
  }
  return $sb.ToString().ToLowerInvariant().Trim()
}

function Slugify {
  param([string]$Value)
  $base = Normalize-Text -Value $Value
  $base = ($base -replace "[^a-z0-9]+", "-").Trim("-")
  if ([string]::IsNullOrWhiteSpace($base)) { return "categoria" }
  return $base
}

function Save-OptimizedJpeg {
  param(
    [string]$SourceFile,
    [string]$DestinationFile,
    [int]$Dimension,
    [int]$Quality
  )

  Add-Type -AssemblyName System.Drawing

  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" } | Select-Object -First 1
  if (-not $codec) {
    Copy-Item -LiteralPath $SourceFile -Destination $DestinationFile -Force
    return
  }

  $img = $null
  $bmp = $null
  $gfx = $null
  $encParams = $null

  try {
    $img = [System.Drawing.Image]::FromFile($SourceFile)
    $largest = [Math]::Max($img.Width, $img.Height)
    if ($largest -le 0) {
      Copy-Item -LiteralPath $SourceFile -Destination $DestinationFile -Force
      return
    }

    $scale = [Math]::Min(1.0, $Dimension / [double]$largest)
    $targetWidth = [Math]::Max(1, [int][Math]::Round($img.Width * $scale))
    $targetHeight = [Math]::Max(1, [int][Math]::Round($img.Height * $scale))

    $bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfx.DrawImage($img, 0, 0, $targetWidth, $targetHeight)

    $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
    $bmp.Save($DestinationFile, $codec, $encParams)
  } catch {
    Copy-Item -LiteralPath $SourceFile -Destination $DestinationFile -Force
  } finally {
    if ($encParams) { $encParams.Dispose() }
    if ($gfx) { $gfx.Dispose() }
    if ($bmp) { $bmp.Dispose() }
    if ($img) { $img.Dispose() }
  }
}

$categoryMap = @{
  "abstrato arquitetonico" = "Abstrato Arquitetonico"
  "abstrato fluido e marmore" = "Abstrato Fluido e Marmore"
  "abstrato geometrico" = "Abstrato Geometrico"
  "abstrato minimalista" = "Abstrato Minimalista"
  "abstrato pintura e aquarela" = "Abstrato Estilo Pintura"
  "abstrato estilo pintura" = "Abstrato Estilo Pintura"
  "abstrato relevo" = "Estilo 3D"
  "estilo 3d" = "Estilo 3D"
  "animais" = "Animais"
  "arvores" = "Arvores"
  "espelhos" = "Espelhos"
  "espiritualidade" = "Espiritualidade"
  "flores e folhas" = "Flores e Folhas"
  "frases" = "Frases"
  "infantil" = "Infantil"
  "mar e praia" = "Mar e Praia"
  "natureza" = "Natureza"
  "pinturas manuais" = "Pinturas Manuais"
  "pontes" = "Ponte"
  "tridmensional" = "Tridimensional"
  "urbano" = "Urbano"
  "vida" = "Vida"
  "diversos" = "Diversos"
}

$codePrefixByCategory = @{
  "Abstrato Estilo Pintura" = "AEP"
  "Estilo 3D" = "E3D"
}

$repoRoot = (Resolve-Path ".").Path
$outputAbsolute = Join-Path $repoRoot $OutputRoot
$seedAbsolute = Join-Path $repoRoot $SeedJsonPath

if (!(Test-Path $SourceRoot)) {
  throw "Source root não encontrado: $SourceRoot"
}

New-Item -ItemType Directory -Force -Path $outputAbsolute | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $seedAbsolute) | Out-Null

$extensions = @(".jpg", ".jpeg", ".png", ".webp")
$seedImages = @()

$folders = Get-ChildItem -Path $SourceRoot -Directory | Sort-Object Name
foreach ($folder in $folders) {
  $normalizedFolder = Normalize-Text -Value $folder.Name
  if (-not $categoryMap.ContainsKey($normalizedFolder)) {
    continue
  }

  $categoryName = $categoryMap[$normalizedFolder]
  $categorySlug = Slugify -Value $categoryName
  $targetDir = Join-Path $outputAbsolute $categorySlug
  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

  $files = Get-ChildItem -Path $folder.FullName -File -ErrorAction SilentlyContinue |
    Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name, Length |
    Select-Object -First $MaxPerCategory

  foreach ($file in $files) {
    $code = [IO.Path]::GetFileNameWithoutExtension($file.Name).Trim().ToUpperInvariant()
    if ([string]::IsNullOrWhiteSpace($code)) { continue }

    if ($codePrefixByCategory.ContainsKey($categoryName) -and $code -match "_(\d+)$") {
      $code = "$($codePrefixByCategory[$categoryName])_$($Matches[1])"
    }

    $destName = "$code.jpg"
    $destFile = Join-Path $targetDir $destName
    Save-OptimizedJpeg -SourceFile $file.FullName -DestinationFile $destFile -Dimension $MaxDimension -Quality $JpegQuality

    $relativeFile = $destFile.Substring($repoRoot.Length).TrimStart("\").Replace("\", "/")
    if ($relativeFile.StartsWith("public/")) {
      $publicPath = $relativeFile.Substring(7)
    } else {
      $publicPath = $relativeFile
    }

    $seedImages += [ordered]@{
      code = $code
      title = $code
      category = $categoryName
      image = $publicPath
    }
  }
}

$seedPayload = [ordered]@{
  generated_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
  source = $SourceRoot
  images = $seedImages
}

$json = $seedPayload | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText($seedAbsolute, $json, [Text.Encoding]::UTF8)

Write-Host "Importação concluída."
Write-Host "Imagens seed: $($seedImages.Count)"
Write-Host "Arquivo seed: $SeedJsonPath"
