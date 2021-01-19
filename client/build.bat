pyinstaller -p D:/github/empty-number/client/venv/Lib/site-packages -D main.py --noconsole
xcopy main.ui .\dist\main\
xcopy start.bat .\dist\
pause