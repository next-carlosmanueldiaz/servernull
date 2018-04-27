#!/bin/bash
# ******************************************************************************
# LEER CONFIGURACIÓN DE S3
# Establecemos el nombre del bucket en el fichero .s3config y leemos su configuración
# ------------------------------------------------------------------------------
clear
RED='\e[31m'
BLUE='\e[34m'
GREEN='\e[92m'
NC='\e[39m' # No Color
s3configFile=./.s3config
if [ -f $s3configFile ]; then
	OIFS=$IFS;
	IFS="=";
	branch=$(git symbolic-ref --short HEAD)
	while read -r line
	do
		if [ -n "$line" ]; then
			if [[ $line = *"="* ]]; then
				lineArray=($line);
				# echo $line
				# echo ${lineArray[0]}

				if [[ ${lineArray[0]} = "bucket" ]]; then
					bucket=${lineArray[1]}
					# echo -e "bucket: ${BLUE} $bucket ${NC}"
				fi

				# for ((i=0; i<${#lineArray[@]}; ++i)); do
				#   echo "valor $i: ${lineArray[$i]}"; 
				# done

			fi
		fi    
	done < "$s3configFile"

	echo -e "bucket: ${BLUE} $bucket ${NC}"
	s3upload=false
	if [ "$bucket" ]; then
		s3upload=true
	fi
else
	echo -e >&2 "File .s3config does not exist in you repository and is necesary to push to your s3 repo."
	echo -e >&2 "Put inside something like this:"
	echo -e >&2 "bucket=myBucketName"
	echo -e >&2 "branch=develop"
fi

# ******************************************************************************
# DESCARGAMOS FICHEROS DE "base de datos" de S3
# Descargamos los ficheros de datos que se van almacenando dinámicamente en el servidor de s3
# 
# ------------------------------------------------------------------------------
echo -e "${NC}Content types JSON:${GREEN}"
aws s3 cp s3://servernull/private/content-types/json/content-types.json private/content-types/json/content-types.json
echo -e "${NC}Contents List JSON:${GREEN}"
aws s3 cp s3://servernull/private/content-types/json/contents.json private/content-types/json/contents.json
echo -e "${NC}Contents DATA:${GREEN}"
aws s3 cp s3://servernull/home/content home/content --recursive
echo -e "${NC}HTML BASE:${GREEN}"
aws s3 cp s3://servernull/backend/html.html backend/html.html
echo -e "${NC}"