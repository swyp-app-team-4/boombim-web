import { useEffect, useRef, useState, useContext } from "react";
import styles from "./MapOverlay.module.css";
import { AuthContext } from "../contexts/AuthContext";
import api from "../lib/axios";
import congestionLow from "../assets/markers/congestion-low.png";
import congestionNormal from "../assets/markers/congestion-normal.png";
import congestionCrowded from "../assets/markers/congestion-crowded.png";
import congestionVeryCrowded from "../assets/markers/congestion-very-crowded.png";
import LoginModal from "../components/LoginModal";

type PlaceFilter = "official" | "member" | "both";

export default function Map() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("Map must be used within <AuthProvider>");

  const [error, setError] = useState<string | null>(null);
  const [placeFilter, setPlaceFilter] = useState<PlaceFilter>("official");
  const [isLocating, setIsLocating] = useState(false);
  const [favoritePlaces, setFavoritePlaces] = useState<any[]>([]);
  const [quietSpots, setQuietSpots] = useState<any[]>([]);
  const [busySpots, setBusySpots] = useState<any[]>([]);
  const [favoritePage, setFavoritePage] = useState(0);
  const [favoriteTab, setFavoriteTab] = useState<"official" | "member">(
    "official"
  );
  const [isClusteringEnabled, setIsClusteringEnabled] = useState(true);
  const isClusteringEnabledRef = useRef(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(320);

  // 장소 상세 패널
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [showPlaceDetail, setShowPlaceDetail] = useState(false);
  const [showForecastAsGraph, setShowForecastAsGraph] = useState(false);

  // 혼잡도 공유 관련
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlaceForConfirm, setSelectedPlaceForConfirm] =
    useState<any>(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedCongestionLevel, setSelectedCongestionLevel] =
    useState<string>("");
  const [comment, setComment] = useState("");
  const [memberPlaceId, setMemberPlaceId] = useState<number | null>(null);

  const mapRef = useRef<any | null>(null);
  const overlaysRef = useRef<any[]>([]);
  const userLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const polygonRef = useRef<any | null>(null);

  // ⬇️ 여기를 StaticMap 용도로 재사용
  const confirmModalMapRef = useRef<any | null>(null);
  const confirmModalMapContainerRef = useRef<HTMLDivElement | null>(null);
  const voteModalMapRef = useRef<any | null>(null);
  const voteModalMapContainerRef = useRef<HTMLDivElement | null>(null);

  const idleTimerRef = useRef<any | null>(null);
  const placeFilterRef = useRef<PlaceFilter>("official");
  const polygonBlinkIntervalRef = useRef<any | null>(null);

  // latest-request-wins 식별자
  const reqIdRef = useRef(0);
  const overviewReqIdRef = useRef(0);
  const searchTimeoutRef = useRef<any>(null);

  // 폴리곤 깜빡임 애니메이션
  const startPolygonBlink = () => {
    if (polygonBlinkIntervalRef.current) return;
    const polygon = polygonRef.current;
    if (!polygon) return;
    let opacity = 0.2;
    let increasing = true;
    polygonBlinkIntervalRef.current = setInterval(() => {
      if (!polygon || !polygon.getMap()) {
        stopPolygonBlink();
        return;
      }
      if (increasing) {
        opacity += 0.05;
        if (opacity >= 0.5) {
          opacity = 0.5;
          increasing = false;
        }
      } else {
        opacity -= 0.05;
        if (opacity <= 0.2) {
          opacity = 0.2;
          increasing = true;
        }
      }
      polygon.setOptions({
        fillOpacity: opacity,
        strokeOpacity: opacity < 0.3 ? 0.6 : 0.8,
      });
    }, 100);
  };

  const stopPolygonBlink = () => {
    if (polygonBlinkIntervalRef.current) {
      clearInterval(polygonBlinkIntervalRef.current);
      polygonBlinkIntervalRef.current = null;
    }
  };

  // 페이지 스크롤바 숨김
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    placeFilterRef.current = placeFilter;
  }, [placeFilter]);

  useEffect(() => {
    if (mapRef.current) fetchPlacesForViewport();
  }, []);

  // 즐겨찾기 조회
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!auth?.isAuthed) {
        setFavoritePlaces([]);
        return;
      }
      try {
        const res = await api.get("/web/favorite");
        setFavoritePlaces(res.data?.data ?? []);
      } catch (error: any) {
        console.error("즐겨찾기 조회 실패:", error);
        setFavoritePlaces([]);
      }
    };
    fetchFavorites();
  }, [auth?.isAuthed]);

  // ✅ 확인 모달 지도: StaticMap 사용 (비인터랙티브)
  useEffect(() => {
    if (!showConfirmModal || !selectedPlaceForConfirm) return;

    const kakao = (window as any).kakao;
    if (confirmModalMapContainerRef.current && kakao?.maps) {
      // 기존 StaticMap 제거
      if (confirmModalMapRef.current) {
        confirmModalMapRef.current = null;
        // 컨테이너 비우기
        confirmModalMapContainerRef.current.innerHTML = "";
      }

      const lat = parseFloat(selectedPlaceForConfirm.y);
      const lng = parseFloat(selectedPlaceForConfirm.x);

      const staticMapOption = {
        center: new kakao.maps.LatLng(lat, lng),
        level: 3,
        marker: {
          position: new kakao.maps.LatLng(lat, lng),
        },
      };

      const staticMap = new kakao.maps.StaticMap(
        confirmModalMapContainerRef.current,
        staticMapOption
      );

      confirmModalMapRef.current = staticMap;

      // 클린업
      return () => {
        if (confirmModalMapRef.current) {
          confirmModalMapRef.current = null;
        }
        if (confirmModalMapContainerRef.current) {
          confirmModalMapContainerRef.current.innerHTML = "";
        }
      };
    }
  }, [showConfirmModal, selectedPlaceForConfirm]);

  // ✅ 투표 모달 지도: StaticMap 사용 (비인터랙티브)
  useEffect(() => {
    if (!showVoteModal || !selectedPlaceForConfirm) return;

    const kakao = (window as any).kakao;
    if (voteModalMapContainerRef.current && kakao?.maps) {
      // 기존 StaticMap 제거
      if (voteModalMapRef.current) {
        voteModalMapRef.current = null;
        voteModalMapContainerRef.current.innerHTML = "";
      }

      const lat = parseFloat(selectedPlaceForConfirm.y);
      const lng = parseFloat(selectedPlaceForConfirm.x);

      const staticMapOption = {
        center: new kakao.maps.LatLng(lat, lng),
        level: 3,
        marker: {
          position: new kakao.maps.LatLng(lat, lng),
        },
      };

      const staticMap = new kakao.maps.StaticMap(
        voteModalMapContainerRef.current,
        staticMapOption
      );

      voteModalMapRef.current = staticMap;

      // 클린업
      return () => {
        if (voteModalMapRef.current) {
          voteModalMapRef.current = null;
        }
        if (voteModalMapContainerRef.current) {
          voteModalMapContainerRef.current.innerHTML = "";
        }
      };
    }
  }, [showVoteModal, selectedPlaceForConfirm]);

  // 한적한 스팟 조회
  useEffect(() => {
    const fetchQuietSpots = async () => {
      try {
        if (!userLocation) {
          const res = await api.get(
            "/web/public/official-place/nearby-non-congested",
            {
              params: { latitude: 37.5665, longitude: 126.978 },
            }
          );
          setQuietSpots(res.data?.data ?? []);
          return;
        }
        const { lat, lng } = userLocation;
        const res = await api.get(
          "/web/public/official-place/nearby-non-congested",
          {
            params: { latitude: lat, longitude: lng },
          }
        );
        setQuietSpots(res.data?.data ?? []);
      } catch (error: any) {
        console.error("한적한 스팟 조회 실패:", error);
        setQuietSpots([]);
      }
    };
    fetchQuietSpots();
  }, [userLocation]);

  // 붐비는 스팟 조회
  useEffect(() => {
    const fetchBusySpots = async () => {
      try {
        const res = await api.get("/web/public/official-place/top-congested");
        setBusySpots(res.data?.data ?? []);
      } catch (error: any) {
        console.error("붐비는 장소 조회 실패:", error);
        setBusySpots([]);
      }
    };
    fetchBusySpots();
  }, []);

  const moveToCurrentLocation = () => {
    if (!mapRef.current) return;
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          userLocRef.current = { lat, lng };
          setUserLocation({ lat, lng });
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

  const handleShareCongestion = () => {
    if (!auth?.isAuthed) {
      setShowLoginModal(true);
      return;
    }
    setShowSearchModal(true);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleConfirmPlace = async () => {
    if (!selectedPlaceForConfirm) return;

    try {
      const response = await api.post("/web/member-place/resolve", {
        uuid: selectedPlaceForConfirm.id,
        name: selectedPlaceForConfirm.place_name,
        address:
          selectedPlaceForConfirm.address_name ||
          selectedPlaceForConfirm.road_address_name,
        latitude: parseFloat(selectedPlaceForConfirm.y),
        longitude: parseFloat(selectedPlaceForConfirm.x),
      });

      // 서버에서 반환된 memberPlaceId 저장
      if (response.data?.data?.memberPlaceId) {
        setMemberPlaceId(response.data.data.memberPlaceId);
      }

      if (mapRef.current) {
        const position = new (window as any).kakao.maps.LatLng(
          parseFloat(selectedPlaceForConfirm.y),
          parseFloat(selectedPlaceForConfirm.x)
        );
        mapRef.current.setCenter(position);
        mapRef.current.setLevel(3);
      }

      setShowConfirmModal(false);
      setShowVoteModal(true);
    } catch (error) {
      console.error("혼잡도 공유 실패:", error);
      alert("혼잡도 공유에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const getCurrentTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = now.getHours();

    const period = hour < 12 ? "오전" : "오후";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

    return `${year}.${month}.${day} ${period} ${displayHour}시`;
  };

  const getCongestionLevelId = (level: string): number => {
    const levelMap: { [key: string]: number } = {
      LOW: 1, // 여유
      NORMAL: 2, // 보통
      HIGH: 3, // 약간 붐빔
      VERY_HIGH: 4, // 붐빔
    };
    return levelMap[level] || 2; // 기본값: 보통
  };

  const handleVoteSubmit = async () => {
    if (!selectedCongestionLevel) {
      alert("혼잡도 레벨을 선택해주세요.");
      return;
    }

    try {
      // 혼잡도 투표 API 호출
      await api.post("/web/member-congestion", {
        memberPlaceId: memberPlaceId,
        congestionLevelId: getCongestionLevelId(selectedCongestionLevel),
        congestionMessage: comment,
        latitude: parseFloat(selectedPlaceForConfirm.y),
        longitude: parseFloat(selectedPlaceForConfirm.x),
      });

      setShowVoteModal(false);
      setSelectedPlaceForConfirm(null);
      setSelectedCongestionLevel("");
      setComment("");
      setMemberPlaceId(null);
      alert("혼잡도 정보가 공유되었습니다.");
    } catch (error) {
      console.error("혼잡도 투표 실패:", error);
      alert("혼잡도 투표에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleSearchPlace = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const places = new (window as any).kakao.maps.services.Places();

      const map = mapRef.current;
      let lat = 37.5665;
      let lng = 126.978;

      if (userLocation) {
        lat = userLocation.lat;
        lng = userLocation.lng;
      } else if (map) {
        const center = map.getCenter();
        lat = center.getLat();
        lng = center.getLng();
      }

      places.keywordSearch(
        query,
        (data: any, status: any) => {
          setIsSearching(false);

          if (status === (window as any).kakao.maps.services.Status.OK) {
            setSearchResults(data);
          } else if (
            status === (window as any).kakao.maps.services.Status.ZERO_RESULT
          ) {
            setSearchResults([]);
          } else {
            console.error("장소 검색 실패:", status);
            alert("장소 검색에 실패했습니다.");
          }
        },
        {
          location: new (window as any).kakao.maps.LatLng(lat, lng),
          radius: 300,
          size: 15,
        }
      );
    } catch (error) {
      console.error("장소 검색 실패:", error);
      alert("장소 검색에 실패했습니다.");
      setIsSearching(false);
    }
  };

  // 지도 뷰포트 내 장소 조회 (클러스터링 상태 매개변수로 받음)
  const fetchPlacesForViewportWithClustering = async (
    clusteringEnabled: boolean
  ) => {
    if (!mapRef.current) return;
    const myReqId = ++reqIdRef.current;

    try {
      const map = mapRef.current;
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const topLeft = {
        latitude: ne.getLat(),
        longitude: sw.getLng(),
      };
      const bottomRight = {
        latitude: sw.getLat(),
        longitude: ne.getLng(),
      };

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
          let res;
          if (clusteringEnabled) {
            // 클러스터링 적용된 API
            console.log(
              "클러스터링 적용 API 호출 - /web/public/official-place"
            );
            res = await api.post("/web/public/official-place", payload);
          } else {
            // 클러스터링 미적용 API
            console.log(
              "클러스터링 미적용 API 호출 - /app/public/official-place"
            );
            res = await api.post("/app/public/official-place", payload);
          }
          if (reqIdRef.current !== myReqId) return;
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
          const res = await api.post("/web/public/member-place", payload);
          if (reqIdRef.current !== myReqId) return;
          const memberPlaces = res.data?.data ?? [];
          allPlaces = [...allPlaces, ...memberPlaces];
        } catch (e: any) {
          if (e?.code !== "ERR_CANCELED")
            console.error("사용자 장소 조회 실패:", e);
        }
      }

      if (reqIdRef.current !== myReqId) return;

      overlaysRef.current.forEach((ov) => ov.setMap(null));
      overlaysRef.current = [];

      const getMarkerImage = (congestionLevel: string) => {
        const levelMap: { [key: string]: string } = {
          여유: congestionLow,
          보통: congestionNormal,
          "약간 붐빔": congestionCrowded,
          붐빔: congestionVeryCrowded,
        };
        return levelMap[congestionLevel] || levelMap["보통"];
      };

      for (const p of allPlaces) {
        let marker: any;

        // 클러스터링이 비활성화된 경우 모든 장소를 개별 마커로 표시
        if (!clusteringEnabled || p.markerType !== "CLUSTER") {
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
        } else if (p.markerType === "CLUSTER") {
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
        }

        (window as any).kakao.maps.event.addListener(
          marker,
          "click",
          async () => {
            // 클러스터링이 활성화되고 클러스터 마커인 경우에만 확대
            if (clusteringEnabled && p.markerType === "CLUSTER") {
              const position = new (window as any).kakao.maps.LatLng(
                p.coordinate.latitude,
                p.coordinate.longitude
              );
              mapRef.current.setCenter(position);
              mapRef.current.setLevel(mapRef.current.getLevel() - 2);
              return;
            }

            // 개별 장소 클릭 처리
            if (p.placeType && p.placeType !== "OFFICIAL_PLACE") {
              // 사용자 장소 상세 조회
              await loadMemberPlaceDetail(p.placeId);
              return;
            }

            // 공식 장소 상세 조회 (placeId 또는 officialPlaceId 사용)
            const placeId = p.placeId || p.officialPlaceId;
            await loadOfficialPlaceOverview(placeId);
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

  // 지도 뷰포트 내 장소 조회
  const fetchPlacesForViewport = async () => {
    if (!mapRef.current) return;
    const myReqId = ++reqIdRef.current;

    // 현재 클러스터링 상태를 직접 참조
    const currentClusteringState = isClusteringEnabled;

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
          let res;
          if (currentClusteringState) {
            // 클러스터링 적용된 API
            console.log(
              "지도 이동 - 클러스터링 적용 API 호출 - /web/public/official-place"
            );
            res = await api.post("/web/public/official-place", payload);
          } else {
            // 클러스터링 미적용 API
            console.log(
              "지도 이동 - 클러스터링 미적용 API 호출 - /app/public/official-place"
            );
            res = await api.post("/app/public/official-place", payload);
          }
          if (reqIdRef.current !== myReqId) return;
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
          const res = await api.post("/web/public/member-place", payload);
          if (reqIdRef.current !== myReqId) return;
          const memberPlaces = res.data?.data ?? [];
          allPlaces = [...allPlaces, ...memberPlaces];
        } catch (e: any) {
          if (e?.code !== "ERR_CANCELED")
            console.error("사용자 장소 조회 실패:", e);
        }
      }

      if (reqIdRef.current !== myReqId) return;

      overlaysRef.current.forEach((ov) => ov.setMap(null));
      overlaysRef.current = [];

      const getMarkerImage = (congestionLevel: string) => {
        const levelMap: { [key: string]: string } = {
          여유: congestionLow,
          보통: congestionNormal,
          "약간 붐빔": congestionCrowded,
          붐빔: congestionVeryCrowded,
        };
        return levelMap[congestionLevel] || levelMap["보통"];
      };

      for (const p of allPlaces) {
        let marker: any;

        // 클러스터링이 비활성화된 경우 모든 장소를 개별 마커로 표시
        if (!currentClusteringState || p.markerType !== "CLUSTER") {
          // congestionLevelName이 없는 경우 기본값 사용
          const congestionLevel = p.congestionLevelName || "보통";
          const markerImage = new (window as any).kakao.maps.MarkerImage(
            getMarkerImage(congestionLevel),
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
        } else if (p.markerType === "CLUSTER") {
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
        }

        (window as any).kakao.maps.event.addListener(
          marker,
          "click",
          async () => {
            // 클러스터링이 활성화되고 클러스터 마커인 경우에만 확대
            if (currentClusteringState && p.markerType === "CLUSTER") {
              const position = new (window as any).kakao.maps.LatLng(
                p.coordinate.latitude,
                p.coordinate.longitude
              );
              mapRef.current.setCenter(position);
              mapRef.current.setLevel(mapRef.current.getLevel() - 2);
              return;
            }

            // 개별 장소 클릭 처리
            if (p.placeType && p.placeType !== "OFFICIAL_PLACE") {
              // 사용자 장소 상세 조회
              await loadMemberPlaceDetail(p.placeId);
              return;
            }

            // 공식 장소 상세 조회 (placeId 또는 officialPlaceId 사용)
            const placeId = p.placeId || p.officialPlaceId;
            await loadOfficialPlaceOverview(placeId);
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
      if (mapRef.current) {
        // ref를 사용하여 현재 클러스터링 상태를 참조
        fetchPlacesForViewportWithClustering(isClusteringEnabledRef.current);
      }
    }, 250);
  };

  // Kakao 지도 init
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
          script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`;
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
              setUserLocation({ lat, lng });
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
          stopPolygonBlink();
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
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      fetchPlacesForViewportWithClustering(isClusteringEnabled);
    }
  }, [placeFilter]);

  // 초기 로딩 시 마커 표시
  useEffect(() => {
    if (mapRef.current) {
      fetchPlacesForViewportWithClustering(isClusteringEnabled);
    }
  }, []);

  // 개요 공통 로더
  const loadMemberPlaceDetail = async (memberPlaceId: number) => {
    const myReqId = ++overviewReqIdRef.current;

    setShowPlaceDetail(true);
    setSelectedPlace(null);
    stopPolygonBlink();
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    try {
      const res = await api.get(`/web/public/member-place/${memberPlaceId}`);
      if (overviewReqIdRef.current !== myReqId) return;

      const data = res.data?.data;

      // 사용자 장소 정보를 selectedPlace에 저장
      // memberCongestionItems는 리스트로 표시
      setSelectedPlace({
        ...data.memberPlaceSummary,
        memberCongestionItems: data.memberCongestionItems,
        hasNext: data.hasNext,
        nextCursor: data.nextCursor,
        size: data.size,
      });

      // 지도 중심 이동
      if (
        data?.memberPlaceSummary?.latitude &&
        data?.memberPlaceSummary?.longitude
      ) {
        const position = new (window as any).kakao.maps.LatLng(
          data.memberPlaceSummary.latitude,
          data.memberPlaceSummary.longitude
        );
        mapRef.current.setCenter(position);
        mapRef.current.setLevel(3);
      }
    } catch (e) {
      console.error("사용자 장소 정보 조회 실패:", e);
    }
  };

  const loadOfficialPlaceOverview = async (placeId: number) => {
    const myReqId = ++overviewReqIdRef.current;

    setShowPlaceDetail(true);
    setSelectedPlace(null);
    stopPolygonBlink();
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    try {
      const res = await api.get(
        `/web/public/official-place/${placeId}/overview`
      );
      if (overviewReqIdRef.current !== myReqId) return;

      const data = res.data?.data;
      setSelectedPlace(data);

      if (data?.polygonCoordinates) {
        const coords = JSON.parse(data.polygonCoordinates).map(
          ([lng, lat]: number[]) =>
            new (window as any).kakao.maps.LatLng(lat, lng)
        );
        const bounds = new (window as any).kakao.maps.LatLngBounds();
        coords.forEach((coord: any) => bounds.extend(coord));
        mapRef.current.setBounds(bounds);

        const polygon = new (window as any).kakao.maps.Polygon({
          path: coords,
          strokeWeight: 2,
          strokeColor: "#ff6b35",
          strokeOpacity: 0.8,
          strokeStyle: "solid",
          fillColor: "#ff6b35",
          fillOpacity: 0.2,
        });
        polygon.setMap(mapRef.current);
        polygonRef.current = polygon;
        startPolygonBlink();
      } else if (data?.centroidLatitude && data?.centroidLongitude) {
        const position = new (window as any).kakao.maps.LatLng(
          data.centroidLatitude,
          data.centroidLongitude
        );
        mapRef.current.setCenter(position);
        mapRef.current.setLevel(3);
      }
    } catch (e) {
      console.error("공식 장소 정보 조회 실패:", e);
    }
  };

  // 패널 너비 공유 변수
  const currentPanelWidth = isPanelOpen ? panelWidth : 0;

  return (
    <section
      style={
        {
          padding: 0,
          margin: 0,
          height: "calc(100vh - 64px)",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          // @ts-ignore
          "--panel-w": `${currentPanelWidth}px`,
        } as React.CSSProperties
      }
    >
      {error ? (
        <p className="text-danger mb-0" style={{ padding: 12 }}>
          {error}
        </p>
      ) : (
        <>
          {/* 왼쪽 패널 */}
          <div
            style={{
              width: "var(--panel-w)" as any,
              height: "100%",
              background: "white",
              borderRight: "1px solid #e5e5e5",
              overflow: "hidden",
              flexShrink: 0,
              transition: "width 0.3s ease",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* 패널 콘텐츠 */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                width: "100%",
                height: "100%",
                padding: "20px",
                paddingBottom: "80px",
                opacity: isPanelOpen ? 1 : 0,
                transition: "opacity 0.2s ease",
                overflowY: "auto",
                scrollBehavior: "smooth",
              }}
            >
              {/* 즐겨찾기 */}
              <div style={{ marginBottom: "32px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      margin: 0,
                      color: "#2d3748",
                    }}
                  >
                    즐겨찾기
                  </h3>
                </div>

                {/* 즐겨찾기 탭 */}
                <div
                  style={{
                    display: "flex",
                    marginBottom: "16px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    onClick={() => {
                      setFavoriteTab("official");
                      setFavoritePage(0);
                    }}
                    style={{
                      padding: "8px 16px",
                      background: "transparent",
                      border: "none",
                      borderBottom: `2px solid ${
                        favoriteTab === "official" ? "#ff6b35" : "transparent"
                      }`,
                      color: favoriteTab === "official" ? "#ff6b35" : "#666",
                      fontSize: "14px",
                      fontWeight: favoriteTab === "official" ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    공식 장소
                  </button>
                  <button
                    onClick={() => {
                      setFavoriteTab("member");
                      setFavoritePage(0);
                    }}
                    style={{
                      padding: "8px 16px",
                      background: "transparent",
                      border: "none",
                      borderBottom: `2px solid ${
                        favoriteTab === "member" ? "#ff6b35" : "transparent"
                      }`,
                      color: favoriteTab === "member" ? "#ff6b35" : "#666",
                      fontSize: "14px",
                      fontWeight: favoriteTab === "member" ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    사용자 장소
                  </button>
                </div>

                {/* 탭별 즐겨찾기 목록 */}
                {(() => {
                  const filteredPlaces = favoritePlaces.filter((place) =>
                    favoriteTab === "official"
                      ? place.placeType === "OFFICIAL_PLACE"
                      : place.placeType === "MEMBER_PLACE"
                  );
                  const totalPages = Math.ceil(filteredPlaces.length / 5);

                  return (
                    <>
                      {filteredPlaces.length > 5 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            marginBottom: "16px",
                          }}
                        >
                          <button
                            onClick={() =>
                              setFavoritePage(Math.max(0, favoritePage - 1))
                            }
                            disabled={favoritePage === 0}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor:
                                favoritePage === 0 ? "not-allowed" : "pointer",
                              color: favoritePage === 0 ? "#ccc" : "#666",
                              fontSize: "16px",
                              padding: "4px",
                            }}
                          >
                            ←
                          </button>
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            {favoritePage + 1} / {totalPages}
                          </span>
                          <button
                            onClick={() =>
                              setFavoritePage(
                                Math.min(totalPages - 1, favoritePage + 1)
                              )
                            }
                            disabled={favoritePage >= totalPages - 1}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor:
                                favoritePage >= totalPages - 1
                                  ? "not-allowed"
                                  : "pointer",
                              color:
                                favoritePage >= totalPages - 1
                                  ? "#ccc"
                                  : "#666",
                              fontSize: "16px",
                              padding: "4px",
                            }}
                          >
                            →
                          </button>
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {auth?.isAuthed ? (
                          filteredPlaces.length > 0 ? (
                            filteredPlaces
                              .slice(favoritePage * 5, (favoritePage + 1) * 5)
                              .map((place, index) => (
                                <div
                                  key={index}
                                  style={{
                                    display: "flex",
                                    padding: "12px",
                                    background: "#f8f9fa",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    border: "1px solid #e5e7eb",
                                    gap: "12px",
                                    transition: "all 0.2s ease",
                                  }}
                                  onClick={() => {
                                    if (place.placeType === "MEMBER_PLACE") {
                                      loadMemberPlaceDetail(place.placeId);
                                    } else {
                                      loadOfficialPlaceOverview(place.placeId);
                                    }
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      "#ffffff";
                                    e.currentTarget.style.borderColor =
                                      "#ff6b35";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      "#f8f9fa";
                                    e.currentTarget.style.borderColor =
                                      "#e5e7eb";
                                  }}
                                >
                                  {place.imageUrl && (
                                    <img
                                      src={place.imageUrl}
                                      alt={place.name}
                                      style={{
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "6px",
                                        objectFit: "cover",
                                        flexShrink: 0,
                                      }}
                                    />
                                  )}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        marginBottom: "4px",
                                        color: "#2d3748",
                                      }}
                                    >
                                      {place.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        color: "#666",
                                      }}
                                    >
                                      {place.congestionLevelName}
                                    </div>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div
                              style={{
                                padding: "20px",
                                textAlign: "center",
                                color: "#999",
                              }}
                            >
                              {favoriteTab === "official"
                                ? "공식 장소 즐겨찾기가 없습니다"
                                : "사용자 장소 즐겨찾기가 없습니다"}
                            </div>
                          )
                        ) : (
                          <div
                            style={{
                              padding: "20px",
                              textAlign: "center",
                              color: "#999",
                            }}
                          >
                            로그인 후 이용 가능합니다
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* 한적한 스팟 TOP 5 */}
              <div style={{ marginBottom: "32px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "16px",
                    color: "#2d3748",
                  }}
                >
                  한적한 스팟 TOP 5
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {quietSpots.length > 0 ? (
                    quietSpots.slice(0, 5).map((place, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          padding: "12px",
                          background: "#f8f9fa",
                          borderRadius: "8px",
                          cursor: "pointer",
                          border: "1px solid #e5e7eb",
                          gap: "12px",
                          transition: "all 0.2s ease",
                        }}
                        onClick={() =>
                          loadOfficialPlaceOverview(place.officialPlaceId)
                        }
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#ffffff";
                          e.currentTarget.style.borderColor = "#ff6b35";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f8f9fa";
                          e.currentTarget.style.borderColor = "#e5e7eb";
                        }}
                      >
                        {place.imageUrl && (
                          <img
                            src={place.imageUrl}
                            alt={place.officialPlaceName}
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "6px",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              marginBottom: "4px",
                              color: "#2d3748",
                            }}
                          >
                            {place.officialPlaceName}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            {place.congestionLevelName} ·{" "}
                            {Math.round(place.distanceMeters / 100) / 10}km
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#999",
                      }}
                    >
                      데이터 없음
                    </div>
                  )}
                </div>
              </div>

              {/* 붐비는 장소 TOP 5 */}
              <div style={{ marginBottom: "40px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "16px",
                    color: "#2d3748",
                  }}
                >
                  붐비는 장소 TOP 5
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {busySpots.length > 0 ? (
                    busySpots.slice(0, 5).map((place, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          padding: "12px",
                          background: "#f8f9fa",
                          borderRadius: "8px",
                          cursor: "pointer",
                          border: "1px solid #e5e7eb",
                          gap: "12px",
                          transition: "all 0.2s ease",
                        }}
                        onClick={() =>
                          loadOfficialPlaceOverview(place.officialPlaceId)
                        }
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#ffffff";
                          e.currentTarget.style.borderColor = "#ff6b35";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f8f9fa";
                          e.currentTarget.style.borderColor = "#e5e7eb";
                        }}
                      >
                        {place.imageUrl && (
                          <img
                            src={place.imageUrl}
                            alt={place.officialPlaceName}
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "6px",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              marginBottom: "4px",
                              color: "#2d3748",
                            }}
                          >
                            {place.officialPlaceName}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            {place.legalDong} · {place.congestionLevelName}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#999",
                      }}
                    >
                      데이터 없음
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 리사이즈 핸들 */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "4px",
                height: "100%",
                background: "transparent",
                cursor: "col-resize",
                zIndex: 1000,
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = panelWidth;

                const handleMouseMove = (ev: MouseEvent) => {
                  const deltaX = ev.clientX - startX;
                  const newWidth = Math.max(
                    200,
                    Math.min(500, startWidth + deltaX)
                  );
                  setPanelWidth(newWidth);
                  setIsPanelOpen(true);
                };

                const handleMouseUp = () => {
                  document.removeEventListener("mousemove", handleMouseMove);
                  document.removeEventListener("mouseup", handleMouseUp);
                };

                document.addEventListener("mousemove", handleMouseMove);
                document.addEventListener("mouseup", handleMouseUp);
              }}
            />
          </div>

          {/* 오른쪽 지도 영역 */}
          <div
            className={styles.root}
            style={{
              flex: 1,
              height: "100%",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              ref={containerRef}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 0,
                overflow: "hidden",
                background: "#f2f2f2",
                touchAction: "none",
              }}
            />
            <div className={styles.overlay}>
              {/* 토글 버튼 */}
              <button
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 40,
                  height: 40,
                  background: "#ffffff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition:
                    "left 0.3s ease, background 0.2s ease, border-color 0.2s ease",
                  zIndex: 1000,
                  pointerEvents: "auto",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8f9fa";
                  e.currentTarget.style.borderColor = "#ff6b35";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#e5e5e5";
                }}
                aria-label={isPanelOpen ? "왼쪽 패널 접기" : "왼쪽 패널 펼치기"}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isPanelOpen ? "rotate(0deg)" : "rotate(180deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* 줌 컨트롤 */}
              <div
                style={{
                  position: "absolute",
                  bottom: 100,
                  right: 20,
                  background: "#ffffff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                  overflow: "hidden",
                  pointerEvents: "auto",
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <button
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.setLevel(mapRef.current.getLevel() - 1);
                    }
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    background: "#ffffff",
                    border: "none",
                    borderBottom: "1px solid #e5e5e5",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#333",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                  }}
                >
                  +
                </button>
                <button
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.setLevel(mapRef.current.getLevel() + 1);
                    }
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    background: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#333",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                  }}
                >
                  −
                </button>
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
                  onClick={() => {
                    stopPolygonBlink();
                    setShowPlaceDetail(false);
                    setSelectedPlace(null);
                    if (polygonRef.current) {
                      polygonRef.current.setMap(null);
                      polygonRef.current = null;
                    }
                    setPlaceFilter("official");
                  }}
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
                  onClick={() => {
                    stopPolygonBlink();
                    setShowPlaceDetail(false);
                    setSelectedPlace(null);
                    if (polygonRef.current) {
                      polygonRef.current.setMap(null);
                      polygonRef.current = null;
                    }
                    setPlaceFilter("member");
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 20,
                    border: "none",
                    background:
                      placeFilter === "member" ? "#2563eb" : "#ffffff",
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
                  onClick={() => {
                    stopPolygonBlink();
                    setShowPlaceDetail(false);
                    setSelectedPlace(null);
                    if (polygonRef.current) {
                      polygonRef.current.setMap(null);
                      polygonRef.current = null;
                    }
                    setPlaceFilter("both");
                  }}
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

              {/* 클러스터링 토글 버튼 */}
              <div
                style={{
                  position: "absolute",
                  top: 80,
                  left: "50%",
                  transform: "translateX(-50%)",
                  pointerEvents: "auto",
                  zIndex: 10,
                }}
              >
                <button
                  onClick={() => {
                    const newClusteringState = !isClusteringEnabled;
                    setIsClusteringEnabled(newClusteringState);
                    isClusteringEnabledRef.current = newClusteringState;

                    // 즉시 새로운 상태로 API 호출
                    setTimeout(() => {
                      if (mapRef.current) {
                        // 현재 상태를 직접 전달하여 API 호출
                        fetchPlacesForViewportWithClustering(
                          newClusteringState
                        );
                      }
                    }, 100);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 20,
                    border: "none",
                    background: isClusteringEnabled ? "#10b981" : "#ef4444",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: 14,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isClusteringEnabled ? "클러스터링 ON" : "클러스터링 OFF"}
                </button>
              </div>

              {/* 현재 위치 버튼 */}
              <button
                onClick={moveToCurrentLocation}
                disabled={isLocating}
                style={{
                  position: "absolute",
                  top: 80,
                  right: 20,
                  padding: "12px 20px",
                  borderRadius: 24,
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  cursor: isLocating ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: isLocating ? 0.6 : 1,
                  pointerEvents: "auto",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#374151",
                  whiteSpace: "nowrap",
                }}
                title="현재 위치로 이동"
              >
                {isLocating ? (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid #e5e7eb",
                      borderTop: "2px solid #3b82f6",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                ) : (
                  <img
                    src="/icons/my_location.svg"
                    alt="현재 위치"
                    width="16"
                    height="16"
                    style={{
                      filter:
                        "brightness(0) saturate(100%) invert(23%) sepia(8%) saturate(1234%) hue-rotate(201deg) brightness(95%) contrast(86%)",
                    }}
                  />
                )}
                <span>현재 위치로 찾기</span>
              </button>

              {/* 혼잡도 공유 버튼 */}
              <button
                onClick={handleShareCongestion}
                style={{
                  position: "absolute",
                  bottom: 80,
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "12px 24px",
                  borderRadius: 24,
                  border: "none",
                  background: "#ff6b35",
                  boxShadow: "0 4px 16px rgba(255, 107, 53, 0.4)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#ffffff",
                  pointerEvents: "auto",
                  zIndex: 10,
                }}
                title="혼잡도 공유"
              >
                <span style={{ marginRight: "8px", fontSize: "16px" }}>+</span>
                붐빔 알리기
              </button>
            </div>
          </div>

          {/* 장소 상세 정보 패널 */}
          {showPlaceDetail && selectedPlace && (
            <div
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                width: "400px",
                maxHeight: "calc(100% - 40px)",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                zIndex: 1000,
                overflow: "auto",
                pointerEvents: "auto",
              }}
            >
              {/* 헤더 */}
              <div
                style={{ padding: "20px", borderBottom: "1px solid #e5e5e5" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#2d3748",
                      }}
                    >
                      {selectedPlace.officialPlaceName || selectedPlace.name}
                    </h3>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      {selectedPlace.legalDong || selectedPlace.address}
                    </p>
                  </div>
                  <div
                    style={{ display: "flex", gap: "8px", alignItems: "start" }}
                  >
                    {/* 즐겨찾기 버튼 */}
                    <button
                      onClick={async () => {
                        if (!auth?.isAuthed) {
                          alert("로그인이 필요합니다.");
                          return;
                        }
                        try {
                          const placeType =
                            selectedPlace.placeType === "MEMBER_PLACE"
                              ? "MEMBER_PLACE"
                              : "OFFICIAL_PLACE";
                          const placeId =
                            selectedPlace.placeType === "MEMBER_PLACE"
                              ? selectedPlace.memberPlaceId
                              : selectedPlace.officialPlaceId;
                          const placeName =
                            selectedPlace.placeType === "MEMBER_PLACE"
                              ? selectedPlace.name
                              : selectedPlace.officialPlaceName;

                          if (selectedPlace.isFavorite) {
                            await api.delete("/web/favorite", {
                              params: {
                                placeId: placeId,
                                placeType: placeType,
                              },
                            });
                            setSelectedPlace((prev: any) =>
                              prev ? { ...prev, isFavorite: false } : prev
                            );
                            setFavoritePlaces((prev) =>
                              prev.filter((p) => p.placeId !== placeId)
                            );
                            alert("즐겨찾기에서 제거되었습니다.");
                          } else {
                            await api.post("/web/favorite", {
                              placeType: placeType,
                              placeId: placeId,
                            });
                            setSelectedPlace((prev: any) =>
                              prev ? { ...prev, isFavorite: true } : prev
                            );
                            setFavoritePlaces((prev) => {
                              const exists = prev.some(
                                (p) => p.placeId === placeId
                              );
                              return exists
                                ? prev
                                : [
                                    {
                                      placeId: placeId,
                                      name: placeName,
                                      imageUrl: selectedPlace.imageUrl,
                                      congestionLevelName:
                                        selectedPlace.congestionLevelName,
                                    },
                                    ...prev,
                                  ];
                            });
                            alert("즐겨찾기에 추가되었습니다.");
                          }
                        } catch (error) {
                          console.error("즐겨찾기 처리 실패:", error);
                          alert("즐겨찾기 처리에 실패했습니다.");
                        }
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "24px",
                        cursor: "pointer",
                        color: selectedPlace?.isFavorite ? "#ffd700" : "#ccc",
                        padding: "4px 8px",
                      }}
                      title={
                        selectedPlace?.isFavorite
                          ? "즐겨찾기 해제"
                          : "즐겨찾기에 추가"
                      }
                    >
                      {selectedPlace?.isFavorite ? "★" : "☆"}
                    </button>

                    {/* 닫기 버튼 */}
                    <button
                      onClick={() => {
                        stopPolygonBlink();
                        setShowPlaceDetail(false);
                        setSelectedPlace(null);
                        if (polygonRef.current) {
                          polygonRef.current.setMap(null);
                          polygonRef.current = null;
                        }
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "24px",
                        cursor: "pointer",
                        color: "#999",
                        padding: "4px 8px",
                      }}
                      title="닫기"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              {/* 이미지 */}
              {selectedPlace.imageUrl && (
                <div
                  style={{ width: "100%", height: "200px", overflow: "hidden" }}
                >
                  <img
                    src={selectedPlace.imageUrl}
                    alt={selectedPlace.officialPlaceName || selectedPlace.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}

              {/* 혼잡도 정보 */}
              <div style={{ padding: "20px" }}>
                {selectedPlace.placeType === "MEMBER_PLACE" ? (
                  /* 사용자 장소 - 혼잡도 리스트 표시 */
                  <div>
                    <h4
                      style={{
                        margin: "0 0 16px 0",
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      혼잡도 정보
                    </h4>
                    {selectedPlace.memberCongestionItems &&
                    selectedPlace.memberCongestionItems.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {selectedPlace.memberCongestionItems.map(
                          (item: any, index: number) => (
                            <div
                              key={index}
                              style={{
                                padding: "12px",
                                border: "1px solid #e5e5e5",
                                borderRadius: "8px",
                                backgroundColor: "#f9f9f9",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "8px",
                                }}
                              >
                                <img
                                  src={item.memberProfile}
                                  alt={item.memberName}
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                                <span
                                  style={{ fontSize: "14px", fontWeight: 600 }}
                                >
                                  {item.memberName}
                                </span>
                                <div
                                  style={{
                                    padding: "4px 8px",
                                    background:
                                      item.congestionLevelName === "여유"
                                        ? "#e8f5e9"
                                        : item.congestionLevelName === "보통"
                                        ? "#fff3e0"
                                        : item.congestionLevelName ===
                                          "약간 붐빔"
                                        ? "#fce4ec"
                                        : "#ffebee",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color:
                                      item.congestionLevelName === "여유"
                                        ? "#4caf50"
                                        : item.congestionLevelName === "보통"
                                        ? "#ff9800"
                                        : item.congestionLevelName ===
                                          "약간 붐빔"
                                        ? "#e91e63"
                                        : "#f44336",
                                  }}
                                >
                                  {item.congestionLevelName}
                                </div>
                              </div>
                              {item.congestionLevelMessage && (
                                <p
                                  style={{
                                    margin: "0 0 4px 0",
                                    fontSize: "14px",
                                    color: "#666",
                                  }}
                                >
                                  {item.congestionLevelMessage}
                                </p>
                              )}
                              <div style={{ fontSize: "12px", color: "#999" }}>
                                {new Date(item.createdAt).toLocaleString(
                                  "ko-KR"
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          color: "#999",
                          padding: "20px",
                        }}
                      >
                        아직 혼잡도 정보가 없습니다.
                      </div>
                    )}
                  </div>
                ) : (
                  /* 공식 장소 - 기존 혼잡도 표시 */
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 16px",
                        background:
                          selectedPlace.congestionLevelName === "여유"
                            ? "#e8f5e9"
                            : selectedPlace.congestionLevelName === "보통"
                            ? "#fff3e0"
                            : selectedPlace.congestionLevelName === "약간 붐빔"
                            ? "#fce4ec"
                            : "#ffebee",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color:
                          selectedPlace.congestionLevelName === "여유"
                            ? "#4caf50"
                            : selectedPlace.congestionLevelName === "보통"
                            ? "#ff9800"
                            : selectedPlace.congestionLevelName === "약간 붐빔"
                            ? "#e91e63"
                            : "#f44336",
                      }}
                    >
                      {selectedPlace.congestionLevelName}
                    </div>
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      {selectedPlace.observedAt
                        ? new Date(selectedPlace.observedAt).toLocaleTimeString(
                            "ko-KR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : ""}
                    </div>
                  </div>
                )}

                {selectedPlace.placeType !== "MEMBER_PLACE" && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "#333",
                    }}
                  >
                    {selectedPlace.congestionMessage}
                  </p>
                )}

                {/* 실시간 추정 인구수 - 공식 장소만 */}
                {selectedPlace.placeType !== "MEMBER_PLACE" &&
                  (selectedPlace.minimumPopulation ||
                    selectedPlace.maximumPopulation) && (
                    <div style={{ marginTop: "24px" }}>
                      <h4
                        style={{
                          margin: "0 0 12px 0",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#2d3748",
                        }}
                      >
                        실시간 추정 인구수
                      </h4>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <div
                          style={{
                            flex: 1,
                            padding: "12px",
                            background: "#f8f9fa",
                            borderRadius: "8px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginBottom: "4px",
                            }}
                          >
                            최소 인구수
                          </div>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "#2d3748",
                            }}
                          >
                            {selectedPlace.minimumPopulation?.toLocaleString() ??
                              "-"}
                          </div>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            padding: "12px",
                            background: "#f8f9fa",
                            borderRadius: "8px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginBottom: "4px",
                            }}
                          >
                            최대 인구수
                          </div>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "#2d3748",
                            }}
                          >
                            {selectedPlace.maximumPopulation?.toLocaleString() ??
                              "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* 인구 통계 */}
                {selectedPlace.demographics &&
                  selectedPlace.demographics.length > 0 && (
                    <div style={{ marginTop: "24px" }}>
                      <h4
                        style={{
                          margin: "0 0 12px 0",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#2d3748",
                        }}
                      >
                        인구 통계
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {/* 성별 */}
                        {selectedPlace.demographics.filter(
                          (d: any) => d.category === "GENDER"
                        ).length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#666",
                                marginBottom: "6px",
                              }}
                            >
                              성별
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              {selectedPlace.demographics
                                .filter((d: any) => d.category === "GENDER")
                                .map((d: any, i: number) => (
                                  <div
                                    key={i}
                                    style={{
                                      flex: 1,
                                      padding: "8px",
                                      background:
                                        d.subCategory === "MALE"
                                          ? "#e3f2fd"
                                          : "#fce4ec",
                                      borderRadius: "6px",
                                      textAlign: "center",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {d.subCategory === "MALE" ? "남성" : "여성"}{" "}
                                    {d.rate}%
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* 연령대 */}
                        {selectedPlace.demographics.filter(
                          (d: any) => d.category === "AGE_GROUP"
                        ).length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#666",
                                marginBottom: "6px",
                              }}
                            >
                              연령대
                            </div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: "4px",
                              }}
                            >
                              {selectedPlace.demographics
                                .filter((d: any) => d.category === "AGE_GROUP")
                                .slice(0, 8)
                                .map((d: any, i: number) => (
                                  <div
                                    key={i}
                                    style={{
                                      padding: "6px 4px",
                                      background: "#f5f5f5",
                                      borderRadius: "4px",
                                      textAlign: "center",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize:
                                          d.subCategory === "0s"
                                            ? "10px"
                                            : "11px",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {d.subCategory === "0s"
                                        ? "10세 미만"
                                        : `${d.subCategory.replace("s", "")}대`}
                                    </span>
                                    : {d.rate}%
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* 예보 리스트/그래프 - 공식 장소만 */}
                {selectedPlace.placeType !== "MEMBER_PLACE" &&
                  selectedPlace.forecasts &&
                  selectedPlace.forecasts.length > 0 && (
                    <div style={{ marginTop: "24px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#2d3748",
                          }}
                        >
                          혼잡도 예보
                        </h4>
                        <button
                          onClick={() =>
                            setShowForecastAsGraph(!showForecastAsGraph)
                          }
                          style={{
                            padding: "6px 12px",
                            background: showForecastAsGraph
                              ? "#ff6b35"
                              : "transparent",
                            color: showForecastAsGraph ? "white" : "#666",
                            border: `1px solid ${
                              showForecastAsGraph ? "#ff6b35" : "#e5e5e5"
                            }`,
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {showForecastAsGraph
                            ? "리스트 보기"
                            : "그래프로 보기"}
                        </button>
                      </div>
                      {showForecastAsGraph ? (
                        <div
                          style={{
                            height: "300px",
                            background: "#f8f9fa",
                            borderRadius: "8px",
                            position: "relative",
                          }}
                        >
                          <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 400 280"
                            style={{
                              display: "block",
                            }}
                          >
                            {(() => {
                              const forecasts = selectedPlace.forecasts;
                              const maxPop = Math.max(
                                ...forecasts.map(
                                  (f: any) => f.forecastPopulationMax
                                )
                              );
                              const minPop = Math.min(
                                ...forecasts.map(
                                  (f: any) => f.forecastPopulationMin
                                )
                              );
                              const range = maxPop - minPop || 1;
                              const padding = {
                                top: 20,
                                right: 20,
                                bottom: 60,
                                left: 40,
                              };
                              const chartWidth =
                                400 - padding.left - padding.right;
                              const chartHeight =
                                280 - padding.top - padding.bottom;

                              const points = forecasts.map(
                                (forecast: any, i: number) => {
                                  const x =
                                    padding.left +
                                    (i / (forecasts.length - 1)) * chartWidth;
                                  const y =
                                    padding.top +
                                    chartHeight -
                                    ((forecast.forecastPopulationMax - minPop) /
                                      range) *
                                      chartHeight;
                                  return { x, y, forecast };
                                }
                              );

                              const pathData = points
                                .map(
                                  (p: any, i: number) =>
                                    `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
                                )
                                .join(" ");

                              return (
                                <>
                                  {[0, 1, 2, 3, 4].map((i) => {
                                    const y =
                                      padding.top + (chartHeight / 4) * i;
                                    const value = maxPop - (range / 4) * i;
                                    return (
                                      <g key={i}>
                                        <line
                                          x1={padding.left}
                                          y1={y}
                                          x2={400 - padding.right}
                                          y2={y}
                                          stroke="#e0e0e0"
                                          strokeWidth="1"
                                        />
                                        <text
                                          x={padding.left - 5}
                                          y={y + 4}
                                          fontSize="10px"
                                          fill="#666"
                                          textAnchor="end"
                                        >
                                          {Math.round(value / 1000)}K
                                        </text>
                                      </g>
                                    );
                                  })}

                                  <path
                                    d={pathData}
                                    fill="none"
                                    stroke="#ff6b35"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />

                                  {points.map((p: any, i: number) => (
                                    <g key={i}>
                                      <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r="5"
                                        fill="#ff6b35"
                                      />
                                      <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r="3"
                                        fill="white"
                                      />
                                    </g>
                                  ))}

                                  {forecasts.map((forecast: any, i: number) => {
                                    const x =
                                      padding.left +
                                      (i / (forecasts.length - 1)) * chartWidth;
                                    return (
                                      <text
                                        key={i}
                                        x={x}
                                        y={280 - padding.bottom + 12}
                                        fontSize="9px"
                                        fill="#666"
                                        textAnchor="middle"
                                      >
                                        {(() => {
                                          const d = new Date(
                                            forecast.forecastTime
                                          );
                                          const hours = String(
                                            d.getHours()
                                          ).padStart(2, "0");
                                          const minutes = String(
                                            d.getMinutes()
                                          ).padStart(2, "0");
                                          return `${hours}:${minutes}`;
                                        })()}
                                      </text>
                                    );
                                  })}
                                </>
                              );
                            })()}
                          </svg>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            maxHeight: "300px",
                            overflow: "auto",
                          }}
                        >
                          {selectedPlace.forecasts.map(
                            (forecast: any, i: number) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "12px",
                                  background: "#f8f9fa",
                                  borderRadius: "6px",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      color: "#2d3748",
                                    }}
                                  >
                                    {new Date(
                                      forecast.forecastTime
                                    ).toLocaleTimeString("ko-KR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                  <div
                                    style={{ fontSize: "11px", color: "#666" }}
                                  >
                                    {forecast.forecastPopulationMin.toLocaleString()}{" "}
                                    ~{" "}
                                    {forecast.forecastPopulationMax.toLocaleString()}
                                    명
                                  </div>
                                </div>
                                <div
                                  style={{
                                    padding: "6px 12px",
                                    background:
                                      forecast.congestionLevelName === "여유"
                                        ? "#e8f5e9"
                                        : forecast.congestionLevelName ===
                                          "보통"
                                        ? "#fff3e0"
                                        : forecast.congestionLevelName ===
                                          "약간 붐빔"
                                        ? "#fce4ec"
                                        : "#ffebee",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color:
                                      forecast.congestionLevelName === "여유"
                                        ? "#4caf50"
                                        : forecast.congestionLevelName ===
                                          "보통"
                                        ? "#ff9800"
                                        : forecast.congestionLevelName ===
                                          "약간 붐빔"
                                        ? "#e91e63"
                                        : "#f44336",
                                  }}
                                >
                                  {forecast.congestionLevelName}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}
        </>
      )}

      {/* 검색 모달 */}
      {showSearchModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
          }}
          onClick={() => setShowSearchModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #e5e5e5",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#2d3748",
                }}
              >
                장소 검색
              </h3>
              <button
                onClick={() => setShowSearchModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999",
                  padding: "4px 8px",
                }}
              >
                ×
              </button>
            </div>

            {/* 검색 입력 */}
            <div style={{ padding: "20px" }}>
              <input
                type="text"
                placeholder="장소명 또는 카테고리 입력 (예: 카페, 편의점)"
                value={searchQuery}
                onChange={(e) => {
                  const query = e.target.value;
                  setSearchQuery(query);

                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }

                  if (query.trim()) {
                    searchTimeoutRef.current = setTimeout(() => {
                      handleSearchPlace(query);
                    }, 300);
                  } else {
                    setSearchResults([]);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                  fontSize: "16px",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchPlace(searchQuery);
                  }
                }}
              />
            </div>

            {/* 검색 결과 영역 */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 20px 20px 20px",
                minHeight: "300px",
              }}
            >
              {isSearching ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#999",
                  }}
                >
                  검색 중...
                </div>
              ) : searchResults.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {searchResults.map((place, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "12px",
                        border: "1px solid #e5e5e5",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f8f9fa";
                        e.currentTarget.style.borderColor = "#ff6b35";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.borderColor = "#e5e5e5";
                      }}
                      onClick={async () => {
                        setSelectedPlaceForConfirm(place);
                        setShowSearchModal(false);
                        setShowConfirmModal(true);
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#2d3748",
                          marginBottom: "4px",
                        }}
                      >
                        {place.place_name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginBottom: "4px",
                        }}
                      >
                        {place.address_name || place.road_address_name}
                      </div>
                      {place.category_name && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#999",
                          }}
                        >
                          {place.category_name.split(">").slice(-1)[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#999",
                  }}
                >
                  {searchQuery
                    ? "검색 결과가 없습니다"
                    : "검색할 장소명을 입력하세요"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 로그인 모달 */}
      <LoginModal
        show={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* 장소 확인 모달 (StaticMap) */}
      {showConfirmModal && selectedPlaceForConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "24px",
              width: "90%",
              maxWidth: "400px",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ overflow: "auto", flex: 1 }}>
              {/* 헤더 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedPlaceForConfirm(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    marginRight: "12px",
                  }}
                >
                  ←
                </button>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#2d3748",
                    margin: 0,
                  }}
                >
                  장소가 맞는지 확인해주세요
                </h2>
              </div>

              {/* 장소 정보 */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#2d3748",
                    marginBottom: "8px",
                  }}
                >
                  {selectedPlaceForConfirm.place_name}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#718096",
                  }}
                >
                  {selectedPlaceForConfirm.address_name ||
                    selectedPlaceForConfirm.road_address_name}
                </div>
              </div>

              {/* ✅ 정적 지도 (StaticMap) 미리보기 */}
              <div
                ref={confirmModalMapContainerRef}
                style={{
                  height: "200px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                }}
              />

              {/* 확인 버튼 */}
              <button
                onClick={handleConfirmPlace}
                style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor: "#ff6b35",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e55a2b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ff6b35";
                }}
              >
                이 위치로 등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 혼잡도 투표 모달 (StaticMap) */}
      {showVoteModal && selectedPlaceForConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "24px",
              width: "95%",
              maxWidth: "500px",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ overflow: "auto", flex: 1 }}>
              {/* 헤더 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <button
                  onClick={() => {
                    setShowVoteModal(false);
                    setSelectedPlaceForConfirm(null);
                    setSelectedCongestionLevel("");
                    setComment("");
                    setMemberPlaceId(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    marginRight: "12px",
                  }}
                >
                  ←
                </button>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#2d3748",
                    margin: 0,
                  }}
                >
                  알리기
                </h2>
              </div>

              {/* 현재 시간 */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#718096",
                    marginBottom: "8px",
                  }}
                >
                  현재 시각
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#2d3748",
                  }}
                >
                  {getCurrentTimeString()}
                </div>
              </div>

              {/* 현재 위치 */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#718096",
                    marginBottom: "8px",
                  }}
                >
                  현재 위치
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    backgroundColor: "#f7fafc",
                    fontSize: "14px",
                    color: "#2d3748",
                  }}
                >
                  {selectedPlaceForConfirm.place_name}
                </div>
              </div>

              {/* ✅ 정적 지도 (StaticMap) 미리보기 */}
              <div
                ref={voteModalMapContainerRef}
                style={{
                  height: "200px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                }}
              />

              {/* 혼잡도 선택 */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#718096",
                    marginBottom: "12px",
                  }}
                >
                  혼잡도를 투표해주세요
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  {[
                    { level: "여유", value: "LOW" },
                    { level: "보통", value: "NORMAL" },
                    { level: "약간 붐빔", value: "HIGH" },
                    { level: "붐빔", value: "VERY_HIGH" },
                  ].map(({ level, value }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedCongestionLevel(value)}
                      style={{
                        padding: "12px",
                        border: `2px solid ${
                          selectedCongestionLevel === value
                            ? "#ff6b35"
                            : "#e2e8f0"
                        }`,
                        borderRadius: "8px",
                        backgroundColor: "white",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#2d3748",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCongestionLevel !== value) {
                          e.currentTarget.style.borderColor = "#ff6b35";
                          e.currentTarget.style.backgroundColor = "#fff5f0";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCongestionLevel !== value) {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.backgroundColor = "white";
                        }
                      }}
                    >
                      <div>{level}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 댓글 입력 */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#718096",
                    marginBottom: "8px",
                  }}
                >
                  주변 상황 설명을 남겨주세요.
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="상황을 자세히 설명해주세요..."
                  maxLength={500}
                  style={{
                    width: "100%",
                    height: "80px",
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "none",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <div
                  style={{
                    textAlign: "right",
                    fontSize: "12px",
                    color: "#718096",
                    marginTop: "4px",
                  }}
                >
                  {comment.length}/500자
                </div>
              </div>

              {/* 공유하기 버튼 */}
              <button
                onClick={handleVoteSubmit}
                style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor: selectedCongestionLevel
                    ? "#ff6b35"
                    : "#e2e8f0",
                  color: selectedCongestionLevel ? "white" : "#718096",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: selectedCongestionLevel ? "pointer" : "not-allowed",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (selectedCongestionLevel) {
                    e.currentTarget.style.backgroundColor = "#e55a2b";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCongestionLevel) {
                    e.currentTarget.style.backgroundColor = "#ff6b35";
                  }
                }}
              >
                공유하기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
