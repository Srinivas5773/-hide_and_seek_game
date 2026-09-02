.PHONY: start test build expand count clean

start:
	node server.js

test:
	node --test tests/*.test.js

expand:
	node expand_hide_and_seek_codebase.js

count:
	powershell -Command "Get-ChildItem -Recurse -Include *.js,*.html,*.css,*.json,*.md | Get-Content | Measure-Object -Line"

clean:
	rm -rf node_modules
