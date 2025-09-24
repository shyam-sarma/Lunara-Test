import { useState } from "react";
import { Header } from "./components/Header";
import { Screen1 } from "./components/Screen1";
import { Screen2 } from "./components/Screen2";
import { SourceDialog } from "./components/SourceDialog";
import { ContextDialog } from "./components/ContextDialog";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    "screen1" | "screen2"
  >("screen1");
  const [showSourceDialog, setShowSourceDialog] =
    useState(false);
  const [showContextDialog, setShowContextDialog] =
    useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        onSourceClick={() => setShowSourceDialog(true)}
        onContextClick={() => setShowContextDialog(true)}
      />

      <main className="flex-1 overflow-hidden">
        {currentScreen === "screen1" ? (
          <Screen1 />
        ) : (
          <Screen2 />
        )}
      </main>

      <SourceDialog
        open={showSourceDialog}
        onOpenChange={setShowSourceDialog}
      />

      <ContextDialog
        open={showContextDialog}
        onOpenChange={setShowContextDialog}
      />
    </div>
  );
}