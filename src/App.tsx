import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/common/AppShell";
import { useLearningStore } from "./stores/useLearningStore";

const TodayPage = lazy(() => import("./pages/TodayPage").then((module) => ({ default: module.TodayPage })));
const MapPage = lazy(() => import("./pages/MapPage").then((module) => ({ default: module.MapPage })));
const LessonPage = lazy(() => import("./pages/LessonPage").then((module) => ({ default: module.LessonPage })));
const PronunciationPage = lazy(() => import("./pages/PronunciationPage").then((module) => ({ default: module.PronunciationPage })));
const LibraryPage = lazy(() => import("./pages/LibraryPage").then((module) => ({ default: module.LibraryPage })));
const GrammarPage = lazy(() => import("./pages/GrammarPage").then((module) => ({ default: module.GrammarPage })));
const StoriesPage = lazy(() => import("./pages/StoriesPage").then((module) => ({ default: module.StoriesPage })));
const ReviewPage = lazy(() => import("./pages/ReviewPage").then((module) => ({ default: module.ReviewPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage").then((module) => ({ default: module.OnboardingPage })));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage").then((module) => ({ default: module.DiscoverPage })));
const ContentQAPage = lazy(() => import("./pages/ContentQAPage").then((module) => ({ default: module.ContentQAPage })));

export function App() {
  const init = useLearningStore((state) => state.init);
  const ready = useLearningStore((state) => state.ready);
  const preferences = useLearningStore((state) => state.preferences);
  const onboarded = useLearningStore((state) => state.onboarded);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    const reduce = preferences?.reduceMotion ? "reduce" : "no-preference";
    document.documentElement.dataset.motion = reduce;
    document.documentElement.dataset.theme = preferences?.theme ?? "system";
  }, [preferences]);

  if (!ready) {
    return <main className="boot-screen">英语星球正在整理今天的学习路线...</main>;
  }

  return (
    <Suspense fallback={<main className="boot-screen">正在打开这个学习入口...</main>}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={onboarded ? <AppShell /> : <Navigate to="/onboarding" replace />}>
          <Route index element={<TodayPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/pronunciation" element={<PronunciationPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/grammar" element={<GrammarPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {import.meta.env.DEV && <Route path="/content-qa" element={<ContentQAPage />} />}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
