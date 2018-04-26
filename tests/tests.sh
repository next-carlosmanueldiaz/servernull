#!/bin/bash

pdf="output.pdf"
png="screenshot.png"
web="https://server-null.s3-eu-west-1.amazonaws.com/home/content/html/article/big-data-para-entender-la-economia-en-tiempo-real.html"
echo "Fecha de inicio del test: $(date +"%d-%m-%Y_%H-%M-%S")"

for ((  i = 1 ;  i <= 100;  i++  ))
do
  google-chrome --headless --disable-gpu --print-to-pdf --window-size=1280,1696 $web
  mv output.pdf "$(date +"%d-%m-%Y_%H-%M-%S-%N_") $pdf"
  # google-chrome --headless --disable-gpu --screenshot --window-size=1280,1696 $web
  # mv $png "$(date +"%d-%m-%Y_%H-%M-%S-%N_") $png"
done

echo "Fecha de fin del test: $(date +"%d-%m-%Y_%H-%M-%S")"