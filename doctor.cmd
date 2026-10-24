@echo off
node "%~dp0scripts\doctor.mjs" %*
if /i "%cmdcmdline:~0,6%" == "cmd /c" pause
