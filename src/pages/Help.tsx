import styles from "./Help.module.css";

export default function Help() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>도움말</h1>
        <p className={styles.subtitle}>붐빔 사용 방법을 알아보세요</p>
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
                <h3 className={styles.stepTitle}>장소 확인</h3>
                <p className={styles.stepDescription}>
                  지도에서 관심 있는 장소를 클릭하여 현재 혼잡도 정보를
                  확인하세요.
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>혼잡도 해석</h3>
                <p className={styles.stepDescription}>
                  색상으로 표시된 혼잡도 정보를 확인하여 최적의 방문 시간을
                  선택하세요.
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

        {/* 로그인 관련 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>로그인 및 계정</h2>
          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>로그인이 필요한가요?</h3>
              <p className={styles.faqAnswer}>
                아니요, 로그인 없이도 지도를 보고 혼잡도 정보를 확인할 수
                있습니다. 다만 로그인하면 더 정확한 정보를 제공받을 수 있습니다.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                어떤 방법으로 로그인할 수 있나요?
              </h3>
              <p className={styles.faqAnswer}>
                카카오 계정 또는 네이버 계정으로 간편하게 로그인할 수 있습니다.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                로그인하면 어떤 혜택이 있나요?
              </h3>
              <p className={styles.faqAnswer}>
                로그인하면 개인화된 추천, 즐겨찾기 기능, 그리고 더 정확한 혼잡도
                예측을 받을 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 문제 해결 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>문제 해결</h2>
          <div className={styles.troubleshooting}>
            <div className={styles.troubleItem}>
              <h3 className={styles.troubleTitle}>지도가 로드되지 않아요</h3>
              <p className={styles.troubleSolution}>
                인터넷 연결을 확인하고 페이지를 새로고침해보세요. 문제가
                지속되면 브라우저 캐시를 삭제해보세요.
              </p>
            </div>
            <div className={styles.troubleItem}>
              <h3 className={styles.troubleTitle}>
                혼잡도 정보가 업데이트되지 않아요
              </h3>
              <p className={styles.troubleSolution}>
                혼잡도 정보는 실시간으로 업데이트됩니다. 최신 정보를 보려면
                페이지를 새로고침하거나 잠시 기다려보세요.
              </p>
            </div>
            <div className={styles.troubleItem}>
              <h3 className={styles.troubleTitle}>로그인이 안 돼요</h3>
              <p className={styles.troubleSolution}>
                팝업 차단이 설정되어 있는지 확인하고, 카카오/네이버 계정이
                정상적으로 작동하는지 확인해보세요.
              </p>
            </div>
          </div>
        </section>

        {/* 연락처 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>문의하기</h2>
          <div className={styles.contact}>
            <p className={styles.contactText}>
              추가적인 도움이 필요하시거나 버그를 발견하셨다면 언제든지
              연락해주세요.
            </p>
            <div className={styles.contactInfo}>
              <p>이메일: support@boombim.co.kr</p>
              <p>운영시간: 평일 09:00 - 18:00</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
