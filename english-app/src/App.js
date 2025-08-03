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

    // Fetch user on mount and listen to auth state changes
    useEffect(() => {
        dispatch(fetchAuthUser())

        const { data: authListener } = supabaseClient.auth.onAuthStateChange(() => {
            dispatch(fetchAuthUser())
        })

        return () => {
            authListener?.unsubscribe()
        }
    }, [dispatch])

    // Update on window resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const menuItems = [
        { label: 'English Trainer', icon: 'pi pi-book' },
        {
            label: user ? `Logout (${user.email})` : 'Login',
            icon: user ? 'pi pi-sign-out' : 'pi pi-sign-in',
            command: () => {
                if (user) dispatch(signOut())
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
                <div className="flex justify-center items-center h-screen w-screen">
                    <ProgressSpinner />
                </div>
            )}

            {/* Login modal shown only when needed */}
            <LoginModal visible={!user && status === 'succeeded'} />

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
