import Game from './components/Game';

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#23272f',
        padding: 32,
        boxSizing: 'border-box',
      }}
    >
      <Game />
    </div>
  );
}

export default App;
