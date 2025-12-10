import { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import LoginButton from "./LoginButton";
import LoginModal from "./LoginModal";
import UserAvatar from "./UserAvatar";
import { AuthContext } from "../contexts/AuthContext";
// import appicon from "../assets/appicon.svg";
import boombimLongLogo from "../assets/boombim_long_logo.svg";
import styles from "./TopNav.module.css";

export default function TopNav() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("TopNav must be used within <AuthProvider>");
  const { isAuthed, user, logout } = auth;

  const [showLogin, setShowLogin] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 로그인되면 모달 자동 닫기 (백업 안전장치)
  useEffect(() => {
    if (isAuthed) setShowLogin(false);
  }, [isAuthed]);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const menuContainer = target.closest(`.${styles.userMenuContainer}`);

      if (showUserMenu && !menuContainer) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showUserMenu]);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          {/* 로고 */}
          <NavLink to="/" className={styles.logo}>
            <img
              src={boombimLongLogo}
              alt="BoomBim"
              className={styles.logoIcon}
            />
          </NavLink>

          {/* 햄버거 메뉴 버튼 */}
          <button
            className={styles.mobileMenuToggle}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="메뉴"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              {showMobileMenu ? (
                <path
                  fill="currentColor"
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
              ) : (
                <path
                  fill="currentColor"
                  d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
                />
              )}
            </svg>
          </button>

          {/* 네비게이션 링크 */}
          <div
            className={`${styles.navLinks} ${
              showMobileMenu ? styles.mobileMenuOpen : ""
            }`}
          >
            <NavLink
              to="/"
              className={styles.navLink}
              onClick={() => setShowMobileMenu(false)}
            >
              홈
            </NavLink>
            <NavLink
              to="/map"
              className={styles.navLink}
              onClick={() => setShowMobileMenu(false)}
            >
              지도
            </NavLink>
          </div>

          {/* 검색바 */}
          <div className={styles.searchContainer}>
            <div className={styles.searchBox}>
              <svg
                className={styles.searchIcon}
                viewBox="0 0 24 24"
                width="16"
                height="16"
              >
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search"
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* 사용자 액션 */}
          <div className={styles.userActions}>
            {isAuthed ? (
              <div
                className={styles.userMenuContainer}
                style={{ position: "relative" }}
              >
                <button
                  className={styles.userProfileBtn}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <UserAvatar src={user?.profile} name={user?.name} size={32} />
                  <span className={styles.userName}>
                    {user?.name ?? "사용자"}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    style={{
                      transition: "transform 0.2s ease",
                      transform: showUserMenu
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    <path fill="currentColor" d="M8 10L3 5h10L8 10z" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className={styles.userDropdown}>
                    <div className={styles.userDropdownHeader}>
                      <UserAvatar
                        src={user?.profile}
                        name={user?.name}
                        size={40}
                      />
                      <div className={styles.userDropdownInfo}>
                        <div className={styles.userDropdownName}>
                          {user?.name ?? "사용자"}
                        </div>
                        <div className={styles.userDropdownEmail}>
                          {user?.email ?? ""}
                        </div>
                      </div>
                    </div>
                    <div className={styles.userDropdownDivider}></div>
                    <button
                      className={styles.userDropdownItem}
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <LoginButton onClick={() => setShowLogin(true)} />
            )}
          </div>
        </div>
      </nav>

      {/* 로그인 모달 */}
      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
