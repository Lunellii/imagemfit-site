param(
  [Parameter(Mandatory = $true)]
  [string]$Token,

  [Parameter(Mandatory = $true)]
  [string]$RepoName,

  [string]$Description = "ImagemFit website",

  [ValidateSet("public", "private")]
  [string]$Visibility = "public",

  [string]$Branch = "main",

  [switch]$SkipCreate
)

$ErrorActionPreference = "Stop"

function New-GithubHeaders {
  param([string]$AuthToken)
  return @{
    Authorization = "Bearer $AuthToken"
    Accept = "application/vnd.github+json"
    "User-Agent" = "imagemfit-publisher"
    "X-GitHub-Api-Version" = "2022-11-28"
  }
}

function Escape-RepoPath {
  param([string]$PathValue)
  $segments = $PathValue -split "/" | Where-Object { $_ -ne "" }
  return ($segments | ForEach-Object { [System.Uri]::EscapeDataString($_) }) -join "/"
}

$root = (Resolve-Path ".").Path
$headers = New-GithubHeaders -AuthToken $Token
$isPrivate = $Visibility -eq "private"

Write-Host "Validando token..."
$me = Invoke-RestMethod -Method Get -Uri "https://api.github.com/user" -Headers $headers
$owner = $me.login
Write-Host "Autenticado como: $owner"

$repoUrl = "https://api.github.com/repos/$owner/$RepoName"
$repoWebUrl = "https://github.com/$owner/$RepoName"

if (-not $SkipCreate) {
  Write-Host "Criando repositório (ou reutilizando se já existir)..."
  $repoPayload = @{
    name = $RepoName
    description = $Description
    private = $isPrivate
    auto_init = $false
  }

  try {
    Invoke-RestMethod -Method Post -Uri "https://api.github.com/user/repos" -Headers $headers -Body ($repoPayload | ConvertTo-Json -Depth 5)
    Write-Host "Repositório criado: $repoWebUrl"
  } catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 422) {
      Write-Host "Repositório já existe, continuando: $repoWebUrl"
    } else {
      throw
    }
  }
} else {
  Write-Host "SkipCreate ativo: validando acesso ao repositório existente..."
  Invoke-RestMethod -Method Get -Uri $repoUrl -Headers $headers | Out-Null
  Write-Host "Acesso confirmado: $repoWebUrl"
}

$excludeDirPatterns = @(
  "\\.git\\",
  "\\.tools\\",
  "\\node_modules\\",
  "\\dist\\",
  "\\separacao_abs\\"
)

$excludeFileNames = @(
  ".env",
  ".env.example",
  ".env.server",
  ".env.server.example",
  ".codex-dev.err",
  ".codex-dev.log",
  ".codex-secure.err",
  ".codex-secure.log",
  "catalogo_arquivos.txt",
  "catalogo_pastas.txt"
)

$allFiles = Get-ChildItem -Path $root -Recurse -File
$publishFiles = $allFiles | Where-Object {
  $full = $_.FullName
  $name = $_.Name
  $excludeByDir = $false
  foreach ($pattern in $excludeDirPatterns) {
    if ($full -match $pattern) {
      $excludeByDir = $true
      break
    }
  }
  if ($excludeByDir) { return $false }
  if ($excludeFileNames -contains $name) { return $false }
  return $true
}

Write-Host ("Arquivos para publicar: " + $publishFiles.Count)

$uploaded = 0
$skipped = @()

foreach ($file in $publishFiles) {
  $relativePath = $file.FullName.Substring($root.Length).TrimStart("\").Replace("\", "/")
  $escapedPath = Escape-RepoPath -PathValue $relativePath
  $targetUrl = "$repoUrl/contents/$escapedPath"

  try {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    if ($bytes.Length -gt 50000000) {
      $skipped += $relativePath
      continue
    }
    $base64 = [Convert]::ToBase64String($bytes)
    $body = @{
      message = "chore: add $relativePath"
      content = $base64
      branch = $Branch
      committer = @{
        name = $owner
        email = "$owner@users.noreply.github.com"
      }
    }

    try {
      $existing = Invoke-RestMethod -Method Get -Uri "${targetUrl}?ref=$([System.Uri]::EscapeDataString($Branch))" -Headers $headers
      if ($existing.sha) {
        $body.sha = $existing.sha
      }
    } catch {
      $status = $_.Exception.Response.StatusCode.value__
      if ($status -ne 404) {
        throw
      }
    }

    Invoke-RestMethod -Method Put -Uri $targetUrl -Headers $headers -Body ($body | ConvertTo-Json -Depth 8) | Out-Null
    $uploaded++
    if (($uploaded % 20) -eq 0) {
      Write-Host "Enviados: $uploaded"
    }
  } catch {
    $detail = ""
    try {
      $detail = $_.ErrorDetails.Message
    } catch {}
    if ([string]::IsNullOrWhiteSpace($detail)) {
      $detail = $_.Exception.Message
    }
    $skipped += "$relativePath :: $detail"
  }
}

Write-Host "Publicação concluída."
Write-Host "Repo: $repoWebUrl"
Write-Host "Enviados: $uploaded"
if ($skipped.Count -gt 0) {
  Write-Host ("Pulados: " + $skipped.Count)
  $preview = $skipped | Select-Object -First 10
  foreach ($line in $preview) {
    Write-Host (" - " + $line)
  }
}
