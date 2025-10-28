import { Link } from "react-router-dom";
import styles from "./Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* 히어로 섹션 */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            실시간 혼잡도로
            <br />
            <span className={styles.highlight}>스마트한 이동</span>을 시작하세요
          </h1>
          <p className={styles.heroDescription}>
            붐빔은 실시간 혼잡도 정보를 제공하여 더 효율적이고 편안한 이동을
            도와드립니다. 지금 바로 시작해보세요!
          </p>
          <div className={styles.heroActions}>
            <Link to="/map" className={styles.primaryButton}>
              지도 보기
            </Link>
            <button className={styles.secondaryButton}>더 알아보기</button>
          </div>
        </div>
        <div className={styles.heroImage}>
          <div className={styles.mockupContainer}>
            <div className={styles.mockupPhone}>
              <div className={styles.mockupScreen}>
                <div className={styles.mockupMap}>
                  <div className={styles.mockupMarker}></div>
                  <div className={styles.mockupMarker}></div>
                  <div className={styles.mockupMarker}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 소개 섹션 */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>붐빔의 주요 기능</h2>
          <p className={styles.sectionDescription}>
            실시간 혼잡도 정보로 더 스마트한 이동을 경험하세요
          </p>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>실시간 혼잡도</h3>
            <p className={styles.featureDescription}>
              실시간으로 업데이트되는 혼잡도 정보를 통해 가장 적절한 시간과
              장소를 선택하세요.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path
                  fill="currentColor"
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>정확한 예측</h3>
            <p className={styles.featureDescription}>
              AI 기반 알고리즘으로 정확한 혼잡도 예측을 제공하여 계획적인 이동을
              도와드립니다.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>사용자 참여</h3>
            <p className={styles.featureDescription}>
              사용자들의 실시간 피드백을 통해 더욱 정확하고 신뢰할 수 있는
              정보를 제공합니다.
            </p>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>지금 바로 시작하세요!</h2>
          <p className={styles.ctaDescription}>
            실시간 혼잡도 정보로 더 스마트한 이동을 경험해보세요.
          </p>
          <Link to="/map" className={styles.ctaButton}>
            지도 보러가기
          </Link>
        </div>
      </section>
    </div>
  );
}
