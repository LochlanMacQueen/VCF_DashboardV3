import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { DataProvider, useData } from './context/DataContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Loading from './pages/Loading'
import NoAccount from './pages/NoAccount'
import Overview from './pages/Overview'
import Analytics from './pages/Analytics'
import Meetings from './pages/Meetings'
import Pitches from './pages/Pitches'
import Watchlist from './pages/Watchlist'
import Chat from './pages/Chat'
import Resources from './pages/Resources'
import Account from './pages/Account'
import VoteManagement from './pages/VoteManagement'
import DataTools from './pages/DataTools'

function MemberOnly({ children }) {
  const { role } = useData()
  if (role !== 'member' && role !== 'admin') {
    return <Navigate to="/overview" replace />
  }
  return children
}

function AdminOnly({ children }) {
  const { role } = useData()
  if (role !== 'admin') return <Navigate to="/overview" replace />
  return children
}

function Authenticated() {
  const { loading: dataLoading, myAccount, accounts } = useData()
  if (dataLoading && accounts.length === 0) return <Loading />
  if (!myAccount) return <NoAccount />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<Overview />} />
        <Route
          path="/analytics"
          element={
            <MemberOnly>
              <Analytics />
            </MemberOnly>
          }
        />
        <Route
          path="/meetings"
          element={
            <MemberOnly>
              <Meetings />
            </MemberOnly>
          }
        />
        <Route
          path="/pitches"
          element={
            <MemberOnly>
              <Pitches />
            </MemberOnly>
          }
        />
        <Route
          path="/watchlist"
          element={
            <MemberOnly>
              <Watchlist />
            </MemberOnly>
          }
        />
        <Route
          path="/chat"
          element={
            <MemberOnly>
              <Chat />
            </MemberOnly>
          }
        />
        <Route
          path="/resources"
          element={
            <MemberOnly>
              <Resources />
            </MemberOnly>
          }
        />
        <Route
          path="/account"
          element={
            <MemberOnly>
              <Account />
            </MemberOnly>
          }
        />
        <Route
          path="/votes"
          element={
            <AdminOnly>
              <VoteManagement />
            </AdminOnly>
          }
        />
        <Route
          path="/data-tools"
          element={
            <AdminOnly>
              <DataTools />
            </AdminOnly>
          }
        />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) return <Loading label="Restoring session…" />
  if (!user) return <Login />

  return (
    <DataProvider>
      <Authenticated />
    </DataProvider>
  )
}
