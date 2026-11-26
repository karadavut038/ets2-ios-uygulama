#!/bin/bash
# Builds an UNSIGNED KrankmiliButtonBox.ipa on macOS (GitHub Actions or any Mac with Xcode).
# Sign it afterwards with your own tool / certificate.
set -euo pipefail
cd "$(dirname "$0")"
NAME=KrankmiliButtonBox
SDK=$(xcrun --sdk iphoneos --show-sdk-path)
APP=build/Payload/$NAME.app
rm -rf build
mkdir -p "$APP"
echo "SDK: $SDK"
xcrun -sdk iphoneos swiftc -O -target arm64-apple-ios15.0 -sdk "$SDK" \
  -module-name "$NAME" -o "$APP/$NAME" app/*.swift
cp app/Info.plist "$APP/Info.plist"
cp -R app/www "$APP/www"
cp app/ios-shim.js "$APP/"
cp app/*.png "$APP/"
printf 'APPL????' > "$APP/PkgInfo"
plutil -convert binary1 "$APP/Info.plist"
plutil -lint "$APP/Info.plist"
( cd build && zip -qry "$NAME.ipa" Payload )
ls -la build
echo "IPA hazir: build/$NAME.ipa (imzasiz)"
