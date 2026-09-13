$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== Can Haritasi - Gercek Backend + Gercek Harita Kurulumu ===" -ForegroundColor Cyan
Write-Host "Not: Bu surum MapLibre kullandigi icin Expo Go ile acilmaz." -ForegroundColor Yellow

npm install
npx expo install --check
npm run typecheck

Write-Host "`nKod kontrolu tamamlandi." -ForegroundColor Green
Write-Host "Android cihaza/emulator'e ilk native kurulumu yapmak icin:" -ForegroundColor Cyan
Write-Host "  npx expo run:android" -ForegroundColor White
Write-Host "Sonraki gelistirme oturumlarinda:" -ForegroundColor Cyan
Write-Host "  npx expo start --dev-client --clear" -ForegroundColor White
