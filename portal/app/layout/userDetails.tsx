import { getServerSession } from "next-auth";
import LogoutButton from "./logoutButton";

import layoutStyles from "./layout.module.css";

export default async function UserDetails() {
  const session = await getServerSession();

  if (!session) return null;

  return (
    <div className={layoutStyles.userDetails}>
      <span className={layoutStyles.loggedInAs}>
        Logged in as {session.user?.name}
      </span>
      <LogoutButton />
    </div>
  );
}
