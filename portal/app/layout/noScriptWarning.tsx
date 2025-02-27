export default function NoScriptWarning() {
  return (
    <noscript>
      <div className="nhsuk-warning-callout">
        <h3 className="nhsuk-warning-callout__label">
          <span role="text">
            <span className="nhsuk-u-visually-hidden">Important: </span>
            JavaScript Not Enabled
          </span>
        </h3>
        <p>
          JavaScript is not enabled on your browser, you may have a worse
          browsing experience as a result. Furthermore, the virtual desktop does
          not work without JavaScript.
        </p>
      </div>
    </noscript>
  );
}
