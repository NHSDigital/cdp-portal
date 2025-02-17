# Portal

This repository manages and creates the resources for the portal for the SDE platform.

> This repository is currently **not** accepting open source contributions. If you discover any serious issues, please contact england.sdeplatform@nhs.net

### Repository Overview

### File structure

```
.
├── portal (Contains the Next.js code for the website)
├── scripts (contains individual scripts for running locally or on the CI pipeline)
├── src
│   └── aws-lambda (contains the code for our lambda functions)
│   └── docker (contains the code for our docker images that run Cypress tests)
└── terraform
    ├── modules (contains our reusable terraform modules)
    ├── root_modules (contain the base modules for each terraform layer)
    ├── shared (contain shared variable definition and local variable files)
    └── vars (contain the variable files that define the parameters for each environment)
```

### Architecture

The aim of this repository is to create a web portal for the Secure Data Environment (SDE). SDE Portal is the webpage that users first interact with when entering SDE.

To do this, we build & store the portal docker image in ECR and then deploy the website on ECS fronted by a load-balancer.

Below you can see the architecture diagram:

![Portal Architecture Diagram](./docs/Portal-Design.drawio.svg)

## Local setup

The easiest way to set up your local dev env is to use asdf. After getting it set up, you can add the plugins for each tool listed in .tool-versions, and then run `asdf install` to install the correct versions. From then, any commands requiring those tools will use the correct versions. See https://asdf-vm.com/ for more instructions.

You must also have AWS configured for the relevant account.

There may also be other command line utilities that are needed. Please look out for bash warnings about missing tools.

Note: our code is designed to run on bash (including inside WSL). Other OS may not work.

### Pre-commit install

Installation steps can be found here https://pre-commit.com/

./scripts/git_secrets_download.sh
sudo ./scripts/git_secrets_install.sh
then
pip install pre-commit or brew install pre-commit
pre-commit install

1. **Create an S3 bucket and DynamoDB table for your terraform state**

    The bucket and the table must have the same name. There should be one bucket for each environment. Once you have a name, put the bucket name in a file called `backend_config.json` in the root of the repo, following this format:

    ```
    {
     "environment_name": "bucket/dynamodb table name",
     "dev": "sde-tfstate-dev",
     "test": "sde-tfstate-test"
    }
    ```

2. **Package the lambdas**

    First, install the poetry pre-requisites by running the command `apt-get update && apt-get install -y make zip curl` and then `pip install -Iv poetry==$POETRY_VERSION`. Refer to the asdf tool versions file for versions of Poetry and other tools.

    The lambdas can be packaged by running the command `make lambda-package`.

3. **Push the portal website Docker Image to ECR**

    In this step, we will compile the Next.js website and then put this inside a Docker image.
    We will then push this to ECR.

    After configuring your AWS CLI to use the correct AWS environment, run:

    ```
    export IMAGE_TAG=$(git rev-parse --short=8 HEAD)
    export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    export IMAGE_NAME=${AWS_ACCOUNT_ID}.dkr.ecr.eu-west-2.amazonaws.com/portal:${IMAGE_TAG}
    docker build -t ${IMAGE_NAME} portal/
    docker push ${IMAGE_NAME}
    ```

4. **Create the tfvars file**

    You need to create some tfvars files in [the variables folder](./terraform/vars/). `common.tfvars` must exist, and is a tfvars file that is loaded for all your environments. Then for each environment you want to create (dev, test, int, prod, beta, whatever you want to call your environment) you must create a file with the environment name as the file name + `.tfvars`.

    You must populate these files with your own custom values. You can find the descriptions of the variables in [the variables file](./terraform/shared/variables.tf).

    - [Example Common Variables File](./terraform/vars/example_common.tfvars)
    - [Example Environment Variables File](./terraform/vars/example.tfvars)
