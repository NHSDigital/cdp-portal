ROOT_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
STATIC_ANALYSIS_BUILD_ENV ?= dev
IMAGE_TAG := $(shell git rev-parse --short=8 HEAD)
BUILD_FOLDER = ./build/
LAMBDA_LIST := ${shell find src/aws-lambda -maxdepth 1 -mindepth 1 -type d -exec basename {} \; | grep -v 'submodules' | sort}
SCRIPTS_LIST := $(shell find scripts -maxdepth 1 -mindepth 1 -type d -exec test -e '{}'/pyproject.toml \; -printf '%f\n')
TF_PLAN_NAME ?= ${MODULE}.tfplan
TF_ROOT_MODULE_DIR_PATH = terraform/root_modules/${MODULE}
TF_ROOT_MODULES=$(shell ls -p terraform/root_modules/ | grep -v // |  tr '\n' ' ')
TF_BACKEND_STATE = nhsd-data-refinery-portal-${BUILD_ENV}-tfstate
TF_VARIABLES_SYMLINK = variables.tf
TF_SHARED_LOCALS_SYMLINK = shared_locals.tf
## Relative to the root_module/<module> hence ../../
TF_VAR_FILE = ../../vars/${BUILD_ENV}.tfvars
TF_SHARED_VARIABLES = ../../shared/variables.tf
TF_SHARED_LOCALS = ../../shared/shared_locals.tf
TRIVY_IGNORE_ABS_PATH=$(ROOT_DIR).trivyignore
PORTAL_SERVICE ?= SDE

ifeq ($(BUILD_ENV),dev)
	KEYCLOAK_CLIENT_SECRET_ID := keycloak/portal_client_secret
	NEXTAUTH_SECRET_ID := nextauth/encryption_secret
	AWS_PROFILE_FOR_ECS_TASK := portal_ecs_task_role
else
	KEYCLOAK_CLIENT_SECRET_ID := $(BUILD_ENV)-keycloak/portal_client_secret
	NEXTAUTH_SECRET_ID := $(BUILD_ENV)-nextauth/encryption_secret
	AWS_PROFILE_FOR_ECS_TASK := $(BUILD_ENV)_portal_ecs_task_role
endif

guard-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "Environment variable $* not set"; \
		exit 1; \
	fi

# Print info about each available command in this Makefile
.PHONY: help
help:
	@awk 'BEGIN {FS = ":.*?## "} \
		/^## SECTION:/ { \
			sub(/^## SECTION:[ \t]*/, ""); \
			printf "\033[1;33m%s\033[0m\n", $$0; \
			next \
		} \
		/^[a-zA-Z0-9_-]+:.*?## / { \
			printf "  \033[36m%-28s\033[0m %s\n", $$1, $$2 \
		}' $(firstword $(MAKEFILE_LIST))

## SECTION: Terraform

tf-init: guard-MODULE guard-BUILD_ENV ## Initialises terraform
	terraform -chdir=${TF_ROOT_MODULE_DIR_PATH} init \
		-backend-config="bucket=${TF_BACKEND_STATE}" \
		-backend-config="dynamodb_table=${TF_BACKEND_STATE}" \
		${EXTRA_BACKEND_CONFIG} \
		-lockfile=readonly \
		-reconfigure

tf-init-upgrade: guard-MODULE guard-BUILD_ENV  ## Upgrades plugins to the max within the spec
	terraform -chdir=${TF_ROOT_MODULE_DIR_PATH} init -upgrade \
		-backend-config="bucket=${TF_BACKEND_STATE}" \
		-backend-config="dynamodb_table=${TF_BACKEND_STATE}" \
		-reconfigure
	terraform -chdir=${TF_ROOT_MODULE_DIR_PATH} providers lock \
		-platform="darwin_amd64" \
		-platform="linux_amd64"

tf-init-upgrade-all: guard-BUILD_ENV ## Upgrades plugins to the max with in the spec for all modules
	for ROOT_MODULE in ${TF_ROOT_MODULES} ; do \
		MODULE=$$ROOT_MODULE make tf-init-upgrade ; \
	done

tf-plan: guard-MODULE guard-BUILD_ENV tf-init ## Run a terraform plan
	terraform -chdir=${TF_ROOT_MODULE_DIR_PATH} plan \
		-var-file ${TF_VAR_FILE} \
		-out ${TF_PLAN_NAME} \
		-var "image_tag=$(IMAGE_TAG)"

tf-apply: guard-MODULE guard-BUILD_ENV tf-init ## Apply terraform changes
	terraform -chdir=${TF_ROOT_MODULE_DIR_PATH} apply \
		-var-file=${TF_VAR_FILE} \
		-var "image_tag=$(IMAGE_TAG)" \
		${EXTRA_TF_APPLY_ARGS}

tf-plan-destroy: guard-MODULE guard-BUILD_ENV tf-init
	terraform -chdir=${TF_ROOT_MODULE_DIR_PATH} plan -destroy \
		-var-file=${TF_VAR_FILE}

tf-destroy: guard-MODULE guard-BUILD_ENV tf-init
	terraform -chdir=${TF_ROOT_MODULE_DIR_PATH} destroy \
		-var-file=${TF_VAR_FILE} ${EXTRA_TF_APPLY_ARGS}

tf-force-unlock: guard-MODULE guard-BUILD_ENV tf-init ## Create plan for terraform changes
	terraform -chdir=${TF_ROOT_MODULE_DIR_PATH} force-unlock ${ID}

tf-console: tf-init ## Spin up a terraform console for inspecting variables, etc.
	terraform -chdir=${TF_ROOT_MODULE_DIR_PATH} console \
		-var-file=${TF_VAR_FILE}

tf-providers: tf-init ## Displays tree of modules in config and their providers requirements
	terraform -chdir=${TF_ROOT_MODULE_DIR_PATH} providers

tf-fmt: ## Format terraform files
	terraform fmt --recursive

tf-fmt-check: ## Check terraform file format
	terraform fmt -recursive -check

tf-validate: guard-MODULE guard-BUILD_ENV tf-init ## Validate terraform root module
	terraform -chdir=${TF_ROOT_MODULE_DIR_PATH} validate

tf-validate-all: ## Validates all terraform root modules
	exit_code=0 ; \
	for ROOT_MODULE in ${TF_ROOT_MODULES} ; do \
		BUILD_ENV=${STATIC_ANALYSIS_BUILD_ENV} MODULE=$$ROOT_MODULE make tf-validate || exit_code=1 ; \
	done ; \
	exit $$exit_code

# requires trivy as a command in the current python env, try asdf reshim if using that and black is installed
tf-config-check: guard-MODULE guard-BUILD_ENV ## Run security analysis
	@echo "trivy scanning ${TF_ROOT_MODULE_DIR_PATH}" && exit_code=0 ;
	## Replace symlinked files with actual for trivy
	@cd ${TF_ROOT_MODULE_DIR_PATH} \
		&& rm ${TF_VARIABLES_SYMLINK} \
		&& cp ${TF_SHARED_VARIABLES} . \
		&& rm ${TF_SHARED_LOCALS_SYMLINK} \
		&& cp ${TF_SHARED_LOCALS} . \
		&& terraform get
	## Perform trivy scan
	@cd ${TF_ROOT_MODULE_DIR_PATH} \
		&& trivy conf \
			--tf-vars ${TF_VAR_FILE} \
			--ignorefile ${TRIVY_IGNORE_ABS_PATH} \
			--exit-code 1 \
			--severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL . \
			|| exit_code=1;
	## Undo symlink replacement
	git restore ${TF_ROOT_MODULE_DIR_PATH}/${TF_VARIABLES_SYMLINK}
	git restore ${TF_ROOT_MODULE_DIR_PATH}/${TF_SHARED_LOCALS_SYMLINK}
	exit $$exit_code

# requires trivy as a command in the current python env, try asdf reshim if using that and black is installed
tf-config-check-all: ## Run security analysis on all root modules
	exit_code=0 ; \
	for ROOT_MODULE in ${TF_ROOT_MODULES} ; do \
		BUILD_ENV=${STATIC_ANALYSIS_BUILD_ENV} MODULE=$$ROOT_MODULE make tf-config-check || exit_code=1; \
	done ; \
	exit $$exit_code


## SECTION: NPM

.PHONY: npm-install
npm-install:
	cd portal; npm install

.PHONY: npm-run-dev 
npm-run-dev: guard-BUILD_ENV npm-install
	cd portal; \
	AWS_PROFILE=$(AWS_PROFILE_FOR_ECS_TASK) \
	KEYCLOAK_SECRET=${shell AWS_PROFILE=portal_dev aws secretsmanager get-secret-value --secret-id=$(KEYCLOAK_CLIENT_SECRET_ID) | jq .SecretString} \
	NEXTAUTH_SECRET=${shell AWS_PROFILE=portal_dev aws secretsmanager get-secret-value --secret-id=$(NEXTAUTH_SECRET_ID) | jq .SecretString} \
	PORTAL_SERVICE="$(PORTAL_SERVICE)" \
	npm run $(BUILD_ENV)

.PHONY: npm-fmt
npm-fmt: npm-install ## Format portal code
	cd portal; npx prettier --write . --log-level silent

.PHONY: npm-fmt-check
npm-fmt-check: npm-install ## Check portal code for formatting errors
	cd portal; npx prettier --check .

.PHONY: npm-lint
npm-lint: npm-install ## Lint portal code (also checks format)
	cd portal; npm run lint:fix .

.PHONY: npm-lint-check
npm-lint-check: npm-install ## Check portal code for linting errors (also checks formatting)
	cd portal; npm run lint -- .

.PHONY: npm-vuln-check-low
npm-vuln-check-low: ## Run vulnerability analysis (UNKNOWN, LOW, MEDIUM)
	trivy fs portal/ \
		--scanners vuln \
		--severity UNKNOWN,LOW,MEDIUM \
		--ignorefile .trivyignore \
		--exit-code 1

.PHONY: npm-vuln-check-high
npm-vuln-check-high: ## Run vulnerability analysis (HIGH, CRITICAL)
	trivy fs portal/ \
		--scanners vuln \
		--severity HIGH,CRITICAL \
		--ignorefile .trivyignore \
		--exit-code 1

.PHONY: npm-cy-run
npm-cy-run: npm-install ## Execute cypress tests against remote domain (vars need provided)
	PORTAL_SERVICE=$(PORTAL_SERVICE) ./scripts/cypress-run.sh

.PHONY: npm-cy-run-local
npm-cy-run-local: npm-install ## Execute cypress tests against local domain
	PORTAL_SERVICE=$(PORTAL_SERVICE) ./scripts/cypress-run-local-e2e.sh

.PHONY: npm-cy-open
npm-cy-open: npm-install ## Opens cypress application locally
	PORTAL_SERVICE=${PORTAL_SERVICE} ./scripts/cypress-open-local.sh

.PHONY: npm-jest-run
npm-jest-run: ## Run jest tests
	cd portal && \
	npm ci && \
	npm run test

.PHONY: npm-jest-watch
npm-jest-watch: ## Run jest tests in watch mode
	cd portal && \
	npm ci && \
	npm run test:watch


## SECTION: Python

# requires black as a command in the current python env, try asdf reshim if using that and black is installed
.PHONY: python-fmt
python-fmt: ## Format python files
	black .

# requires black as a command in the current python env, try asdf reshim if using that and black is installed
.PHONY: python-fmt-check
python-fmt-check: ## Check python formatting
	black . --check --diff

# requires pycodestyle as a command in the current python env, try asdf reshim if using that and pycodestyle is installed
# E203,E501,W503 somewhat clashes with black's formatting, so is ignored rather than configuring a new line length
.PHONY: python-style-check
python-style-check: ## Check python code style
	pycodestyle . --show-source --ignore=E203,E501,W503 --exclude="./.venv/*","./submodules/"

# requires bandit installed as a command in the current python env
.PHONY: python-security-check
python-security-check: ## Check python for common security issues
	@which bandit > /dev/null 2>&1 || { echo "Error: bandit is not installed. Please run 'pip install bandit' to install it."; exit 1; }
	@echo "Running python bandit security scan on lambda-code..."
	# We skip B113 here because the code is used for lambdas which have an inbuilt timeout already
	bandit -r "./src/aws-lambda/" --exclude "**/tests/**","**/.venv/**" --skip B113
	@echo "Running python bandit security scan on rest of repo..."
	bandit -r . --exclude "**/tests/**","./src/aws-lambda/","**/.venv/**"


## SECTION: Lambda

.PHONY: clean-build-folder
clean-build-folder:
	rm -rf ${BUILD_FOLDER}
	mkdir ${BUILD_FOLDER}

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
lambda-update: ## Update poetry package dependencies of each lambda
	exit_code=0 ; \
	for lambda in $(LAMBDA_LIST) ; do \
		./scripts/poetry-update.sh $$lambda || exit_code=1; \
	done ; \
	exit $$exit_code

.PHONY: run-dependency-scan
run-dependency-scan:
	exit_code=0 ; \
	for TARGET in $${LIST_TO_SCAN} ; do \
		trivy fs "$$FOLDER_PATH/$${TARGET}" --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL --ignorefile ${TRIVY_IGNORE_ABS_PATH} --exit-code 1;\
		error_code=$$? ; \
		if [ $$error_code -ne 0 ]; then \
			echo "vulnerabilities found in $$TARGET" ; \
			exit_code=1; \
		else \
			echo "No vulnerabilities found in $$TARGET" ; \
		fi; \
	done ; \
	exit $$exit_code

.PHONY: python-dependency-scan
python-dependency-scan: ## Scan Python dependencies for vulnerabilities (TARGET=lambda|scripts, or both if not specified)
ifeq ($(TARGET),lambda)
	@echo "Trivy scanning Lambda: $(LAMBDA_LIST)"
	@$(MAKE) run-dependency-scan LIST_TO_SCAN="$(LAMBDA_LIST)" FOLDER_PATH="src/aws-lambda"
else ifeq ($(TARGET),scripts)
	@echo "Trivy scanning Scripts: $(SCRIPTS_LIST)"
	@$(MAKE) run-dependency-scan LIST_TO_SCAN="$(SCRIPTS_LIST)" FOLDER_PATH="scripts"
else ifdef TARGET
	@echo "Error: Invalid TARGET '$(TARGET)'. Use 'lambda' or 'scripts', or omit for both."
	@exit 1
else
	@echo "Scanning both Lambda and Scripts..."
	@$(MAKE) python-dependency-scan TARGET=lambda
	@$(MAKE) python-dependency-scan TARGET=scripts
endif

.PHONY: lambda-package-noclean
lambda-package-noclean: ## Package subset of lambdas without clearing folder (make lambda-package-noclean LAMBDA_LIST=<directory name>)
	for lambda in $(LAMBDA_LIST) ; do \
		./scripts/poetry-package.sh $$lambda || exit=1 ; \
	done

## SECTION: Local Recipes

.PHONY: fmt
fmt: tf-fmt python-fmt npm-fmt npm-lint ## Format all autoformattable code
	@echo "Nice and tidy!"

.PHONY: lint
lint: tf-fmt-check python-lint-all npm-fmt-check npm-lint-check ## Execute all linters 
	@echo "Looks splendid!"

.PHONY: python-lint-all
python-lint-all: python-fmt-check python-style-check ## Perform all python lints
	@echo "All good!"

.PHONY: copy-image-to-poly-ecr
copy-image-to-poly-ecr: guard-IMAGE_TAG guard-BUILD_ENV ## Copy portal image from dev ecr -> <BUILD_ENV> ecr
	$(eval ACCOUNT_ID := $(shell AWS_PROFILE=portal_dev aws sts get-caller-identity --query Account --output text))
	$(eval BUILD_ENV_PREFIX := $(shell if [ "$(BUILD_ENV)" = "dev" ]; then echo ""; else echo "$(BUILD_ENV)-"; fi))
	@echo "Copying image from dev to $(BUILD_ENV) ECR repository, using image tag -> $(IMAGE_TAG)"
	AWS_PROFILE=portal_dev aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin $(ACCOUNT_ID).dkr.ecr.eu-west-2.amazonaws.com
	AWS_PROFILE=portal_dev docker pull $(ACCOUNT_ID).dkr.ecr.eu-west-2.amazonaws.com/portal:$(IMAGE_TAG)
	AWS_PROFILE=portal_dev docker tag $(ACCOUNT_ID).dkr.ecr.eu-west-2.amazonaws.com/portal:$(IMAGE_TAG) $(ACCOUNT_ID).dkr.ecr.eu-west-2.amazonaws.com/$(BUILD_ENV_PREFIX)portal:$(IMAGE_TAG)
	AWS_PROFILE=portal_dev docker push $(ACCOUNT_ID).dkr.ecr.eu-west-2.amazonaws.com/$(BUILD_ENV_PREFIX)portal:$(IMAGE_TAG)

.PHONY: next-build
next-build:
	docker build -t portal portal

.PHONY: next-run-container-locally
next-run-container-locally:
	echo "Warning, this may not set the necessary environment variables correctly!"
	docker run -p 3000:3000 nextjs-docker

.PHONY: portal-banner
portal-banner: ## Execute add portal banner script
	cd scripts/portal_banner;\
	poetry install;\
	poetry run python portal_banner/add_portal_banner_notification.py

.PHONY: portal-banner-test
portal-banner-test: ## Test portal banner script
	cd scripts/portal_banner;\
	poetry run pytest
