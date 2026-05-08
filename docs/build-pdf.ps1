# Pipeline: Markdown -> HTML (Pandoc) -> PDF (Edge headless)

$ErrorActionPreference = 'Stop'

$DocsDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$Pandoc  = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\JohnMacFarlane.Pandoc_Microsoft.Winget.Source_8wekyb3d8bbwe\pandoc-3.9.0.2\pandoc.exe"
$Edge    = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not (Test-Path $Pandoc)) { throw "Pandoc not found at $Pandoc" }
if (-not $Edge)               { throw "Microsoft Edge not found" }

$Css = @'
:root {
  --ink:       #14171b;   /* 본문 검정 */
  --ink-2:     #2c333d;   /* 보조 텍스트 */
  --ink-3:     #5b6573;   /* 캡션 */
  --ink-4:     #9099a6;   /* 라벨 */
  --line:      #d8dde4;
  --line-soft: #ebeef2;
  --paper:     #ffffff;
  --paper-2:   #f7f9fb;
  --mint:      #0c9e6a;   /* 유일한 강조 색 */
  --mint-soft: #d6efe2;   /* 옅은 민트 */
  --code-bg:   #1c1f23;   /* 코드 박스 — 모노톤 다크 */
  --code-fg:   #e6e9ee;
}

@page {
  size: A4;
  margin: 24mm 20mm 22mm 20mm;
  @bottom-center {
    content: counter(page);
    font-family: 'Consolas', monospace;
    font-size: 9pt;
    color: var(--ink-3);
  }
}
@page :first {
  margin: 0;
  @bottom-center { content: none; }
}

* { box-sizing: border-box; }
html, body {
  font-family: 'Malgun Gothic', 'Segoe UI', sans-serif;
  font-size: 10.5pt;
  line-height: 1.6;
  color: var(--ink);
  background: var(--paper);
  margin: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Cover (first page) — 흰 배경 + 민트 액센트 ─────────────── */
header#title-block-header {
  background: var(--paper);
  color: var(--ink);
  padding: 110mm 22mm 22mm;
  height: 297mm;
  position: relative;
  page-break-after: always;
  border-top: 12pt solid var(--mint);
}
header#title-block-header::before {
  content: '';
  position: absolute;
  left: 22mm; top: 38mm;
  width: 38mm; height: 4pt;
  background: var(--mint);
}
header#title-block-header h1.title {
  font-size: 32pt;
  font-weight: 700;
  letter-spacing: -0.5pt;
  margin: 0 0 14pt;
  color: var(--ink);
  border: none;
}
header#title-block-header p.subtitle {
  font-size: 12pt;
  color: var(--mint);
  margin: 0 0 28pt;
  font-family: 'Consolas', monospace;
  letter-spacing: 0.5pt;
}
header#title-block-header p.author,
header#title-block-header p.date {
  font-size: 10pt;
  color: var(--ink-3);
  margin: 0;
  font-family: 'Consolas', monospace;
}
header#title-block-header::after {
  content: 'ModernizeProData · KS Info System';
  position: absolute;
  left: 22mm; bottom: 22mm;
  font-size: 8.5pt;
  letter-spacing: 1.4pt;
  color: var(--ink-4);
  font-family: 'Consolas', monospace;
  text-transform: uppercase;
}

/* ── Table of contents ────────────────────────────────────────── */
nav#TOC {
  page-break-after: always;
  padding: 22mm 24mm 0;
}
nav#TOC::before {
  content: 'CONTENTS';
  display: block;
  font-size: 9pt;
  letter-spacing: 3pt;
  color: var(--mint);
  font-weight: 600;
  margin-bottom: 8pt;
  padding-bottom: 6pt;
  border-bottom: 2pt solid var(--mint);
}
nav#TOC h1, nav#TOC h2 { display: none; }
nav#TOC ul { list-style: none; padding-left: 0; margin: 0; }
nav#TOC > ul > li {
  margin: 7pt 0 5pt;
  font-size: 11pt;
  font-weight: 600;
  color: var(--ink);
  border-bottom: 1px dotted var(--line);
  padding-bottom: 4pt;
}
nav#TOC ul ul { padding-left: 14pt; margin: 3pt 0 5pt; border-bottom: none; }
nav#TOC ul ul li {
  font-size: 9.8pt;
  font-weight: 400;
  color: var(--ink-2);
  margin: 1.5pt 0;
  border-bottom: none;
  padding-bottom: 0;
}
nav#TOC ul ul ul li { font-size: 9.4pt; color: var(--ink-3); }
nav#TOC a { color: inherit; text-decoration: none; }

/* ── Body padding ─────────────────────────────────────────────── */
body > *:not(header#title-block-header):not(nav#TOC) {
  padding-left: 22mm;
  padding-right: 22mm;
}

/* ── Headings — 검정 텍스트 + 민트 액센트 ────────────────────── */
h1, h2, h3, h4 {
  font-weight: 600;
  color: var(--ink);
  line-height: 1.3;
}
h1 {
  font-size: 21pt;
  margin: 30pt 0 14pt;
  padding-top: 8pt;
  page-break-before: always;
}
h1::before {
  content: '';
  display: block;
  width: 30pt;
  height: 3pt;
  background: var(--mint);
  margin-bottom: 12pt;
}
h2 {
  font-size: 14pt;
  margin: 22pt 0 8pt;
  padding-bottom: 4pt;
  border-bottom: 1px solid var(--line);
  page-break-after: avoid;
}
h3 {
  font-size: 11.5pt;
  margin: 16pt 0 6pt;
  color: var(--ink);
  page-break-after: avoid;
}
h3::before {
  content: '';
  display: inline-block;
  width: 8pt;
  height: 2pt;
  background: var(--mint);
  vertical-align: middle;
  margin-right: 6pt;
  margin-bottom: 2pt;
}
h4 {
  font-size: 10.5pt;
  margin: 12pt 0 4pt;
  color: var(--ink-2);
  font-weight: 600;
  page-break-after: avoid;
}

p { margin: 0 0 8pt; }
ul, ol { margin: 0 0 8pt; padding-left: 18pt; }
li { margin-bottom: 3pt; }
li > p { margin: 0 0 4pt; }
strong { color: var(--ink); font-weight: 600; }
em { color: var(--mint); font-style: italic; }
a { color: var(--mint); text-decoration: none; border-bottom: 1px dotted var(--line); }

code {
  font-family: 'Consolas', 'Cascadia Mono', monospace;
  font-size: 9.5pt;
  background: var(--paper-2);
  padding: 1pt 5pt;
  border: 1px solid var(--line-soft);
  border-radius: 3pt;
  color: var(--ink-2);
}
pre {
  background: var(--code-bg);
  color: var(--code-fg);
  padding: 11pt 14pt;
  border-radius: 4pt;
  overflow-x: auto;
  font-size: 8.8pt;
  line-height: 1.55;
  margin: 10pt 0;
  page-break-inside: avoid;
  border-left: 3pt solid var(--mint);
}
pre code { background: none; border: none; padding: 0; color: inherit; font-size: inherit; }

table {
  border-collapse: collapse;
  width: 100%;
  margin: 10pt 0;
  font-size: 9.5pt;
  page-break-inside: avoid;
  border-top: 1.4pt solid var(--mint);
  border-bottom: 1.4pt solid var(--mint);
}
thead { background: var(--mint-soft); }
th {
  font-weight: 600;
  color: var(--ink);
  text-align: left;
  padding: 6pt 9pt;
  border-bottom: 1pt solid var(--mint);
  letter-spacing: 0.2pt;
}
td {
  padding: 5pt 9pt;
  vertical-align: top;
  border-bottom: 1px solid var(--line-soft);
}
tr:last-child td { border-bottom: none; }
tr:nth-child(even) td { background: #fbfcfd; }

blockquote {
  border-left: 3px solid var(--mint);
  padding: 8pt 14pt;
  margin: 10pt 0;
  background: var(--paper-2);
  color: var(--ink-2);
  border-radius: 0 3pt 3pt 0;
}
hr {
  border: none;
  border-top: 1px solid var(--line);
  margin: 18pt 0;
}
'@

$CssPath = Join-Path $DocsDir 'manual.css'
Set-Content -Path $CssPath -Value $Css -Encoding utf8

function Convert-MdToPdf {
    param(
        [string]$MarkdownPath,
        [string]$PdfPath
    )
    $stem    = [IO.Path]::GetFileNameWithoutExtension($MarkdownPath)
    $htmlPath = Join-Path $DocsDir "$stem.html"

    Write-Host ""
    Write-Host "Pandoc -> HTML : $MarkdownPath" -ForegroundColor Cyan

    # Title / subtitle / author / date / lang는 .md 파일 상단 YAML front matter
    # 에서 직접 읽음. 한국어를 PowerShell 인자로 넘기면 cp949 로 깨지므로 절대
    # --metadata 인자에 한국어를 넣지 말 것.
    & $Pandoc `
        --from gfm+yaml_metadata_block `
        --to html5 `
        --standalone `
        --toc --toc-depth=3 `
        --css manual.css `
        --output $htmlPath `
        $MarkdownPath
    if ($LASTEXITCODE -ne 0) { throw "Pandoc failed for $MarkdownPath" }

    Write-Host "Edge headless -> PDF : $PdfPath" -ForegroundColor Cyan

    $fileUri = "file:///" + ($htmlPath -replace '\\','/' -replace ' ','%20')
    $tmpProfile = Join-Path $env:TEMP "mpd-pdf-$([Guid]::NewGuid())"

    & $Edge `
        --headless=new `
        --disable-gpu `
        --no-pdf-header-footer `
        --user-data-dir="$tmpProfile" `
        --print-to-pdf="$PdfPath" `
        $fileUri | Out-Null

    if (Test-Path $tmpProfile) { Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $tmpProfile }
    if (-not (Test-Path $PdfPath)) { throw "Edge did not produce $PdfPath" }
    Remove-Item -Force $htmlPath
}

Convert-MdToPdf `
    -MarkdownPath (Join-Path $DocsDir 'USER_MANUAL.md') `
    -PdfPath      (Join-Path $DocsDir 'USER_MANUAL.pdf')

Convert-MdToPdf `
    -MarkdownPath (Join-Path $DocsDir 'DEVELOPER_MANUAL.md') `
    -PdfPath      (Join-Path $DocsDir 'DEVELOPER_MANUAL.pdf')

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Get-ChildItem (Join-Path $DocsDir '*.pdf') | Format-Table Name, @{n='Size (KB)';e={[math]::Round($_.Length/1KB,1)}}, LastWriteTime -AutoSize
