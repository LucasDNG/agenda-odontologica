import {
  useEffect,
  useState,
} from "react";

const phoneHref = (phone) =>
  `tel:${String(phone).replace(/[^\d+]/g, "")}`;

function IconTooth() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.2 4.4c1-.9 2.2-1.4 3.8-1.4s2.8.5 3.8 1.4c1.2 1.1 2 2.7 1.8 4.6-.2 2.2-.8 4.3-.5 6.3.3 1.8-.4 3.4-1.8 3.7-1 .2-1.8-.7-2.2-1.9-.4-1-.9-1.3-1.6-1.3s-1.2.3-1.6 1.3c-.4 1.2-1.2 2.1-2.2 1.9-1.4-.3-2.1-1.9-1.8-3.7.3-2 .0-4.1-.5-6.3-.2-1.9.6-3.5 1.8-4.6z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="11" r="2.1" fill="currentColor" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.2 4.8h2.1l1.1 3.2-1.5 1a12 12 0 0 0 5.1 5.1l1-1.5 3.2 1.1v2.1c0 .8-.6 1.5-1.4 1.6A14.2 14.2 0 0 1 6.6 6.2c.1-.8.8-1.4 1.6-1.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 7.5 12 13l7.5-5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClinicContact({
  className = "",
  titleTag = "h2",
  children,
}) {
  const [clinic, setClinic] =
    useState(null);

  useEffect(() => {
    let active = true;

    const loadClinic = async () => {
      try {
        const response = await fetch(
          "/api/clinic",
        );

        const data = await response.json();

        if (!response.ok || !active) {
          return;
        }

        setClinic(data.clinic || null);
      } catch (error) {
        console.error(error);
      }
    };

    loadClinic();

    return () => {
      active = false;
    };
  }, []);

  if (!clinic?.name) {
    return children || null;
  }

  const Title =
    titleTag === "h1" ? "h1" : "h2";

  return (
    <section
      className={`patient-clinic-card ${className}`.trim()}
    >
      <div className="patient-clinic-identity">
        {titleTag === "h1" && (
          <div className="patient-auth-mark">
            <IconTooth />
          </div>
        )}

        <Title className="patient-clinic-title">
          {clinic.name}
        </Title>

        {children}
      </div>

      <ul className="patient-clinic-facts">
        {clinic.address && (
          <li>
            <span className="patient-clinic-fact-icon">
              <IconPin />
            </span>
            <span>
              <small>Dirección</small>
              <span>{clinic.address}</span>
            </span>
          </li>
        )}

        {clinic.phone && (
          <li>
            <span className="patient-clinic-fact-icon">
              <IconPhone />
            </span>
            <span>
              <small>Teléfono</small>
              <a href={phoneHref(clinic.phone)}>
                {clinic.phone}
              </a>
            </span>
          </li>
        )}

        {clinic.email && (
          <li>
            <span className="patient-clinic-fact-icon">
              <IconMail />
            </span>
            <span>
              <small>Email</small>
              <a href={`mailto:${clinic.email}`}>
                {clinic.email}
              </a>
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}

export default ClinicContact;
