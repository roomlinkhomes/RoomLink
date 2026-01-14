# ===============================
# React Native / Android Clean Script
# ===============================

Write-Host "⚡ Killing potential locking processes..."

# Kill Node (Metro bundler)
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill Java (Gradle / Android Studio)
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill adb (Android Debug Bridge)
Get-Process adb -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "✅ Processes killed."

# Delete Android build folders
Write-Host "🗑️ Removing Android build folders..."
$androidBuild = "android\app\build"
$androidGradle = "android\.gradle"

if (Test-Path $androidBuild) {
    Remove-Item -Recurse -Force $androidBuild
    Write-Host "Deleted $androidBuild"
} else {
    Write-Host "$androidBuild does not exist."
}

if (Test-Path $androidGradle) {
    Remove-Item -Recurse -Force $androidGradle
    Write-Host "Deleted $androidGradle"
} else {
    Write-Host "$androidGradle does not exist."
}

Write-Host "⚡ Cleaning complete! You can now reinstall dependencies and rebuild the app."
