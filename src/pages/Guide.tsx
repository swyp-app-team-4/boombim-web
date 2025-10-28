import styles from "./Guide.module.css";

export default function Guide() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>이용 방법</h1>
        <p className={styles.subtitle}>붐빔을 어떻게 사용하는지 알아보세요</p>
      </div>

      <div className={styles.content}>
        {/* 기본 사용법 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>기본 사용법</h2>
          <div className={styles.stepList}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>지도 열기</h3>
                <p className={styles.stepDescription}>
                  상단 메뉴에서 "지도"를 클릭하거나 홈 화면의 "지도 보기" 버튼을
                  클릭하세요.
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>장소 선택</h3>
                <p className={styles.stepDescription}>
                  지도에서 관심 있는 장소를 클릭하여 현재 혼잡도 정보를
                  확인하세요.
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>스마트한 이동</h3>
                <p className={styles.stepDescription}>
                  혼잡도 정보를 바탕으로 최적의 시간에 이동하세요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 혼잡도 표시 방법 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>혼잡도 표시 방법</h2>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.low}`}></div>
              <span className={styles.legendText}>여유 (0-30%)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.normal}`}></div>
              <span className={styles.legendText}>보통 (31-60%)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.crowded}`}></div>
              <span className={styles.legendText}>혼잡 (61-80%)</span>
            </div>
            <div className={styles.legendItem}>
              <div
                className={`${styles.legendColor} ${styles.veryCrowded}`}
              ></div>
              <span className={styles.legendText}>매우 혼잡 (81-100%)</span>
            </div>
          </div>
        </section>

        {/* 필터 사용법 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>필터 사용법</h2>
          <div className={styles.filterInfo}>
            <div className={styles.filterItem}>
              <h3 className={styles.filterTitle}>공식 장소</h3>
              <p className={styles.filterDescription}>
                붐빔에서 공식적으로 제공하는 혼잡도 정보가 있는 장소들입니다.
              </p>
            </div>
            <div className={styles.filterItem}>
              <h3 className={styles.filterTitle}>회원 장소</h3>
              <p className={styles.filterDescription}>
                사용자들이 직접 등록한 장소들로, 실시간 피드백을 받을 수
                있습니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
