import { Button } from "./ui/button";

interface HeaderProps {
  currentScreen: 'screen1' | 'screen2';
  onScreenChange: (screen: 'screen1' | 'screen2') => void;
  onSourceClick: () => void;
  onContextClick: () => void;
}

export function Header({ currentScreen, onScreenChange, onSourceClick, onContextClick }: HeaderProps) {
  return (
    <header className="h-12 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Button
          onClick={onSourceClick}
          className="bg-accent hover:bg-accent/90 text-accent-foreground border-accent"
          style={{
            fontFamily: 'var(--font-family-sans)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-normal)',
            borderRadius: 'var(--radius-button)'
          }}
          size="sm"
        >
          Source
        </Button>
        <Button
          onClick={onContextClick}
          className="bg-accent hover:bg-accent/90 text-accent-foreground border-accent"
          style={{
            fontFamily: 'var(--font-family-sans)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-normal)',
            borderRadius: 'var(--radius-button)'
          }}
          size="sm"
        >
          Context
        </Button>
      </div>
      
      <nav className="flex items-center gap-1">
        <Button
          variant={currentScreen === 'screen1' ? 'default' : 'ghost'}
          onClick={() => onScreenChange('screen1')}
          style={{
            fontFamily: 'var(--font-family-sans)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-normal)',
            borderRadius: 'var(--radius-button)'
          }}
          size="sm"
        >
          Screen 1
        </Button>
        <Button
          variant={currentScreen === 'screen2' ? 'default' : 'ghost'}
          onClick={() => onScreenChange('screen2')}
          style={{
            fontFamily: 'var(--font-family-sans)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-normal)',
            borderRadius: 'var(--radius-button)'
          }}
          size="sm"
        >
          Screen 2
        </Button>
      </nav>
    </header>
  );
}