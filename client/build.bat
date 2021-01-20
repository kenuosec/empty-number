cd /d %~dp0
pyinstaller -p D:/github/empty-number/client/venv/Lib/site-packages -D main.py --noconsole
xcopy main.ui .\dist\main\
xcopy active.ui .\dist\main\
xcopy add .\dist\ /s /e /h
pause