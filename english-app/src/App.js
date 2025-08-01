import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUser } from './features/userSlice'

function App() {
  const dispatch = useDispatch()
  const user = useSelector(state => state.user.user)
  const status = useSelector(state => state.user.status)

  useEffect(() => {
    dispatch(fetchUser())
  }, [dispatch])

  return (
      <div style={{ padding: 20 }}>
        <h1>{status === 'loading' ? 'Loading...' : user ? `Hello ${user.name}` : 'No user found'}</h1>
      </div>
  )
}

export default App
