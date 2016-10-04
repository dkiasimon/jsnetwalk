#!/bin/sh
for i in 32 64 128; do
	mkdir -p png$i
	for a in svg/*.svg; do
		inkscape -w $i -h $i -e "png$i/$(basename "$a" .svg).png" "$a" ;
	done;
done;
