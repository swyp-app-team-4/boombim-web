import styles from "./Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        실시간 혼잡도로 스마트한 이동을 시작하세요
      </h1>

      <div className={styles.downloadSection}>
        <div className={styles.downloadButtons}>
          <a
            href="https://play.google.com/store/apps/details?id=com.boombim.android"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.downloadButton}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z"
                fill="#4285F4"
              />
              <path
                d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z"
                fill="#34A853"
              />
              <path
                d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.19 15.53L14.54 12.85L17.19 10.16L20.16 10.81Z"
                fill="#FBBC04"
              />
              <path
                d="M3.84 2.15L13.69 12L6.05 2.66L3.84 2.15Z"
                fill="#EA4335"
              />
            </svg>
            Google Play
          </a>
          <a
            href="https://apps.apple.com/kr/app/%EB%B6%90%EB%B9%94-boombim/id6751637320"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.downloadButton}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="#000000"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            App Store
          </a>
        </div>
      </div>

      <div className={styles.featureGrid}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className={styles.featureTitle}>실시간 업데이트</h3>
          <p className={styles.featureDescription}>
            실시간으로 업데이트되는 혼잡도 정보를 통해 가장 적절한 시간과 장소를
            선택하세요.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className={styles.featureTitle}>사용자 참여</h3>
          <p className={styles.featureDescription}>
            사용자들의 실시간 피드백을 통해 더욱 정확하고 신뢰할 수 있는 정보를
            제공합니다.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h3 className={styles.featureTitle}>위치 기반 검색</h3>
          <p className={styles.featureDescription}>
            현재 위치를 기반으로 주변 장소의 혼잡도를 빠르게 확인할 수 있습니다.
          </p>
        </div>
      </div>

      <div className={styles.serviceSection}>
        <h2 className={styles.serviceTitle}>두 가지 혼잡도 정보</h2>
        <div className={styles.serviceGrid}>
          <div className={styles.serviceCard}>
            <h3 className={styles.serviceCardTitle}>오픈 서울</h3>
            <p className={styles.serviceCardDescription}>
              서울 열린데이터광장에서 제공하는 실시간 혼잡도 정보입니다.
              연령대별 인구수와 시간대별 예상 인구수를 포함한 상세한 데이터를
              제공합니다.
            </p>
          </div>

          <div className={styles.serviceCard}>
            <h3 className={styles.serviceCardTitle}>현장 피드</h3>
            <p className={styles.serviceCardDescription}>
              사용자들이 직접 공유한 실시간 혼잡도 정보입니다. 현장에서의 생생한
              경험을 바탕으로 한 신뢰할 수 있는 정보를 제공합니다. 혼잡도는
              여유, 보통, 약간 붐빔, 붐빔 4단계로 나눠서 제공됩니다.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.howToSection}>
        <h2 className={styles.howToTitle}>이용 방법</h2>

        <div className={styles.howToGrid}>
          <div className={styles.howToCard}>
            <div className={styles.howToIcon}>
              <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3 className={styles.howToCardTitle}>혼잡도 보기</h3>
            <div className={styles.howToSteps}>
              <div className={styles.howToStep}>
                <span className={styles.stepNumber}>1</span>
                <p className={styles.stepText}>
                  상단 메뉴에서 "지도"를 클릭하거나 홈 화면의 "지도 보기" 버튼을
                  클릭하세요.
                </p>
              </div>
              <div className={styles.howToStep}>
                <span className={styles.stepNumber}>2</span>
                <p className={styles.stepText}>
                  지도에서 관심 있는 장소를 클릭하여 현재 혼잡도 정보를
                  확인하세요.
                </p>
              </div>
              <div className={styles.howToStep}>
                <span className={styles.stepNumber}>3</span>
                <p className={styles.stepText}>
                  "오픈 서울"과 "현장 피드" 필터를 통해 원하는 정보를 선택할 수
                  있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.howToCard}>
            <div className={styles.howToIcon}>
              <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className={styles.howToCardTitle}>혼잡도 공유하기</h3>
            <div className={styles.howToSteps}>
              <div className={styles.howToStep}>
                <span className={styles.stepNumber}>1</span>
                <p className={styles.stepText}>
                  지도에서 공유하고 싶은 장소를 검색하거나 선택하세요.
                </p>
              </div>
              <div className={styles.howToStep}>
                <span className={styles.stepNumber}>2</span>
                <p className={styles.stepText}>
                  장소 상세 정보에서 "혼잡도 공유하기" 버튼을 클릭하세요.
                </p>
              </div>
              <div className={styles.howToStep}>
                <span className={styles.stepNumber}>3</span>
                <p className={styles.stepText}>
                  현재 혼잡도를 여유, 보통, 약간 붐빔, 붐빔 중에서 선택하고
                  공유하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
