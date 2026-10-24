import { useEffect, useState } from 'react'
import { getHealth } from './api/health'
import './App.css'

function App() {
  const [connection, setConnection] = useState({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    getHealth(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setConnection({ status: 'success', data })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setConnection({ status: 'error' })
        }
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="app">
      <header>
        <p className="eyebrow">SCRUM-69 · Project setup</p>
        <h1>Restaurant Management System</h1>
        <p>Hệ thống quản lý đặt món và vận hành bếp nhà hàng</p>
      </header>

      <section className="connection" aria-labelledby="connection-heading">
        <h2 id="connection-heading">Kiểm tra kết nối Backend</h2>
        <p className={`status status--${connection.status}`} role="status">
          {connection.status === 'loading' && 'Đang kết nối...'}
          {connection.status === 'success' && connection.data.message}
          {connection.status === 'error' && 'Không kết nối được Backend'}
        </p>
        {connection.status === 'error' && (
          <p>Kiểm tra Backend đang chạy và cấu hình API, sau đó tải lại trang.</p>
        )}
      </section>
    </main>
  )
}

export default App