import './desktop-only-message.css'

export function DesktopOnlyMessage() {
  return (
    <div className="desktop-only-message">
      <div className="desktop-only-content">
        <div className="desktop-only-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 16v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1>Планшеты и телефоны не поддерживаются</h1>
        <p>
          Это приложение не поддерживает работу на планшетах и телефонах. 
          Для работы откройте его на компьютере или ноутбуке.
        </p>
        <div className="desktop-only-requirements">
          <h3>Поддерживаемые устройства:</h3>
          <ul>
            <li>Компьютеры и ноутбуки</li>
            <li>Минимальная ширина экрана: 1024 пикселя</li>
          </ul>
        </div>
      </div>
    </div>
  )
}