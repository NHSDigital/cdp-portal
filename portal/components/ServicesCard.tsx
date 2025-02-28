import React from "react";
import { useRouter } from "next/router";
import { Card, ChevronRightIcon } from "nhsuk-react-components";

interface ServiceProps {
  title: string;
  description: string;
  href: string;
  new_window?: boolean;
}

interface TitleLinkProps {
  title: string;
  href: string;
}

function ServiceCard({ title, description, href, new_window }: ServiceProps) {
  const router = useRouter();

  const handleClick = (e) => {
    e.preventDefault();
    if (new_window === true) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
  };

  const TitleLink = ({ title, href }: TitleLinkProps) => {
    return (
      <a href={href} className="nhsuk-card__link" onClick={handleClick}>
        {title}
      </a>
    );
  };

  return (
    <ul className="nhsuk-grid-row nhsuk-card-group">
      <li className="nhsuk-grid-column-one-half nhsuk-card-group__item">
        <Card clickable onClick={handleClick}>
          <div className="nhsuk-card__content">
            <div className="nhsuk-card__heading nhsuk-heading-m">
              <TitleLink title={title} href={href}></TitleLink>
            </div>
            <div
              className="nhsuk-card__description"
              style={{ display: "flex" }}
            >
              {description}
              <div className="beta-hub-arrow" style={{ paddingLeft: 20 }}>
                <ChevronRightIcon></ChevronRightIcon>
              </div>
            </div>
          </div>
        </Card>
      </li>
    </ul>
  );
}

export default ServiceCard;
