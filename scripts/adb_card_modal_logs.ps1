# Capture Android logcat lines relevant to card modal / monster tap debugging.
# Usage: .\scripts\adb_card_modal_logs.ps1
# Prerequisite: USB debugging authorized on device (adb devices -> device)

$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
  $adb = "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe"
}
if (-not (Test-Path $adb)) {
  Write-Error "adb not found. Install Android SDK platform-tools."
  exit 1
}

Write-Host "Devices:"
& $adb devices

$pattern = "fatal|exception|error|ReactNativeJS|ReactNative|Expo|wodka|monster|card|modal|image|AndroidRuntime|CARD MODAL"
Write-Host ""
Write-Host "Streaming logcat (Ctrl+C to stop). Reproduce: tap monster on board."
Write-Host "Filter: $pattern"
Write-Host ""

& $adb logcat -c
& $adb logcat | Select-String -Pattern $pattern -CaseSensitive:$false
