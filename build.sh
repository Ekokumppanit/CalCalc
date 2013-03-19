#!/bin/sh

nodefront compile -r

mkdir -p build
mkdir -p temp

nodefront minify --out build/calcalc.min.css main.css

nodefront minify --out build/calcalc.min.js main.js

# cp main.js build/calcalc.min.js

cp index.html build/calcalc.html


