@echo off
node "%~dp0scripts\install.mjs" %*
if /i "%cmdcmdline:~0,6%" == "cmd /c" pause
