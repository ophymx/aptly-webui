# Build and package targets.
#
#   make build   # vite build -> dist/
#   make deb     # produces dist-pkg/aptly-webui_<version>_all.deb
#   make clean

VERSION := $(shell node -p "require('./package.json').version")

.PHONY: build deb clean

build:
	npm ci
	npm run build

deb: build
	mkdir -p dist-pkg
	cd packaging && VERSION=$(VERSION) nfpm pkg \
	  --packager deb \
	  --target ../dist-pkg/

clean:
	rm -rf dist dist-pkg
