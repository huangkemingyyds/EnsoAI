; Custom NSIS script for EnsoAI-Keming
; Register enso-keming:// URL scheme

!macro customInstall
  ; Register URL protocol
  WriteRegStr HKCU "Software\Classes\enso-keming" "" "URL:EnsoAI-Keming Protocol"
  WriteRegStr HKCU "Software\Classes\enso-keming" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\enso-keming\shell\open\command" "" '"$INSTDIR\EnsoAI-Keming.exe" "%1"'
!macroend

!macro customUnInstall
  ; Remove URL protocol registration
  DeleteRegKey HKCU "Software\Classes\enso-keming"
!macroend
