@echo off
node "%~dp0scripts\validate.mjs" %*
if /i "%cmdcmdline:~0,6%" == "cmd /c" pause
