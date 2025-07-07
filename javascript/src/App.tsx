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
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: 32,
        boxSizing: 'border-box',
      }}
    >
      <Game />
    </div>
  );
}

export default App;
