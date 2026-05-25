import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <h1 className="logo">Interesthub</h1>
        <p className="tagline">관심사 기반 커뮤니티</p>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <p>Interesthub User App</p>
      </footer>
    </div>
  )
}

export default Layout
