import { useContext, useEffect, useState } from "react";
import { Navbar, Container, Nav, Dropdown } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import appicon from "../assets/appicon.svg";
import LoginButton from "./LoginButton";
import LoginModal from "./LoginModal";
import UserAvatar from "./UserAvatar";
import { AuthContext } from "../contexts/AuthContext";

export default function TopNav() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("TopNav must be used within <AuthProvider>");
  const { isAuthed, user, logout } = auth;

  const [showLogin, setShowLogin] = useState(false);

  // 로그인되면 모달 자동 닫기 (백업 안전장치)
  useEffect(() => {
    if (isAuthed) setShowLogin(false);
  }, [isAuthed]);

  return (
    <>
      <Navbar expand="md" bg="dark" data-bs-theme="dark" className="mb-3">
        <Container>
          <Navbar.Brand
            as={NavLink}
            to="/"
            className="d-flex align-items-center"
          >
            <img
              alt="BoomBim"
              src={appicon}
              width={28}
              height={28}
              className="d-inline-block align-top me-2"
            />
            BoomBim
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            {/* 브랜드 오른쪽에 붙는 내비 */}
            <Nav className="ms-md-3 me-auto">
              <Nav.Link as={NavLink} to="/" end>
                Home
              </Nav.Link>
              <Nav.Link as={NavLink} to="/map">
                Map
              </Nav.Link>
            </Nav>

            {/* 우측: 로그인 전/후 스왑 */}
            <Nav className="ms-auto align-items-center">
              {isAuthed ? (
                <Dropdown align="end">
                  <Dropdown.Toggle
                    id="profile-menu"
                    variant="link"
                    className="text-decoration-none text-reset p-0 border-0"
                  >
                    <span className="d-inline-flex align-items-center gap-2">
                      <UserAvatar
                        src={user?.profile}
                        name={user?.name}
                        size={28}
                      />
                      <span className="text-white-50 d-none d-md-inline">
                        {user?.name ?? "사용자"}
                      </span>
                    </span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Header>{user?.name ?? "사용자"}</Dropdown.Header>
                    <Dropdown.Divider />
                    {/* 필요 시 라우트 연결 */}
                    <Dropdown.Item as={NavLink} to="/mypage">
                      마이 페이지
                    </Dropdown.Item>
                    <Dropdown.Item as={NavLink} to="/settings">
                      설정
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={logout}>로그아웃</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <LoginButton onClick={() => setShowLogin(true)} />
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* 로그인 모달 */}
      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
