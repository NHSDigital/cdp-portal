import os
from aws_synthetics.selenium import synthetics_webdriver as syn_webdriver
from aws_synthetics.common import synthetics_logger as logger
from aws_synthetics.common import synthetics_configuration


def url_heartbeat_monitor():
    URL = os.getenv("PORTAL_URL")

    synthetics_configuration.set_config(
        {
            "screenshot_on_step_start": False,
            "screenshot_on_step_success": False,
            "screenshot_on_step_failure": True,
        }
    )

    browser = syn_webdriver.Chrome()
    try:
        browser.get(URL)
    except Exception as err:
        logger.error(f"Get {URL} failed, Error: {err}")

    status_code = syn_webdriver.get_http_response(URL)
    if not status_code or status_code == "error":
        raise Exception(f"Failed to get {URL}")
    logger.info(f"Get {URL} successful")


def handler(event, context):
    return url_heartbeat_monitor()
