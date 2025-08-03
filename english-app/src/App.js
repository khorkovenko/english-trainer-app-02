// src/App.js
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAuthUser, signOut } from './features/loginModal/authSlice'

import Vocabulary from './features/01vocabulary/Vocabulary'
import Grammar from './features/02grammar/Grammar'
import Reading from './features/03reading/Reading'
import Listening from './features/04listening/Listening'
import Speaking from './features/05speaking/Speaking'
import Writing from './features/06writing/Writing'
import Mistakes from './features/07mistakes/Mistakes'

import { Menubar } from 'primereact/menubar'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { TabPanel, TabView } from 'primereact/tabview'

import LoginModal from './features/loginModal/LoginModal'

import { ProgressSpinner } from 'primereact/progressspinner'
import { supabaseClient } from './app/supabaseClient'

function App() {
    const dispatch = useDispatch()
    const { user, status, error } = useSelector(state => state.auth)

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [loginVisible, setLoginVisible] = useState(false)

    // Fetch user on app mount and on auth state change
    useEffect(() => {
        dispatch(fetchAuthUser())

        const { data: authListener } = supabaseClient.auth.onAuthStateChange(() => {
            dispatch(fetchAuthUser())
        })

        return () => {
            authListener?.unsubscribe()
        }
    }, [dispatch])

    // Responsive tabs
    useEffect(() => {
        function handleResize() {
            setIsMobile(window.innerWidth < 768)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Show login modal if no user after fetch succeeded
    useEffect(() => {
        if (status === 'succeeded' && !user) setLoginVisible(true)
        else setLoginVisible(false)
    }, [status, user])

    const menuItems = [
        { label: 'English Trainer', icon: 'pi pi-book' },
        {
            label: user ? `Logout (${user.email})` : 'Login',
            icon: user ? 'pi pi-sign-out' : 'pi pi-sign-in',
            command: () => {
                if (user) {
                    dispatch(signOut())
                } else {
                    setLoginVisible(true)
                }
            },
        },
    ]

    const tabs = [
        { header: 'Vocabulary', content: <Vocabulary /> },
        { header: 'Grammar', content: <Grammar /> },
        { header: 'Reading', content: <Reading /> },
        { header: 'Listening', content: <Listening /> },
        { header: 'Speaking', content: <Speaking /> },
        { header: 'Writing', content: <Writing /> },
        { header: 'Mistakes', content: <Mistakes /> },
    ]

    return (
        <div className="h-screen flex flex-col">
            {status === 'loading' && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        width: '100vw',
                    }}
                >
                    <ProgressSpinner />
                </div>
            )}

            {/* Debug info */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 5,
                    left: 5,
                    color: '#888',
                    fontSize: 12,
                    zIndex: 10000,
                    userSelect: 'none',
                }}
            >
                Status: {status} <br />
                User: {user ? user.email : 'No user'} <br />
                {error && <span style={{ color: 'red' }}>Error: {error}</span>}
            </div>

            <LoginModal visible={loginVisible} onHide={() => setLoginVisible(false)} />

            {status === 'succeeded' && user && (
                <>
                    <Menubar model={menuItems} />
                    <div className="p-4 flex-grow overflow-auto">
                        {isMobile ? (
                            <Accordion multiple>
                                {tabs.map(({ header, content }) => (
                                    <AccordionTab key={header} header={header}>
                                        {content}
                                    </AccordionTab>
                                ))}
                            </Accordion>
                        ) : (
                            <TabView>
                                {tabs.map(({ header, content }) => (
                                    <TabPanel key={header} header={header}>
                                        {content}
                                    </TabPanel>
                                ))}
                            </TabView>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default App
