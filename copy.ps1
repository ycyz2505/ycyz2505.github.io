# copy.ps1
# 兼容 Windows PowerShell 5.1 和 PowerShell 7+
# 排除所有 .md、.sh、.ps1 文件
# 支持交互式选择要提取的文件

$OutputFile = "output.md"
$ScriptName = Split-Path -Leaf $PSCommandPath
if (-not $ScriptName) { $ScriptName = $MyInvocation.MyCommand.Name }

$RootPath = (Get-Location).Path.TrimEnd('\', '/')

# 输出编码：UTF-8 无 BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# 排除规则
$ExcludeDirs = @('node_modules', 'venv', 'mc', 'old')
$ExcludeExts = @('.md', '.sh', '.ps1')

# 手动计算相对路径（替代 .NET Core 才有的 GetRelativePath）
function Get-RelativePath {
    param([string]$Base, [string]$Full)
    $base = $Base.TrimEnd('\', '/')
    if ($Full.StartsWith($base, [System.StringComparison]::OrdinalIgnoreCase)) {
        $rel = $Full.Substring($base.Length)
        return $rel.TrimStart('\', '/')
    }
    return $Full
}

# 判断是否为二进制文件（前 1024 字节里是否有 0x00）
function Test-IsBinaryFile {
    param([string]$Path)
    try {
        $stream = [System.IO.File]::OpenRead($Path)
        try {
            $buf = New-Object byte[] 1024
            $n = $stream.Read($buf, 0, $buf.Length)
            for ($i = 0; $i -lt $n; $i++) {
                if ($buf[$i] -eq 0) { return $true }
            }
            return $false
        }
        finally { $stream.Close() }
    }
    catch { return $true }
}

# ---------- 1. 收集候选文件 ----------
$candidates = Get-ChildItem -Path $RootPath -Recurse -File -Force | Where-Object {

    # 排除指定扩展名
    if ($ExcludeExts -contains $_.Extension.ToLower()) { return $false }

    $rel   = Get-RelativePath -Base $RootPath -Full $_.FullName
    $parts = $rel -split '[\\/]'

    # 排除隐藏文件 / 目录
    foreach ($p in $parts) {
        if ($p.StartsWith('.')) { return $false }
    }
    # 排除指定目录
    foreach ($d in $ExcludeDirs) {
        if ($parts -contains $d) { return $false }
    }
    return $true
} | Sort-Object FullName | Where-Object {
    # 顺带过滤二进制文件
    -not (Test-IsBinaryFile $_.FullName)
}

if ($candidates.Count -eq 0) {
    Write-Host "没有找到可提取的文件。" -ForegroundColor Yellow
    exit
}

# ---------- 2. 列出文件让用户选择 ----------
Write-Host ""
Write-Host "可提取的文件列表：" -ForegroundColor Cyan
Write-Host ("-" * 60)

$indexed = @()
$i = 1
foreach ($f in $candidates) {
    $rel = (Get-RelativePath -Base $RootPath -Full $f.FullName) -replace '\\', '/'
    $indexed += [PSCustomObject]@{ Index = $i; Path = $rel; File = $f }
    Write-Host ("[{0,3}] {1}" -f $i, $rel)
    $i++
}

Write-Host ("-" * 60)
Write-Host ""
Write-Host "请输入要提取的编号，支持以下格式：" -ForegroundColor Cyan
Write-Host "  1,3,5          多个编号，用逗号分隔"
Write-Host "  2-6            区间"
Write-Host "  1,3-5,8        混合"
Write-Host "  all / a        全部提取"
Write-Host "  回车            全部提取（默认）"
Write-Host "  none / n       取消"
Write-Host ""

$input = Read-Host "你的选择"

# ---------- 3. 解析用户输入 ----------
$selected = @()

if ([string]::IsNullOrWhiteSpace($input) -or $input -match '^(all|a)$') {
    $selected = $indexed
}
elseif ($input -match '^(none|n)$') {
    Write-Host "已取消。" -ForegroundColor Yellow
    exit
}
else {
    $pickedIndices = New-Object System.Collections.Generic.HashSet[int]
    $tokens = $input -split '[,\s]+' | Where-Object { $_ -ne '' }

    foreach ($tok in $tokens) {
        if ($tok -match '^(\d+)-(\d+)$') {
            $from = [int]$Matches[1]
            $to   = [int]$Matches[2]
            if ($from -gt $to) { $tmp = $from; $from = $to; $to = $tmp }
            for ($k = $from; $k -le $to; $k++) { [void]$pickedIndices.Add($k) }
        }
        elseif ($tok -match '^\d+$') {
            [void]$pickedIndices.Add([int]$tok)
        }
        else {
            Write-Host "无法识别的输入：$tok" -ForegroundColor Red
            exit
        }
    }

    $selected = $indexed | Where-Object { $pickedIndices.Contains($_.Index) }

    if ($selected.Count -eq 0) {
        Write-Host "没有选中任何有效文件。" -ForegroundColor Yellow
        exit
    }
}

Write-Host ""
Write-Host ("已选择 {0} 个文件，开始提取..." -f $selected.Count) -ForegroundColor Green

# ---------- 4. 写入输出文件 ----------
[System.IO.File]::WriteAllText((Join-Path $RootPath $OutputFile), "", $utf8NoBom)

$count = 1
$sb = New-Object System.Text.StringBuilder

foreach ($item in $selected) {
    $file    = $item.File
    $relPath = $item.Path

    # 后缀
    $ext = ''
    $dot = $file.Name.LastIndexOf('.')
    if ($dot -gt 0) { $ext = $file.Name.Substring($dot + 1) }
    if ($ext -eq 'txt') { $ext = '' }

    # 读取内容
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
    } catch {
        $content = ''
    }

    [void]$sb.AppendLine('## ' + $count + ' `' + $relPath + '`')
    [void]$sb.AppendLine('```' + $ext)
    [void]$sb.AppendLine($content)
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('```')
    [void]$sb.AppendLine('')

    $count++
}

[System.IO.File]::WriteAllText((Join-Path $RootPath $OutputFile), $sb.ToString(), $utf8NoBom)

Write-Host "Done! Saved to $OutputFile" -ForegroundColor Green