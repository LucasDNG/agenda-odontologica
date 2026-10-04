import {
  useEffect,
  useState,
} from "react";

const phoneHref = (phone) =>
  `tel:${String(phone).replace(/[^\d+]/g, "")}`;

function ClinicContact({
  className = "",
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
    return null;
  }

  return (
    <section
      className={`patient-clinic-card ${className}`.trim()}
    >
      <h2>{clinic.name}</h2>

      <dl>
        {clinic.address && (
          <div>
            <dt>Dirección</dt>
            <dd>{clinic.address}</dd>
          </div>
        )}

        {clinic.phone && (
          <div>
            <dt>Teléfono</dt>
            <dd>
              <a href={phoneHref(clinic.phone)}>
                {clinic.phone}
              </a>
            </dd>
          </div>
        )}

        {clinic.email && (
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${clinic.email}`}>
                {clinic.email}
              </a>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

export default ClinicContact;
