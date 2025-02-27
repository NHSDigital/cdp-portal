FROM cypress/browsers:node-20.11.1-chrome-123.0.6312.58-1-ff-124.0-edge-122.0.2365.92-1

# install dependencies
RUN apt-get update -y && apt-get install -y make zip unzip python3 jq curl

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm awscliv2.zip

ENTRYPOINT []
