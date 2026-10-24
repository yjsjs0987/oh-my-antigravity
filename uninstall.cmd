@echo off
node "%~dp0scripts\uninstall.mjs" %*
if /i "%cmdcmdline:~0,6%" == "cmd /c" pause
