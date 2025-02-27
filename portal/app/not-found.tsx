import BackLink from "./shared/backLink";

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p>If you typed the web address, check it is correct.</p>
      <p>
        If you pasted the web address, check that you copied the entire address.
      </p>
      <p>
        If the web address is correct or you selected a link or button, contact
        NHS England on 0300 303 5678, or email{" "}
        <a href="mailto:enquiries@nhsdigital.nhs.uk" target="_blank">
          enquiries@nhsdigital.nhs.uk
        </a>
      </p>
      <BackLink href="/" />
    </>
  );
}
