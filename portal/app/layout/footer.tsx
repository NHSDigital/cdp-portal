export default function Footer() {
  return (
    <footer role="contentinfo">
      <div className="nhsuk-footer-container">
        <div className="nhsuk-width-container">
          <h2 className="nhsuk-u-visually-hidden">Support links</h2>
          <div className="nhsuk-footer">
            <ul className="nhsuk-footer__list">
              <li className="nhsuk-footer__list-item nhsuk-footer-default__list-item">
                <a
                  className="nhsuk-footer__list-item-link"
                  href="https://www.nhs.uk/nhs-sites/"
                >
                  NHS sites
                </a>
              </li>
              <li className="nhsuk-footer__list-item nhsuk-footer-default__list-item">
                <a
                  className="nhsuk-footer__list-item-link"
                  href="https://www.nhs.uk/about-us/"
                >
                  About us
                </a>
              </li>
              <li className="nhsuk-footer__list-item nhsuk-footer-default__list-item">
                <a
                  className="nhsuk-footer__list-item-link"
                  href="https://www.nhs.uk/contact-us/"
                >
                  Contact us
                </a>
              </li>
              <li className="nhsuk-footer__list-item nhsuk-footer-default__list-item">
                <a
                  className="nhsuk-footer__list-item-link"
                  href="https://digital.nhs.uk/services/secure-data-environment-service/log-in/user-guides/accessibility-statement/"
                >
                  Accessibility statement (opens in a new window)
                </a>
              </li>
              <li className="nhsuk-footer__list-item nhsuk-footer-default__list-item">
                <a
                  className="nhsuk-footer__list-item-link"
                  href="https://www.nhs.uk/our-policies/"
                >
                  Our policies
                </a>
              </li>
            </ul>
            <div>
              <p className="nhsuk-footer__copyright">&copy; NHS England</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
