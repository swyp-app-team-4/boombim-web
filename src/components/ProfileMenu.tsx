import { useContext } from "react";
import { Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import UserAvatar from "./UserAvatar";

export default function ProfileMenu() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("ProfileMenu must be used within <AuthProvider>");
  const { user, logout, loading } = auth;

  const avatar = (
    <span className="d-inline-flex align-items-center gap-2">
      <UserAvatar src={user?.profile} name={user?.name} size={28} />
      <span className="text-white-50 d-none d-md-inline">
        {user?.name ?? "사용자"}
      </span>
    </span>
  );

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        id="profile-menu"
        variant="link"
        className="text-decoration-none text-reset p-0 border-0"
      >
        {avatar}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Header>{user?.name ?? "사용자"}</Dropdown.Header>
        <Dropdown.Divider />
        {/* 마이페이지가 있다면 경로 연결 */}
        <Dropdown.Item as={Link} to="/mypage">
          마이 페이지
        </Dropdown.Item>
        <Dropdown.Item as={Link} to="/settings">
          설정
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={() => logout()} disabled={loading}>
          {loading ? "로그아웃 중..." : "로그아웃"}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
