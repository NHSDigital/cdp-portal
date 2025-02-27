import NotificationBanner from "../../components/NotificationsBanner";
import getNotifications from "../../services/getNotifications";

export default async function Notifications() {
  const notificationItems = await getNotifications();

  return (
    <>
      {notificationItems.map((notice) => (
        <NotificationBanner
          notification={notice.notification}
          colour={notice.colour}
          key={notice.noticeId}
        />
      ))}
    </>
  );
}
