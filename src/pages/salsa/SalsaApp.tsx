import { Navigate, Route, Routes } from "react-router-dom";
import { SalsaLayout } from "@/components/salsa/SalsaLayout";
import { SalsaHomePage } from "./SalsaHomePage";
import { SalsaLibraryPage } from "./SalsaLibraryPage";
import { SalsaAnalyticsPage } from "./SalsaAnalyticsPage";
import { SalsaSettingsPage } from "./SalsaSettingsPage";
import { SalsaPlaceholderPage } from "./SalsaPlaceholderPage";
import { SalsaLibraryProvider } from "@/contexts/SalsaLibraryContext";

export function SalsaApp() {
  return (
    <SalsaLibraryProvider>
      <Routes>
      <Route element={<SalsaLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<SalsaHomePage />} />
        <Route path="library" element={<SalsaLibraryPage />} />
        <Route path="analytics" element={<SalsaAnalyticsPage />} />
        <Route path="settings" element={<SalsaSettingsPage />} />
        <Route
          path="playlists"
          element={
            <SalsaPlaceholderPage
              title="Playlists"
              icon="🎶"
              description="Organise your boards and videos into themed playlists."
            />
          }
        />
        <Route
          path="editor"
          element={
            <SalsaPlaceholderPage
              title="Whiteboard Editor"
              icon="✏️"
              description="Annotate videos, draw diagrams, and add timestamped notes."
            />
          }
        />
        <Route
          path="shared"
          element={
            <SalsaPlaceholderPage
              title="Shared with Me"
              icon="👥"
              description="Boards and videos your instructors and partners have shared with you."
            />
          }
        />
        <Route
          path="instructor"
          element={
            <SalsaPlaceholderPage
              title="Instructor Mode"
              icon="🎓"
              description="Create classes, share boards with students, and track their progress."
            />
          }
        />
      </Route>
      </Routes>
    </SalsaLibraryProvider>
  );
}
