import '../styles/Header.css'

interface HeaderProps {
  onSearchClick: () => void;
  onLogout: () => void;
  userEmail?: string;
}

const Header = ({ onSearchClick, onLogout, userEmail }: HeaderProps) => {
  return (
    <header className="header">
      <div className="container">
        <h1>Dashboard de Entrenamientos</h1>
        <div className="header-actions">
          <div className="legend">
            <div className="legend-item">
              <div className="dot paid"></div>
              <span>Pagado</span>
            </div>
            <div className="legend-item">
              <div className="dot pending"></div>
              <span>Pendiente</span>
            </div>
          </div>
          <div className="user-actions">
            {userEmail && (
              <div className="user-info">
                {userEmail}
                <button 
                  className="btn-logout" 
                  onClick={onLogout}
                  title="Cerrar sesión"
                >
                  🚪
                </button>
              </div>
            )}
            <button 
              className="btn-search" 
              onClick={onSearchClick}
              title="Buscar y generar reportes"
            >
              🔍
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 