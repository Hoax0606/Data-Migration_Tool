# Pipeline: Markdown -> DOCX (Pandoc native docx writer)

$ErrorActionPreference = 'Stop'

$DocsDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$Pandoc  = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\JohnMacFarlane.Pandoc_Microsoft.Winget.Source_8wekyb3d8bbwe\pandoc-3.9.0.2\pandoc.exe"
$Reference = Join-Path $DocsDir 'reference.docx'

if (-not (Test-Path $Pandoc)) { throw "Pandoc not found at $Pandoc" }

# 사내 워드 템플릿(reference.docx)이 있으면 그 스타일을 입힘.
$RefArgs = @()
if (Test-Path $Reference) {
    Write-Host "Using reference template: $Reference" -ForegroundColor DarkGray
    $RefArgs = @('--reference-doc', $Reference)
} else {
    Write-Host "Using Pandoc default Word styles." -ForegroundColor DarkGray
}

function Convert-MdToDocx {
    param(
        [string]$MarkdownPath,
        [string]$DocxPath
    )

    Write-Host ""
    Write-Host "Pandoc -> DOCX : $MarkdownPath" -ForegroundColor Cyan

    # Title / subtitle / author / date 는 .md YAML front matter 에서 읽음.
    $args = @(
        '--from', 'gfm+yaml_metadata_block',
        '--to',   'docx',
        '--toc', '--toc-depth=3',
        '--output', $DocxPath
    ) + $RefArgs + @($MarkdownPath)

    & $Pandoc @args
    if ($LASTEXITCODE -ne 0) { throw "Pandoc failed for $MarkdownPath" }
}

Convert-MdToDocx `
    -MarkdownPath (Join-Path $DocsDir 'USER_MANUAL.md') `
    -DocxPath     (Join-Path $DocsDir 'USER_MANUAL.docx')

Convert-MdToDocx `
    -MarkdownPath (Join-Path $DocsDir 'DEVELOPER_MANUAL.md') `
    -DocxPath     (Join-Path $DocsDir 'DEVELOPER_MANUAL.docx')

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Get-ChildItem (Join-Path $DocsDir '*.docx') | Format-Table Name, @{n='Size (KB)';e={[math]::Round($_.Length/1KB,1)}}, LastWriteTime -AutoSize
