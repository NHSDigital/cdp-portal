DIR = terraform/root_modules/${MODULE}
VAR_FILE = ../../vars/${BUILD_ENV}.tfvars
ROOT_MODULES=$(shell ls -p terraform/root_modules/ | grep -v // | tr '\n' ' ')
BUILD_REGION ?= "eu-west-2"
IMAGE_TAG := $(shell git rev-parse --short=8 HEAD)
BUILD_ENV ?= "dev"
export AWS_ENVIRONMENT ?= ${BUILD_ENV}
TRIVY_FILE_PATH = ../../.trivyignore

.PHONY: help
help: ## Print info about each available command in this Makefile
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(firstword $(MAKEFILE_LIST)) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

guard-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "Environment variable $* not set"; \
		exit 1; \
	fi

# Linting

.PHONY: fmt
fmt: tf-fmt python-fmt prettier-fmt ## Format all autoformattable code
	@echo "Nice and tidy!"

.PHONY: python-lint-all
python-lint-all: python-fmt-check python-style-check ## Perform all python lints
	@echo "All good!"

.PHONY: python-fmt
python-fmt: ## Format python files (requires black as a command in the current python env, try asdf reshim if using that and black is installed)
	black .

.PHONY: python-fmt-check
python-fmt-check: ## Check python formatting (requires black black as a command in the current python env, try asdf reshim if using that and black is installed)
	black ./src/ --check --diff

# The E203 and W503 do not follow PEP8 and clash with Black and so they are ignored until the issue is resolved
# Read more here https://black.readthedocs.io/en/stable/faq.html#why-are-flake8-s-e203-and-w503-violated
# E501 also somewhat clashes with black's formatting, so is ignored rather than configuring a new line length
.PHONY: python-style-check
python-style-check: ## Check python code style (requires pycodestyle black as a command in the current python env, try asdf reshim if using that and black is installed)
	pycodestyle ./src/ --show-source --ignore=E501,E203,W503

.PHONY: tf-fmt
tf-fmt: ## Format terraform files
	terraform fmt --recursive

.PHONY: tf-fmt-check
tf-fmt-check: ## Check terraform file format (For use in CI, locally just use tf-fmt)
	terraform fmt -recursive -check -diff

.PHONY: prettier-fmt
prettier-fmt: npm-install ## Format typescript/css/json/tsx files
	cd portal; npx prettier --write .

.PHONY: prettier-validate-all
prettier-validate-all: npm-install ## Check typescript/css/json/tsx format (For use in CI, locally just use ts-fmt) # TODO: Import npm
	cd portal; npx prettier --check .

.PHONY: eslint-validate-all
eslint-validate-all: npm-install ## Raises code warnings for typescript/css/json/tsx files
	cd portal; npm run lint -- . --max-warnings 0

# Terraform
.PHONY: init
init: guard-MODULE guard-BUILD_ENV ## Initialises the root module directory
	terraform -chdir=${DIR} init \
		-backend-config="bucket=nhsd-data-refinery-portal-${BUILD_ENV}-tfstate" \
		-backend-config="dynamodb_table=nhsd-data-refinery-portal-${BUILD_ENV}-tfstate" \
		-backend-config="region=${BUILD_REGION}" \
		-lockfile=readonly \
		-reconfigure

.PHONY: init-upgrade
init-upgrade: guard-MODULE guard-BUILD_ENV ## Upgrades providers to the max within the spec
	terraform -chdir=${DIR} init -upgrade \
		-backend-config="bucket=nhsd-data-refinery-portal-${BUILD_ENV}-tfstate" \
		-backend-config="dynamodb_table=nhsd-data-refinery-portal-${BUILD_ENV}-tfstate" \
		-backend-config="region=${BUILD_REGION}" \
		-reconfigure
	terraform -chdir=${DIR} providers lock \
		-platform="darwin_amd64"\
		-platform="linux_amd64"\
		
PLAN_NAME ?= ${MODULE}.tfplan
.PHONY: plan
plan: guard-MODULE guard-BUILD_ENV init ## Create plan for terraform changes
	terraform -chdir=${DIR} plan -var-file=${VAR_FILE} -var "image_tag=$(IMAGE_TAG)" -out ${PLAN_NAME}

.PHONY: apply
apply: guard-MODULE guard-BUILD_ENV init ## Apply Terraform changes (in CI set EXTRA_TF_APPLY_ARGS to -auto-approve=true)
	terraform -chdir=${DIR} apply -var-file=${VAR_FILE} -var "image_tag=$(IMAGE_TAG)" ${EXTRA_TF_APPLY_ARGS}

.PHONY: destroy
destroy: guard-MODULE guard-BUILD_ENV init ## Destroy terraform resources (Auto approve is off)
	terraform -chdir=${DIR} destroy -var-file=${VAR_FILE}

.PHONY: terraform-validate
terraform-validate: guard-MODULE guard-BUILD_ENV init ## Validate terraform root module
	terraform -chdir=${DIR} validate

.PHONY: terraform-validate-all
terraform-validate-all: guard-BUILD_ENV ## Validate all terraform root modules
	exit_code=0 ; \
	for ROOT_MODULE in ${ROOT_MODULES} ; do \
		MODULE=$$ROOT_MODULE make terraform-validate || exit_code=1; \
	done ; \
	exit $$exit_code

.PHONY: npm-install
npm-install: ## Installs npm
	cd portal; npm install

.PHONY: run-portal-dev 
run-portal-dev: npm-install ## Runs the portal locally in dev
	cd portal; \
	AWS_PROFILE=portal_ecs_task_role \
	KEYCLOAK_SECRET=${shell AWS_PROFILE=portal_dev aws secretsmanager get-secret-value --secret-id=keycloak/portal_client_secret | jq .SecretString} \
	NEXTAUTH_SECRET=${shell AWS_PROFILE=portal_dev aws secretsmanager get-secret-value --secret-id=nextauth/encryption_secret | jq .SecretString} \
	npm run dev


.PHONY: next-build
next-build:
	docker build -t portal portal

.PHONY: next-run-container-locally
next-run-container-locally: ## Runs the docker container locally
	echo "Warning, this may not set the necessary environment variables correctly!"
	docker run -p 3000:3000 nextjs-docker

# Lambda Build and Test

.PHONY: clean-build-folder
clean-build-folder:
	rm -rf ./build/
	mkdir ./build/

LAMBDA_LIST := ${shell find src/aws-lambda -maxdepth 1 -mindepth 1 -type d -exec basename {} \; | grep -v 'submodules' | sort}

.PHONY: lambda-package
lambda-package: clean-build-folder ## Package all lambdas
	for lambda in $(LAMBDA_LIST) ; do \
		./scripts/poetry-package.sh $$lambda || exit=1 ; \
	done

.PHONY: lambda-test
lambda-test: ## Test all lambdas
	exit_code=0 ; \
	for lambda in $(LAMBDA_LIST) ; do \
		./scripts/poetry-test.sh $$lambda || exit_code=1; \
	done ; \
	exit $$exit_code

.PHONY: lambda-update
lambda-update: ## update poetry package dependencies of each lambda
	exit_code=0 ; \
	for lambda in $(LAMBDA_LIST) ; do \
		./scripts/poetry-update.sh $$lambda || exit_code=1; \
	done ; \
	exit $$exit_code

.PHONY: lambda-dependency-scan
lambda-dependency-scan: ## Check dependencies of all lambdas for known vulnerabilities
	./scripts/poetry-dependency-scan.sh

## Portal Banner

.PHONY: portal-banner
portal-banner:
	cd scripts/portal_banner;\
	poetry install;\
	poetry run python portal_banner/add_portal_banner_notification.py

.PHONY: portal-banner-test
portal-banner-test:
	cd scripts/portal_banner;\
	poetry run pytest

## Cypress

.PHONY: cypress-run
cypress-run: npm-install
	./scripts/cypress-run.sh

.PHONY: cypress-open-local
cypress-open-local: npm-install
	./scripts/cypress-open-local.sh

.PHONY: cypress-run-local-e2e
cypress-run-local-e2e: npm-install
	./scripts/cypress-run-local-e2e.sh

## Trivy Scan

.PHONY: trivy
trivy: guard-MODULE guard-BUILD_ENV ## Run security Analysis
	cd ${DIR} && terraform get && trivy conf --tf-vars ${VAR_FILE} --ignorefile ${TRIVY_FILE_PATH} --exit-code 1 --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL .

.PHONY: trivy-all
trivy-all: guard-BUILD_ENV ## Run security Analysis on all root modules
	exit_code=0 ; \
	for ROOT_MODULE in ${ROOT_MODULES} ; do \
		MODULE=$$ROOT_MODULE make trivy || exit_code=1; \
		echo "exit code is $$exit_code"; \
	done ; \
	exit $$exit_code
