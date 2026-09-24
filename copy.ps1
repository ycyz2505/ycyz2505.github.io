# copy.ps1
# 兼容 Windows PowerShell 5.1 和 PowerShell 7+
# 排除所有 .md、.sh、.ps1 文件

$OutputFile = "output.md"
$ScriptName = Split-Path -Leaf $PSCommandPath
if (-not $ScriptName) { $ScriptName = $MyInvocation.MyCommand.Name }

$RootPath = (Get-Location).Path.TrimEnd('\', '/')

# 输出编码：UTF-8 无 BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# 清空/创建输出文件
[System.IO.File]::WriteAllText((Join-Path $RootPath $OutputFile), "", $utf8NoBom)

# 排除规则
$ExcludeDirs = @('node_modules', 'venv', 'mc', 'old')

# 按扩展名统一排除（大小写不敏感）
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

# 收集文件并过滤
$files = Get-ChildItem -Path $RootPath -Recurse -File -Force | Where-Object {

    # 排除指定扩展名的文件（.md / .sh / .ps1）
    if ($ExcludeExts -contains $_.Extension.ToLower()) { return $false }

    $rel   = Get-RelativePath -Base $RootPath -Full $_.FullName
    $parts = $rel -split '[\\/]'

    # 排除隐藏文件 / 目录（名字以 . 开头）
    foreach ($p in $parts) {
        if ($p.StartsWith('.')) { return $false }
    }
    # 排除指定目录
    foreach ($d in $ExcludeDirs) {
        if ($parts -contains $d) { return $false }
    }

    return $true
} | Sort-Object FullName

$count = 1
$sb = New-Object System.Text.StringBuilder

foreach ($file in $files) {
    if (Test-IsBinaryFile $file.FullName) { continue }

    $relPath = Get-RelativePath -Base $RootPath -Full $file.FullName
    $relPath = $relPath -replace '\\', '/'

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

    # 用单引号拼接反引号，避免 PowerShell 转义问题
    [void]$sb.AppendLine('## ' + $count + ' `' + $relPath + '`')
    [void]$sb.AppendLine('```' + $ext)
    [void]$sb.AppendLine($content)
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('```')
    [void]$sb.AppendLine('')

    $count++
}

[System.IO.File]::WriteAllText((Join-Path $RootPath $OutputFile), $sb.ToString(), $utf8NoBom)

Write-Host "Done! Saved to $OutputFile"