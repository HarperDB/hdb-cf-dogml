default: bash

.PHONY: build

build:
	docker build \
		-t hdb_cf_dogml \
		.

bash: build
	docker run \
		-v $(shell pwd):/app \
		-it \
		hdb_cf_dogml \
		bash
