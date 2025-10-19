import { useEffect, useRef, useState, useContext } from "react";
import styles from "./MapOverlay.module.css";
import LoginModal from "../components/LoginModal";
import { AuthContext } from "../contexts/AuthContext";
import UserAvatar from "../components/UserAvatar";
import api from "../lib/axios";

type PlaceFilter = "official" | "member" | "both";

export default function Map() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placeFilter, setPlaceFilter] = useState<PlaceFilter>("official");
  const [isLocating, setIsLocating] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const auth = useContext(AuthContext);

  const mapRef = useRef<any | null>(null);
  const overlaysRef = useRef<any[]>([]);
  const userLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const polygonRef = useRef<any | null>(null);
  const idleTimerRef = useRef<any | null>(null);
  const placeFilterRef = useRef<PlaceFilter>("official");

  // latest-request-wins 식별자
  const reqIdRef = useRef(0);

  useEffect(() => {
    placeFilterRef.current = placeFilter;
  }, [placeFilter]);

  useEffect(() => {
    if (auth?.isAuthed && mapRef.current) {
      fetchPlacesForViewport();
    }
  }, [auth?.isAuthed]);

  // 프로필 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const profileContainer = target.closest("[data-profile-menu]");

      if (showProfileMenu && !profileContainer) {
        console.log("외부 클릭 감지 - 메뉴 닫기");
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      // 약간의 지연을 두어 클릭 이벤트가 처리된 후 실행
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 100);

      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showProfileMenu]);

  const moveToCurrentLocation = () => {
    if (!mapRef.current) return;

    setIsLocating(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          userLocRef.current = { lat, lng };

          const moveLatLon = new (window as any).kakao.maps.LatLng(lat, lng);
          mapRef.current.setCenter(moveLatLon);
          mapRef.current.setLevel(3);

          setIsLocating(false);
        },
        () => {
          alert("위치 정보를 가져올 수 없습니다. 위치 권한을 허용해주세요.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
      setIsLocating(false);
    }
  };

  const fetchPlacesForViewport = async () => {
    if (!mapRef.current) return;

    // 새 요청 id 발급
    const myReqId = ++reqIdRef.current;

    try {
      const map = mapRef.current;
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const topLeft = { latitude: ne.getLat(), longitude: sw.getLng() };
      const bottomRight = { latitude: sw.getLat(), longitude: ne.getLng() };
      const center = map.getCenter();
      const memberCoordinate = userLocRef.current
        ? {
            latitude: userLocRef.current.lat,
            longitude: userLocRef.current.lng,
          }
        : { latitude: center.getLat(), longitude: center.getLng() };
      const zoomLevel = map.getLevel();

      const payload = { topLeft, bottomRight, memberCoordinate, zoomLevel };
      let allPlaces: any[] = [];

      if (
        placeFilterRef.current === "official" ||
        placeFilterRef.current === "both"
      ) {
        try {
          const res = await api.post("/web/official-place", payload);
          if (reqIdRef.current !== myReqId) return; // 최신 요청만 반영
          const officialPlaces = res.data?.data ?? [];
          allPlaces = [...allPlaces, ...officialPlaces];
        } catch (e: any) {
          if (e?.code !== "ERR_CANCELED")
            console.error("공식 장소 조회 실패:", e);
        }
      }

      if (
        placeFilterRef.current === "member" ||
        placeFilterRef.current === "both"
      ) {
        try {
          const res = await api.post("/web/member-place", payload);
          if (reqIdRef.current !== myReqId) return;
          const memberPlaces = res.data?.data ?? [];
          allPlaces = [...allPlaces, ...memberPlaces];
        } catch (e: any) {
          if (e?.code !== "ERR_CANCELED")
            console.error("사용자 장소 조회 실패:", e);
        }
      }

      if (reqIdRef.current !== myReqId) return;

      // 기존 오버레이 제거
      overlaysRef.current.forEach((ov) => ov.setMap(null));
      overlaysRef.current = [];

      const getMarkerImage = (congestionLevel: string) => {
        const levelMap: { [key: string]: string } = {
          여유: "/src/assets/markers/congestion-low.png",
          보통: "/src/assets/markers/congestion-normal.png",
          "약간 붐빔": "/src/assets/markers/congestion-crowded.png",
          붐빔: "/src/assets/markers/congestion-very-crowded.png",
        };
        return levelMap[congestionLevel] || levelMap["보통"];
      };

      for (const p of allPlaces) {
        let marker: any;

        if (p.type === "CLUSTER") {
          const clusterSize = p.clusterSize;
          const size = Math.max(40, Math.min(80, 40 + clusterSize * 4));
          const radius = size / 2;

          const clusterImage = new (window as any).kakao.maps.MarkerImage(
            "data:image/svg+xml;base64," +
              btoa(`
              <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
                  </filter>
                </defs>
                <circle cx="${radius}" cy="${radius}" r="${
                radius - 4
              }" fill="#10b981" stroke="#ffffff" stroke-width="4" filter="url(#shadow)"/>
                <circle cx="${radius}" cy="${radius}" r="${
                radius - 8
              }" fill="#10b981" opacity="0.2"/>
                <text x="${radius}" y="${
                radius + 4
              }" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${Math.max(
                12,
                Math.min(16, size / 4)
              )}" font-weight="bold">${clusterSize}</text>
              </svg>
            `),
            new (window as any).kakao.maps.Size(size, size),
            { offset: new (window as any).kakao.maps.Point(radius, radius) }
          );

          marker = new (window as any).kakao.maps.Marker({
            position: new (window as any).kakao.maps.LatLng(
              p.coordinate.latitude,
              p.coordinate.longitude
            ),
            image: clusterImage,
          });
        } else {
          const markerImage = new (window as any).kakao.maps.MarkerImage(
            getMarkerImage(p.congestionLevelName),
            new (window as any).kakao.maps.Size(32, 32),
            { offset: new (window as any).kakao.maps.Point(14, 14) }
          );

          marker = new (window as any).kakao.maps.Marker({
            position: new (window as any).kakao.maps.LatLng(
              p.coordinate.latitude,
              p.coordinate.longitude
            ),
            image: markerImage,
          });
        }

        (window as any).kakao.maps.event.addListener(
          marker,
          "click",
          async () => {
            if (polygonRef.current) {
              polygonRef.current.setMap(null);
              polygonRef.current = null;
            }

            if (p.type === "CLUSTER") {
              const position = new (window as any).kakao.maps.LatLng(
                p.coordinate.latitude,
                p.coordinate.longitude
              );
              mapRef.current.setCenter(position);
              mapRef.current.setLevel(mapRef.current.getLevel() - 2);
              return;
            }

            if (p.placeType === "MEMBER_PLACE") {
              const position = new (window as any).kakao.maps.LatLng(
                p.coordinate.latitude,
                p.coordinate.longitude
              );
              mapRef.current.setCenter(position);
              mapRef.current.setLevel(3);
              return;
            }

            try {
              const res = await api.get(
                `/official-place/${p.officialPlaceId}/overview`
              );
              const data = res.data?.data;

              if (data?.polygonCoordinates) {
                if (polygonRef.current) {
                  polygonRef.current.setMap(null);
                  polygonRef.current = null;
                }

                const coords = JSON.parse(data.polygonCoordinates).map(
                  (coord: number[]) => {
                    const [lng, lat] = coord;
                    return new (window as any).kakao.maps.LatLng(lat, lng);
                  }
                );

                if (data.bounds) {
                  const bounds = new (window as any).kakao.maps.LatLngBounds(
                    new (window as any).kakao.maps.LatLng(
                      data.bounds.south,
                      data.bounds.west
                    ),
                    new (window as any).kakao.maps.LatLng(
                      data.bounds.north,
                      data.bounds.east
                    )
                  );
                  mapRef.current.setBounds(bounds);
                  if (data.recommendedZoomLevel)
                    mapRef.current.setLevel(data.recommendedZoomLevel);
                } else {
                  const bounds = new (window as any).kakao.maps.LatLngBounds();
                  coords.forEach((coord: any) => bounds.extend(coord));
                  mapRef.current.setBounds(bounds);
                }

                const polygon = new (window as any).kakao.maps.Polygon({
                  path: coords,
                  strokeWeight: 4,
                  strokeColor: "#2563eb",
                  strokeOpacity: 1.0,
                  strokeStyle: "solid",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.3,
                });

                polygon.setMap(mapRef.current);
                polygonRef.current = polygon;
              } else {
                const position = new (window as any).kakao.maps.LatLng(
                  p.coordinate.latitude,
                  p.coordinate.longitude
                );
                mapRef.current.setCenter(position);
                mapRef.current.setLevel(3);
              }
            } catch {
              const position = new (window as any).kakao.maps.LatLng(
                p.coordinate.latitude,
                p.coordinate.longitude
              );
              mapRef.current.setCenter(position);
              mapRef.current.setLevel(3);
            }
          }
        );

        marker.setMap(mapRef.current);
        overlaysRef.current.push(marker);
      }
    } catch (e: any) {
      if (e?.code !== "ERR_CANCELED") {
        console.error("장소 데이터 로드 실패:", e);
      }
    }
  };

  const handleIdle = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (mapRef.current) fetchPlacesForViewport();
    }, 250);
  };

  useEffect(() => {
    let isMounted = true;
    let cleanup: (() => void) | null = null;

    const appKey = import.meta.env.VITE_KAKAO_APP_KEY as string | undefined;
    if (!appKey) {
      setError(
        "Kakao 앱 키가 설정되지 않았습니다. .env에 VITE_KAKAO_APP_KEY를 추가하세요."
      );
      return;
    }

    const ensureSdkLoaded = async () => {
      const w = window as any;
      if (w.kakao && w.kakao.maps) return w.kakao;

      if (!w.__kakaoMapsLoadPromise) {
        w.__kakaoMapsLoadPromise = new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            try {
              w.kakao.maps.load(() => resolve());
            } catch (e) {
              reject(e);
            }
          };
          script.onerror = () => reject(new Error("Kakao Maps SDK 로드 실패"));
          document.head.appendChild(script);
        });
      }

      await w.__kakaoMapsLoadPromise;
      return w.kakao;
    };

    const init = async () => {
      try {
        const kakao = await ensureSdkLoaded();
        if (!isMounted || !containerRef.current) return;

        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 5,
        });
        mapRef.current = map;

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const loc = new kakao.maps.LatLng(lat, lng);
              map.setCenter(loc);
              userLocRef.current = { lat, lng };
              fetchPlacesForViewport();
            },
            () => {
              fetchPlacesForViewport();
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        } else {
          fetchPlacesForViewport();
        }

        const handleResize = () => {
          const center = map.getCenter();
          kakao.maps.event.trigger(map, "resize");
          map.setCenter(center);
        };
        window.addEventListener("resize", handleResize);
        kakao.maps.event.addListener(map, "idle", handleIdle);

        cleanup = () => {
          window.removeEventListener("resize", handleResize);
          (window as any).kakao.maps.event.removeListener(
            map,
            "idle",
            handleIdle
          );
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
          overlaysRef.current.forEach((ov) => ov.setMap(null));
          overlaysRef.current = [];
          if (polygonRef.current) {
            polygonRef.current.setMap(null);
            polygonRef.current = null;
          }
          mapRef.current = null;
        };
      } catch (e: any) {
        setError(e?.message ?? "지도를 불러오는 중 오류가 발생했습니다.");
      }
    };

    init();

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, [auth?.isAuthed]);

  useEffect(() => {
    if (mapRef.current) fetchPlacesForViewport();
  }, [placeFilter]);

  if (auth?.loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        로딩 중...
      </div>
    );
  }

  return (
    <section style={{ padding: 0, margin: 0 }}>
      {!auth?.isAuthed ? (
        <LoginModal show={true} onClose={() => {}} />
      ) : error ? (
        <p className="text-danger mb-0" style={{ padding: 12 }}>
          {error}
        </p>
      ) : (
        <div className={styles.root} style={{ height: `100dvh` }}>
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 0,
              overflow: "hidden",
              background: "#f2f2f2",
            }}
          />
          <div className={styles.overlay}>
            <div className={styles.loginWrap}>
              {auth?.isAuthed ? (
                <div style={{ position: "relative" }} data-profile-menu>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("프로필 클릭됨, 현재 상태:", showProfileMenu);
                      setShowProfileMenu((prev) => {
                        console.log("상태 변경:", prev, "→", !prev);
                        return !prev;
                      });
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      height: 40,
                      padding: "0 10px",
                      background: "#ffffff",
                      borderRadius: 12,
                      boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                      pointerEvents: "auto",
                      cursor: "pointer",
                    }}
                  >
                    <UserAvatar
                      src={auth.user?.profile}
                      name={auth.user?.name}
                      size={26}
                    />
                    <span style={{ fontWeight: 700 }}>
                      {auth.user?.name ?? "사용자"}
                    </span>
                    <span style={{ fontSize: "12px", color: "#666" }}>▼</span>
                  </div>

                  {showProfileMenu && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: "8px",
                        background: "#ffffff",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        minWidth: "120px",
                        zIndex: 1000,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          auth.logout();
                          setShowProfileMenu(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "none",
                          background: "transparent",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: "#333",
                          borderBottom: "1px solid #eee",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f8f9fa";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* 필터 버튼 */}
            <div
              style={{
                position: "absolute",
                top: 20,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 8,
                pointerEvents: "auto",
              }}
            >
              <button
                onClick={() => setPlaceFilter("official")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: "none",
                  background:
                    placeFilter === "official" ? "#2563eb" : "#ffffff",
                  color: placeFilter === "official" ? "#ffffff" : "#374151",
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                공식 장소
              </button>
              <button
                onClick={() => setPlaceFilter("member")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: "none",
                  background: placeFilter === "member" ? "#2563eb" : "#ffffff",
                  color: placeFilter === "member" ? "#ffffff" : "#374151",
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                사용자 장소
              </button>
              <button
                onClick={() => setPlaceFilter("both")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: "none",
                  background: placeFilter === "both" ? "#2563eb" : "#ffffff",
                  color: placeFilter === "both" ? "#ffffff" : "#374151",
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                전체
              </button>
            </div>

            {/* 현재 위치 버튼 */}
            <div
              style={{
                position: "absolute",
                top: 80,
                right: 20,
                pointerEvents: "auto",
              }}
            >
              <button
                onClick={moveToCurrentLocation}
                disabled={isLocating}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  border: "none",
                  background: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  cursor: isLocating ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isLocating ? 0.6 : 1,
                }}
                title="현재 위치로 이동"
              >
                {isLocating ? (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      border: "2px solid #e5e7eb",
                      borderTop: "2px solid #3b82f6",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="10" cy="10" r="3" fill="#374151" />
                    <circle
                      cx="10"
                      cy="10"
                      r="6"
                      stroke="#374151"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <line
                      x1="10"
                      y1="2"
                      x2="10"
                      y2="6"
                      stroke="#374151"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="10"
                      y1="14"
                      x2="10"
                      y2="18"
                      stroke="#374151"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="2"
                      y1="10"
                      x2="6"
                      y2="10"
                      stroke="#374151"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="14"
                      y1="10"
                      x2="18"
                      y2="10"
                      stroke="#374151"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
