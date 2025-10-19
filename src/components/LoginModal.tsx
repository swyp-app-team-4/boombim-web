import { useContext } from "react";
import { Modal } from "react-bootstrap";
import styles from "./LoginModal.module.css";
import loginIllustration from "../assets/boombim_login.png";
import kakaoIcon from "../assets/kakao-icon.svg";
import naverIcon from "../assets/naver-icon.svg";
import { AuthContext } from "../contexts/AuthContext";

type Props = { show: boolean; onClose: () => void };

export default function LoginModal({ show, onClose }: Props) {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("LoginModal must be used within <AuthProvider>");
  const { startOauthPopup } = auth;

  return (
    <Modal
      className={styles.modal}
      dialogClassName={styles.modalDialog}
      contentClassName={styles.modalContent}
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
      size="lg"
    >
      <button className={styles.close} aria-label="닫기" onClick={onClose}>
        ×
      </button>

      <div className={styles.body}>
        <h1 className={styles.title}>
          지금 바로
          <br />
          <span className={styles.highlight}>붐빔</span>을 확인하세요
        </h1>
        <div className={styles.image}>
          <img src={loginIllustration} alt="" />
        </div>
        <div className={styles.badge}>3초 만에 바로 시작</div>
        <button
          className={`${styles.btn} ${styles.kakao}`}
          onClick={async () => {
            const result = await startOauthPopup("kakao");
            if (result === "success") {
              onClose();
            }
          }}
          type="button"
        >
          <img src={kakaoIcon} alt="카카오" className={styles.icon} />
          카카오로 시작하기
        </button>
        <button
          className={`${styles.btn} ${styles.naver}`}
          onClick={async () => {
            const result = await startOauthPopup("naver");
            if (result === "success") {
              onClose();
            }
          }}
          type="button"
        >
          <img src={naverIcon} alt="네이버" className={styles.icon} />
          네이버로 시작하기
        </button>
      </div>
    </Modal>
  );
}
