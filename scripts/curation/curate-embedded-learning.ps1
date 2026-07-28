param(
  [string]$SourceRoot = 'B:\嵌入式学习'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$uploadsRoot = Join-Path $workspaceRoot 'uploads'
$stagingRoot = Join-Path $workspaceRoot 'tmp\curation-packages'
$sourceRootPath = [System.IO.Path]::GetFullPath($SourceRoot)
$copiedFiles = 0
$createdArchives = @()

if (-not (Test-Path -LiteralPath $sourceRootPath -PathType Container)) {
  throw "Source folder not found: $sourceRootPath"
}

New-Item -ItemType Directory -Path $uploadsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

function Assert-PathUnderRoot {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Root
  )

  $resolvedPath = [System.IO.Path]::GetFullPath($Path)
  $resolvedRoot = [System.IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'

  if (-not $resolvedPath.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path escapes intended root: $resolvedPath"
  }
}

function Copy-CuratedFile {
  param(
    [Parameter(Mandatory = $true)][string]$SourceRelativePath,
    [Parameter(Mandatory = $true)][string]$TargetRelativePath
  )

  $sourcePath = Join-Path $sourceRootPath $SourceRelativePath
  $targetPath = Join-Path $uploadsRoot $TargetRelativePath

  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    throw "Required source file not found: $sourcePath"
  }

  Assert-PathUnderRoot -Path $targetPath -Root $uploadsRoot
  New-Item -ItemType Directory -Path (Split-Path $targetPath -Parent) -Force | Out-Null
  Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
  $script:copiedFiles += 1
}

function Copy-CuratedTree {
  param(
    [Parameter(Mandatory = $true)][string]$SourceRelativePath,
    [Parameter(Mandatory = $true)][string]$TargetRelativePath,
    [Parameter(Mandatory = $true)][string[]]$Extensions
  )

  $sourcePath = Join-Path $sourceRootPath $SourceRelativePath
  $targetPath = Join-Path $uploadsRoot $TargetRelativePath

  if (-not (Test-Path -LiteralPath $sourcePath -PathType Container)) {
    throw "Required source folder not found: $sourcePath"
  }

  Assert-PathUnderRoot -Path $targetPath -Root $uploadsRoot

  $files = Get-ChildItem -LiteralPath $sourcePath -Recurse -File -Force |
    Where-Object { $Extensions -contains $_.Extension.ToLowerInvariant() }

  foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($sourcePath.Length).TrimStart('\')
    $destinationPath = Join-Path $targetPath $relativePath
    Assert-PathUnderRoot -Path $destinationPath -Root $uploadsRoot
    New-Item -ItemType Directory -Path (Split-Path $destinationPath -Parent) -Force | Out-Null
    Copy-Item -LiteralPath $file.FullName -Destination $destinationPath -Force
    $script:copiedFiles += 1
  }
}

function New-CuratedArchive {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string]$SourceRelativePath,
    [Parameter(Mandatory = $true)][string]$TargetRelativePath,
    [string[]]$ExtraExcludedDirectories = @(),
    [string[]]$ExcludedPrefixes = @()
  )

  $sourcePath = Join-Path $sourceRootPath $SourceRelativePath
  $archivePath = Join-Path $uploadsRoot $TargetRelativePath
  $safeLabel = $Label -replace '[^\p{L}\p{N}.-]+', '-'
  $stagePath = Join-Path $stagingRoot $safeLabel

  if (-not (Test-Path -LiteralPath $sourcePath -PathType Container)) {
    throw "Required archive source folder not found: $sourcePath"
  }

  Assert-PathUnderRoot -Path $archivePath -Root $uploadsRoot
  Assert-PathUnderRoot -Path $stagePath -Root $stagingRoot

  if (Test-Path -LiteralPath $stagePath) {
    Remove-Item -LiteralPath $stagePath -Recurse -Force
  }

  New-Item -ItemType Directory -Path $stagePath -Force | Out-Null
  New-Item -ItemType Directory -Path (Split-Path $archivePath -Parent) -Force | Out-Null

  $allowedExtensions = @(
    '.c', '.h', '.cpp', '.hpp', '.cc', '.s', '.asm', '.a51',
    '.ld', '.lds', '.sct', '.icf', '.ioc',
    '.uvproj', '.uvprojx', '.uvopt', '.uvoptx', '.ewp', '.eww',
    '.cproject', '.project', '.py', '.cmake', '.mk', '.m',
    '.slx', '.mat', '.json', '.yml', '.yaml', '.md', '.txt',
    '.csv', '.ino', '.pro', '.pri', '.ui', '.qrc',
    '.schdoc', '.pcbdoc', '.prjpcb', '.outjob',
    '.schlib', '.pcblib', '.intlib', '.libpkg', '.step', '.stp'
  )
  $allowedNames = @(
    'CMakeLists.txt', 'Kconfig', 'Makefile', 'SConstruct', 'SConscript',
    'LICENSE', 'LICENSE.txt', 'README', 'README.md'
  )
  $excludedDirectories = @(
    '.git', '.svn', '.vs', '.vscode', '.idea',
    'build', 'debug', 'release', 'objects', 'listings',
    'output', 'outputs', 'dist', 'node_modules', 'managed_components',
    '__pycache__', 'slprj', 'html', 'rte', 'cmakefiles'
  ) + $ExtraExcludedDirectories

  $selectedFiles = Get-ChildItem -LiteralPath $sourcePath -Recurse -File -Force |
    Where-Object {
      $relativePath = $_.FullName.Substring($sourcePath.Length).TrimStart('\')
      $parts = $relativePath -split '\\'
      $directoryParts = if ($parts.Length -gt 1) { $parts[0..($parts.Length - 2)] } else { @() }
      $isExcludedDirectory = @(
        $directoryParts | Where-Object { $excludedDirectories -contains $_.ToLowerInvariant() }
      ).Count -gt 0
      $isExcludedPrefix = $false

      foreach ($prefix in $ExcludedPrefixes) {
        if ($relativePath.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
          $isExcludedPrefix = $true
          break
        }
      }

      (-not $isExcludedDirectory) -and
      (-not $isExcludedPrefix) -and
      ($allowedExtensions -contains $_.Extension.ToLowerInvariant() -or $allowedNames -contains $_.Name) -and
      $_.Length -lt 20MB
    }

  if ($selectedFiles.Count -eq 0) {
    throw "No source files selected for archive: $Label"
  }

  foreach ($file in $selectedFiles) {
    $relativePath = $file.FullName.Substring($sourcePath.Length).TrimStart('\')
    $destinationPath = Join-Path $stagePath $relativePath
    Assert-PathUnderRoot -Path $destinationPath -Root $stagingRoot
    New-Item -ItemType Directory -Path (Split-Path $destinationPath -Parent) -Force | Out-Null
    Copy-Item -LiteralPath $file.FullName -Destination $destinationPath -Force
  }

  $archiveReadme = @"
$Label

本压缩包由开源协会知识库从学习目录中自动精选生成。
已排除安装包、视频、编译缓存、目标文件、可执行文件、私钥和大型第三方依赖。
部分工程需要通过对应 IDE、SDK 或配置文件重新生成依赖后再编译。
"@
  [System.IO.File]::WriteAllText(
    (Join-Path $stagePath 'README.txt'),
    $archiveReadme,
    (New-Object System.Text.UTF8Encoding($false))
  )

  if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }

  Compress-Archive -Path (Join-Path $stagePath '*') -DestinationPath $archivePath -CompressionLevel Optimal

  $archive = Get-Item -LiteralPath $archivePath
  if ($archive.Length -ge 95MB) {
    throw "Archive is too large for normal GitHub storage: $($archive.FullName)"
  }

  $script:createdArchives += [pscustomobject]@{
    Name = $Label
    Files = $selectedFiles.Count
    MiB = [math]::Round($archive.Length / 1MB, 2)
  }

  Assert-PathUnderRoot -Path $stagePath -Root $stagingRoot
  Remove-Item -LiteralPath $stagePath -Recurse -Force
}

# 01 - Programming basics
Copy-CuratedFile 'C语言课程\04. 课程讲义\C语言课程讲义.pdf' '嵌入式\01-编程基础\C语言\C语言课程讲义.pdf'
Copy-CuratedFile 'C语言课程\02. 相关资料\C语言实战快速入门.xmind' '嵌入式\01-编程基础\C语言\C语言实战快速入门.xmind'
Copy-CuratedFile 'C语言课程\02. 相关资料\C语言实战快速入门课程大纲.xmind' '嵌入式\01-编程基础\C语言\C语言实战快速入门课程大纲.xmind'
New-CuratedArchive 'C语言课程源码' 'C语言课程\03. 课程源码' '嵌入式\01-编程基础\C语言\C语言课程源码.zip'

# 02 - 51/STC15 microcontrollers
Copy-CuratedTree 'Keil_STC15蓝桥杯\DP2025_SCM\Datasheet' '嵌入式\02-51单片机\芯片手册' @('.pdf')
Copy-CuratedFile 'Keil_STC15蓝桥杯\STC15系列单片机用户手册.pdf' '嵌入式\02-51单片机\STC15与蓝桥杯\STC15系列单片机用户手册.pdf'
Copy-CuratedFile 'Keil_STC15蓝桥杯\DP2025_SCM\SCH_V31.pdf' '嵌入式\02-51单片机\STC15与蓝桥杯\DP2025开发板原理图V31.pdf'
Copy-CuratedFile 'Keil_STC15蓝桥杯\DP2025_SCM\SCH_V40.pdf' '嵌入式\02-51单片机\STC15与蓝桥杯\DP2025开发板原理图V40.pdf'
Copy-CuratedFile 'Keil_STC15蓝桥杯\DP2025_SCM\SEG_TABLE.pdf' '嵌入式\02-51单片机\STC15与蓝桥杯\DP2025数码管段码表.pdf'
New-CuratedArchive '51单片机基础练习源码' '51单片机练习' '嵌入式\02-51单片机\基础练习\51单片机基础练习源码.zip'
New-CuratedArchive 'STC89C51项目源码' 'STC89C51项目' '嵌入式\02-51单片机\基础练习\STC89C51项目源码.zip'
New-CuratedArchive 'STC15蓝桥杯示例源码' 'Keil_STC15蓝桥杯' '嵌入式\02-51单片机\STC15与蓝桥杯\STC15蓝桥杯示例源码.zip' @() @('蓝桥杯客观题整理\', '蓝桥杯单片机组------资料包  资料部分\')

# 03 - STM32 and real-time systems
Copy-CuratedFile 'FreeRTOS_STM32F1\DshanMCU-F103_baseboard.pdf' '嵌入式\03-STM32与实时系统\FreeRTOS\STM32F103底板资料.pdf'
Copy-CuratedFile 'FreeRTOS_STM32F1\Rtos_note\FreeRTOS操作系统配置参数说明.pdf' '嵌入式\03-STM32与实时系统\FreeRTOS\FreeRTOS配置参数说明.pdf'
Copy-CuratedFile 'FreeRTOS_STM32F1\Rtos_note\FreeRTOS课堂笔记.pdf' '嵌入式\03-STM32与实时系统\FreeRTOS\FreeRTOS课堂笔记.pdf'
New-CuratedArchive 'FreeRTOS-STM32F1源码' 'FreeRTOS_STM32F1' '嵌入式\03-STM32与实时系统\FreeRTOS\FreeRTOS-STM32F1源码.zip'

Copy-CuratedTree 'RT-Thread学习\rt-note' '嵌入式\03-STM32与实时系统\RT-Thread\学习笔记' @('.pdf')
Copy-CuratedFile 'RT-Thread学习\Spark\1.CubeMX导入RT-Thread-Nano.pdf' '嵌入式\03-STM32与实时系统\RT-Thread\CubeMX导入RT-Thread-Nano.pdf'
Copy-CuratedTree 'RT-Thread学习\Spark\星火1号\1. 星火1号开发板-RT-Thread入门资料' '嵌入式\03-STM32与实时系统\RT-Thread\内核入门' @('.pdf')
Copy-CuratedFile 'RT-Thread学习\Spark\星火1号\2. 星火1号开发板进阶资料\星火1号用户手册_V1.1.0.pdf' '嵌入式\03-STM32与实时系统\RT-Thread\星火1号用户手册V1.1.0.pdf'
Copy-CuratedFile 'RT-Thread学习\Spark\星火1号\3. 星火1号开发板离线SDK\星火1号开发板离线SDK使用指南.docx' '嵌入式\03-STM32与实时系统\RT-Thread\星火1号离线SDK使用指南.docx'
Copy-CuratedFile 'RT-Thread学习\Spark\星火1号\5. 开发工具Env（配合MDK使用）\Env用户手册.docx' '嵌入式\03-STM32与实时系统\RT-Thread\Env用户手册.docx'
Copy-CuratedFile 'RT-Thread学习\Spark\星火1号\6. 星火1号开发板原理图\星火1号开发板原理图_V1_0.pdf' '嵌入式\03-STM32与实时系统\RT-Thread\星火1号开发板原理图V1.0.pdf'
Copy-CuratedFile 'RT-Thread学习\Spark\星火1号\7. STM32参考资料\Cortex®-M4 Programmingmanual.pdf' '嵌入式\03-STM32与实时系统\STM32参考手册\Cortex-M4编程手册.pdf'
Copy-CuratedFile 'RT-Thread学习\Spark\星火1号\7. STM32参考资料\STM32f407 DataSheet.pdf' '嵌入式\03-STM32与实时系统\STM32参考手册\STM32F407数据手册.pdf'
Copy-CuratedFile 'RT-Thread学习\Spark\星火1号\7. STM32参考资料\STM32f407 Reference manual.pdf' '嵌入式\03-STM32与实时系统\STM32参考手册\STM32F407参考手册.pdf'
Copy-CuratedFile 'RT-Thread学习\基于RT-Thread的智能小车开发实践.docx' '嵌入式\03-STM32与实时系统\RT-Thread\基于RT-Thread的智能小车开发实践.docx'
Copy-CuratedFile 'RT-Thread学习\天空星原理图（核心板）.pdf' '嵌入式\03-STM32与实时系统\RT-Thread\天空星核心板原理图.pdf'
Copy-CuratedFile 'RT-Thread学习\智能车原理图.pdf' '嵌入式\03-STM32与实时系统\RT-Thread\智能车原理图.pdf'

# 04 - ESP32
New-CuratedArchive 'ESP32-IDF练习源码' 'ESP32_IDF练习' '嵌入式\04-ESP32\ESP32-IDF练习源码.zip'

# 05 - TI MSPM0
Copy-CuratedFile 'TI_MSPM0学习\mspm0g_freertos\mspm0g3507.pdf' '嵌入式\05-TI-MSPM0\MSPM0G3507资料.pdf'
Copy-CuratedFile 'TI_MSPM0学习\mspm0g_freertos\SCH_Schematic1_2026-03-24.pdf' '嵌入式\05-TI-MSPM0\MSPM0G3507开发板原理图.pdf'
New-CuratedArchive 'TI-MSPM0练习源码' 'TI_MSPM0学习' '嵌入式\05-TI-MSPM0\TI-MSPM0练习源码.zip' @() @('source\', '.metadata\')

# 06 - Hardware design and PCB
Copy-CuratedTree 'AD_PCB设计学习\【ad01】51单片机-v2（如果不想练习元件库，可以用这一份）\51单片机（如果不想练习原理图和PCB元件库，可以用这一份）\器件手册' '嵌入式\06-硬件设计与PCB\常用器件手册' @('.pdf')
Copy-CuratedFile 'AD_PCB设计学习\【ad01】51单片机-v2（如果不想练习元件库，可以用这一份）\需要练习的原理图\ts8900MINI-51开发板原理图.pdf' '嵌入式\06-硬件设计与PCB\设计参考\TS8900-MINI-51开发板原理图.pdf'
Copy-CuratedFile 'AD_PCB设计学习\2.STM32核心板PCB设计视频教程\STM32核心板PCB设计视频教程\STM32F407VxTx核心板\阻抗控制叠层模板-2016.02.22.xls' '嵌入式\06-硬件设计与PCB\设计参考\阻抗控制叠层模板.xls'
Copy-CuratedFile 'AD_PCB设计学习\2.STM32核心板PCB设计视频教程\STM32核心板PCB设计视频教程\STM32F407VxTx核心板\阻抗模板集合01.xlsx' '嵌入式\06-硬件设计与PCB\设计参考\阻抗模板集合.xlsx'
New-CuratedArchive 'AD-51单片机PCB设计工程' 'AD_PCB设计学习\51：STC89C52' '嵌入式\06-硬件设计与PCB\设计工程\AD-51单片机PCB设计工程.zip'
New-CuratedArchive 'AD-STM32F407PCB设计工程' 'AD_PCB设计学习\STM32F407VBT6' '嵌入式\06-硬件设计与PCB\设计工程\AD-STM32F407PCB设计工程.zip'

# 07 - Linux and Qt
Copy-CuratedTree 'Linux基础\Linux常用命令' '嵌入式\07-Linux与Qt\Linux常用命令' @('.pdf')
Copy-CuratedTree 'Linux基础\基础入门' '嵌入式\07-Linux与Qt\Linux基础入门' @('.pdf')
New-CuratedArchive 'QT入门示例源码' 'QT_Learn' '嵌入式\07-Linux与Qt\Qt\QT入门示例源码.zip'

# 08 - Association-created training materials
Copy-CuratedFile '开源协会培训\开源协会2026竞赛特训营计划\开源协会2026竞赛特训营计划.pdf' '嵌入式\08-协会培训\竞赛特训营\开源协会2026竞赛特训营计划.pdf'
Copy-CuratedFile '开源协会培训\开源协会2026竞赛特训营计划\STM32入门培训.pdf' '嵌入式\08-协会培训\竞赛特训营\STM32入门培训.pdf'
Copy-CuratedFile '开源协会培训\开源协会蓝桥杯入门手册\开源协会蓝桥杯入门手册.pdf' '嵌入式\08-协会培训\蓝桥杯入门\开源协会蓝桥杯入门手册.pdf'
Copy-CuratedFile '开源协会培训\开源协会蓝桥杯入门手册\开源协会定时器学习手册.pdf' '嵌入式\08-协会培训\蓝桥杯入门\开源协会定时器学习手册.pdf'
Copy-CuratedFile '开源协会培训\开源协会蓝桥杯入门手册\开源协会时间片轮选算法学习手册.pdf' '嵌入式\08-协会培训\蓝桥杯入门\开源协会时间片轮选算法学习手册.pdf'
Copy-CuratedFile '开源协会培训\开源协会蓝桥杯入门手册\osa杯选择题.pdf' '嵌入式\08-协会培训\蓝桥杯入门\OSA杯选择题.pdf'
Copy-CuratedFile '开源协会培训\开源协会蓝桥杯入门手册\osa杯选择题答案.pdf' '嵌入式\08-协会培训\蓝桥杯入门\OSA杯选择题答案.pdf'
Copy-CuratedFile '开源协会培训\开源协会蓝桥杯入门手册\实验六.docx' '嵌入式\08-协会培训\蓝桥杯入门\实验六.docx'
Copy-CuratedFile '开源协会培训\开源协会蓝桥杯入门手册\实验七.docx' '嵌入式\08-协会培训\蓝桥杯入门\实验七.docx'

# Robot motion control materials discovered in the embedded-learning archive.
Copy-CuratedFile 'FOC电机控制学习\电机模型及参考资料\STM32G4 Simulink FOC开发套件用户手册V13.pdf' '机器人运动控制\01-电机控制\FOC\STM32G4-Simulink-FOC开发套件用户手册V13.pdf'
Copy-CuratedFile 'FOC电机控制学习\电机模型及参考资料\STM32G4开发板原理图.pdf' '机器人运动控制\01-电机控制\FOC\STM32G4开发板原理图.pdf'
New-CuratedArchive 'FOC电机控制示例源码' 'FOC电机控制学习' '机器人运动控制\01-电机控制\FOC\FOC电机控制示例源码.zip' @('drivers', 'middlewares') @('电机模型及参考资料\')

Write-Output "Copied curated documents: $copiedFiles"
$createdArchives | Format-Table -AutoSize
