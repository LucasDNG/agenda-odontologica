import {
  NOTIFICATION_TYPES,
  sendAppointmentNotification,
} from "../services/appointmentNotifications.service.js";

const getNotificationType = (
  req,
  responseBody,
) => {
  if (
    req.method === "POST" &&
    req.path === "/appointments"
  ) {
    return NOTIFICATION_TYPES.CREATED;
  }

  if (
    req.method === "POST" &&
    req.path ===
      "/admin/appointments/overbooked"
  ) {
    return NOTIFICATION_TYPES.CREATED;
  }

  if (
    req.method === "PATCH" &&
    /^\/appointments\/\d+\/cancel$/.test(
      req.path,
    )
  ) {
    return NOTIFICATION_TYPES.CANCELLED;
  }

  if (
    req.method === "PATCH" &&
    /^\/admin\/appointments\/\d+\/reschedule$/.test(
      req.path,
    )
  ) {
    return NOTIFICATION_TYPES.RESCHEDULED;
  }

  if (
    req.method === "PATCH" &&
    /^\/admin\/appointments\/\d+\/restore$/.test(
      req.path,
    )
  ) {
    return NOTIFICATION_TYPES.RESTORED;
  }

  if (
    req.method === "PATCH" &&
    /^\/admin\/appointments\/\d+\/status$/.test(
      req.path,
    ) &&
    req.body?.status ===
      "cancelled"
  ) {
    return NOTIFICATION_TYPES.CANCELLED;
  }

  return null;
};

const getAppointmentId = (
  req,
  responseBody,
) => {
  const bodyId =
    Number(
      responseBody
        ?.appointment?.id,
    );

  if (
    Number.isInteger(bodyId) &&
    bodyId > 0
  ) {
    return bodyId;
  }

  const paramId =
    Number(req.params?.id);

  if (
    Number.isInteger(paramId) &&
    paramId > 0
  ) {
    return paramId;
  }

  const match =
    req.path.match(
      /\/appointments\/(\d+)/,
    );

  if (!match) {
    return null;
  }

  const pathId =
    Number(match[1]);

  return (
    Number.isInteger(pathId) &&
    pathId > 0
  )
    ? pathId
    : null;
};

export const appointmentNotificationsMiddleware =
  (req, res, next) => {
    const originalJson =
      res.json.bind(res);

    res.json = (body) => {
      const statusCode =
        res.statusCode;

      if (
        statusCode >= 200 &&
        statusCode < 300
      ) {
        const type =
          getNotificationType(
            req,
            body,
          );

        const appointmentId =
          getAppointmentId(
            req,
            body,
          );

        if (
          type &&
          appointmentId
        ) {
          setImmediate(() => {
            sendAppointmentNotification({
              appointmentId,
              type,
            }).catch(
              (error) => {
                console.error(
                  "Error enviando notificación automática:",
                  error,
                );
              },
            );
          });
        }
      }

      return originalJson(body);
    };

    next();
  };